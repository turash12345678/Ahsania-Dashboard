import db from '@/lib/db';
import { validateSale } from '@/lib/validation';

export async function POST(request) {
    try {
        const body = await request.json();
        const { items, payment_method, total_amount, user_id } = body;

        // Validation step 1: Basic validation
        const validation = validateSale({
            items,
            payment_method,
            total_amount
        });

        if (!validation.isValid) {
            return new Response(JSON.stringify({
                error: 'Validation failed',
                details: validation.errors
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Validation step 2: Check stock availability for products
        const stockCheckResults = await Promise.all(
            items
                .filter(item => item.type === 'product')
                .map(async (item) => {
                    const result = await db.execute({
                        sql: 'SELECT id, stock_quantity FROM products WHERE id = ?',
                        args: [item.id]
                    });

                    if (!result.rows || result.rows.length === 0) {
                        return {
                            itemId: item.id,
                            available: false,
                            message: `Product ID ${item.id} not found`
                        };
                    }

                    const product = result.rows[0];
                    if (product.stock_quantity < item.quantity) {
                        return {
                            itemId: item.id,
                            available: false,
                            message: `Insufficient stock for product ${item.id}. Available: ${product.stock_quantity}, Requested: ${item.quantity}`
                        };
                    }

                    return { itemId: item.id, available: true };
                })
        );

        // Check for stock issues
        const stockIssues = stockCheckResults.filter(r => !r.available);
        if (stockIssues.length > 0) {
            return new Response(JSON.stringify({
                error: 'Stock availability error',
                details: stockIssues.map(s => s.message)
            }), {
                status: 409, // Conflict status code
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Validation step 3: Check services exist
        const serviceItems = items.filter(item => item.type === 'service');
        if (serviceItems.length > 0) {
            const serviceCheckResults = await Promise.all(
                serviceItems.map(async (item) => {
                    const result = await db.execute({
                        sql: 'SELECT id FROM services WHERE id = ?',
                        args: [item.id]
                    });
                    return {
                        itemId: item.id,
                        exists: result.rows && result.rows.length > 0
                    };
                })
            );

            const missingServices = serviceCheckResults.filter(r => !r.exists);
            if (missingServices.length > 0) {
                return new Response(JSON.stringify({
                    error: 'Service not found',
                    details: missingServices.map(s => `Service ID ${s.itemId} not found`)
                }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        }

        // All validations passed - proceed with transaction
        let transaction;
        try {
            transaction = await db.transaction('write');
        } catch {
            return new Response(JSON.stringify({
                error: 'Database connection error. Please try again.'
            }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        try {
            // 1. Insert Sale Record
            const saleResult = await transaction.execute({
                sql: 'INSERT INTO sales (user_id, total_amount, payment_method) VALUES (?, ?, ?)',
                args: [user_id || 1, parseFloat(total_amount), payment_method]
            });
            const saleId = saleResult.lastInsertRowid;

            // 2. Insert Sale Items and Update Stock
            for (const item of items) {
                let buyPriceAtSale = 0;

                if (item.type === 'product') {
                    // Fetch current buy_price for profit tracking
                    const prodRes = await transaction.execute({
                        sql: 'SELECT buy_price FROM products WHERE id = ?',
                        args: [item.id]
                    });
                    if (prodRes.rows && prodRes.rows.length > 0) {
                        buyPriceAtSale = prodRes.rows[0].buy_price || 0;
                    }
                }

                const itemResult = await transaction.execute({
                    sql: 'INSERT INTO sale_items (sale_id, item_type, item_id, quantity, price_at_sale, buy_price_at_sale) VALUES (?, ?, ?, ?, ?, ?)',
                    args: [saleId, item.type, item.id, item.quantity, parseFloat(item.price), buyPriceAtSale]
                });

                // [NEW] FIFO Allocation Logic
                if (item.type === 'product') {
                    const saleItemId = itemResult.lastInsertRowid;

                    // Update Stock (Standard)
                    const updateResult = await transaction.execute({
                        sql: 'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
                        args: [item.quantity, item.id]
                    });

                    if (updateResult.rowsAffected === 0) {
                        throw new Error(`Failed to update stock for product ${item.id}`);
                    }

                    // [NEW] Allocate from Stock Logs
                    const logsResult = await transaction.execute({
                        sql: `SELECT id, remaining_quantity FROM stock_logs 
                               WHERE product_id = ? AND remaining_quantity > 0 
                               ORDER BY created_at ASC`,
                        args: [item.id]
                    });

                    let qtyNeeded = item.quantity;
                    const logs = logsResult.rows;

                    for (const log of logs) {
                        if (qtyNeeded <= 0) break;

                        const take = Math.min(log.remaining_quantity, qtyNeeded);

                        // Deduct from log
                        await transaction.execute({
                            sql: `UPDATE stock_logs SET remaining_quantity = remaining_quantity - ? WHERE id = ?`,
                            args: [take, log.id]
                        });

                        // Link sale item to this batch
                        await transaction.execute({
                            sql: `INSERT INTO sale_batch_allocations (sale_item_id, stock_log_id, quantity) VALUES (?, ?, ?)`,
                            args: [saleItemId, log.id, take]
                        });

                        qtyNeeded -= take;
                    }
                }
            }

            await transaction.commit();
            const saleIdString = saleId.toString();

            return new Response(JSON.stringify({
                success: true,
                saleId: saleIdString,
                message: 'Sale recorded successfully'
            }), {
                status: 201,
                headers: { 'Content-Type': 'application/json' },
            });
        } catch (err) {
            try {
                await transaction.rollback();
            } catch (rollbackErr) {
                console.error('Rollback error:', rollbackErr);
            }
            throw err;
        }

    } catch (error) {
        console.error('Sale Error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to process sale',
            message: error.message,
            timestamp: new Date().toISOString()
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return new Response(JSON.stringify({ error: 'Sale ID is required' }), { status: 400 });
        }

        const transaction = await db.transaction('write');

        try {
            // 1. Get items to restore stock
            const itemsResult = await transaction.execute({
                sql: "SELECT id, item_id, quantity, item_type FROM sale_items WHERE sale_id = ?",
                args: [id]
            });

            // 2. Restore Stock (Products & FIFO Logs)
            if (itemsResult.rows.length > 0) {
                for (const item of itemsResult.rows) {
                    if (item.item_type === 'product') {
                        // A. Restore Global Stock
                        await transaction.execute({
                            sql: "UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?",
                            args: [item.quantity, item.item_id]
                        });

                        // B. Restore FIFO Logs (allocations)
                        // Find allocations for this sale item
                        const allocationsResult = await transaction.execute({
                            sql: "SELECT stock_log_id, quantity FROM sale_batch_allocations WHERE sale_item_id = ?",
                            args: [item.id]
                        });

                        for (const alloc of allocationsResult.rows) {
                            // Restore quantity to the specific batch/log
                            await transaction.execute({
                                sql: "UPDATE stock_logs SET remaining_quantity = remaining_quantity + ? WHERE id = ?",
                                args: [alloc.quantity, alloc.stock_log_id]
                            });
                        }

                        // C. Delete Allocations
                        await transaction.execute({
                            sql: "DELETE FROM sale_batch_allocations WHERE sale_item_id = ?",
                            args: [item.id]
                        });
                    }
                }
            }

            // 3. Delete sale items
            await transaction.execute({
                sql: "DELETE FROM sale_items WHERE sale_id = ?",
                args: [id]
            });

            // 4. Delete sale record
            await transaction.execute({
                sql: "DELETE FROM sales WHERE id = ?",
                args: [id]
            });

            await transaction.commit();

            return new Response(JSON.stringify({ success: true, message: 'Sale deleted and stock restored' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (error) {
        console.error('Sale DELETE Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to delete sale' }), { status: 500 });
    }
}
