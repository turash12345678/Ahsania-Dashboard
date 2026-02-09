import db from '@/lib/db';
import { validateProduct, sanitizeInput } from '@/lib/validation';

export async function GET(request) {
    try {
        const result = await db.execute(`
            SELECT products.*, categories.name as category_name,
            (SELECT COALESCE(SUM(quantity), 0) FROM sale_items WHERE item_id = products.id AND item_type = 'product') as sales_count
            FROM products 
            LEFT JOIN categories ON products.category_id = categories.id 
            ORDER BY products.name
        `);

        // Ensure all numbers are properly formatted
        const formattedRows = result.rows?.map(row => ({
            ...row,
            buy_price: parseFloat(row.buy_price || 0),
            sell_price: parseFloat(row.sell_price || 0),
            stock_quantity: parseInt(row.stock_quantity || 0),
            sales_count: parseInt(row.sales_count || 0)
        })) || [];

        return new Response(JSON.stringify(formattedRows), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Products GET Error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to fetch products',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, category_id, buy_price, sell_price, stock_quantity, created_at } = body;

        // Sanitize inputs
        const sanitizedName = sanitizeInput(name);

        // Validate
        const validation = validateProduct({
            name: sanitizedName,
            buy_price: parseFloat(buy_price),
            sell_price: parseFloat(sell_price),
            stock_quantity: (stock_quantity === '' || stock_quantity === undefined || stock_quantity === null) ? 0 : parseInt(stock_quantity)
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

        // Check for duplicate product name
        const duplicateCheck = await db.execute({
            sql: 'SELECT id FROM products WHERE LOWER(name) = LOWER(?) LIMIT 1',
            args: [sanitizedName]
        });

        if (duplicateCheck.rows && duplicateCheck.rows.length > 0) {
            return new Response(JSON.stringify({
                error: 'Product already exists',
                details: ['A product with this name already exists']
            }), {
                status: 409, // Conflict
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // If category_id is provided, verify it exists
        if (category_id) {
            const categoryCheck = await db.execute({
                sql: 'SELECT id FROM categories WHERE id = ?',
                args: [category_id]
            });

            if (!categoryCheck.rows || categoryCheck.rows.length === 0) {
                return new Response(JSON.stringify({
                    error: 'Invalid category',
                    details: [`Category ID ${category_id} does not exist`]
                }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        }

        // POST Update
        const result = await db.execute({
            sql: 'INSERT INTO products (name, category_id, buy_price, sell_price, stock_quantity, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            args: [
                sanitizedName,
                category_id || null,
                parseFloat(buy_price),
                parseFloat(sell_price),
                (stock_quantity === '' || stock_quantity === undefined || stock_quantity === null) ? 0 : parseInt(stock_quantity),
                created_at || new Date().toISOString() // Default to now if not provided
            ]
        });

        const id = result.lastInsertRowid.toString();
        const initialQty = (stock_quantity === '' || stock_quantity === undefined || stock_quantity === null) ? 0 : parseInt(stock_quantity);

        // [NEW] Log Initial Stock
        if (initialQty > 0) {
            await db.execute({
                sql: `INSERT INTO stock_logs (product_id, quantity, remaining_quantity, buy_price, note, created_at)
                      VALUES (?, ?, ?, ?, 'Initial Stock', ?)`,
                args: [id, initialQty, initialQty, parseFloat(buy_price), created_at || new Date().toISOString()]
            });
        }

        return new Response(JSON.stringify({
            success: true,
            id,
            message: 'Product created successfully'
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Product POST Error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to create product',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, name, category_id, buy_price, sell_price, stock_quantity, created_at } = body;

        if (!id) {
            return new Response(JSON.stringify({ error: 'Product ID is required' }), { status: 400 });
        }

        const sanitizedName = sanitizeInput(name);
        const newStock = (stock_quantity === '' || stock_quantity === undefined || stock_quantity === null) ? 0 : parseInt(stock_quantity);

        // [NEW] Fetch Old Stock to calculate difference
        const currentProduct = await db.execute({
            sql: 'SELECT stock_quantity FROM products WHERE id = ?',
            args: [id]
        });
        const oldStock = currentProduct.rows[0]?.stock_quantity || 0;

        const result = await db.execute({
            sql: `UPDATE products SET 
                  name = ?, 
                  category_id = ?, 
                  buy_price = ?, 
                  sell_price = ?, 
                  stock_quantity = ?, 
                  created_at = ?
                  WHERE id = ?`,
            args: [
                sanitizedName,
                category_id || null,
                parseFloat(buy_price),
                parseFloat(sell_price),
                newStock,
                created_at,
                id
            ]
        });

        if (result.rowsAffected === 0) {
            return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404 });
        }

        // [NEW] Log Restock (If stock increased)
        const diff = newStock - oldStock;
        if (diff > 0) {
            await db.execute({
                sql: `INSERT INTO stock_logs (product_id, quantity, remaining_quantity, buy_price, note, created_at)
                      VALUES (?, ?, ?, ?, 'Restock', ?)`,
                // Use CURRENT timestamp for restock, unless user somehow provided a specific restock date (not supported in UI yet)
                args: [id, diff, diff, parseFloat(buy_price), new Date().toISOString()]
            });
        }

        return new Response(JSON.stringify({ success: true, message: 'Product updated successfully' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Product PUT Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to update product' }), { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return new Response(JSON.stringify({ error: 'Product ID is required' }), { status: 400 });
        }

        // [NEW] Check for existing sales
        const salesCheck = await db.execute({
            sql: "SELECT COUNT(*) as count FROM sale_items WHERE item_id = ? AND item_type = 'product'",
            args: [id]
        });

        if (salesCheck.rows[0].count > 0) {
            return new Response(JSON.stringify({
                error: 'Cannot delete product',
                message: 'This product has associated sales history. Deleting it would compromise sales data.'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // [NEW] Delete associated stock logs first (foreign key cleanup)
        await db.execute({
            sql: "DELETE FROM stock_logs WHERE product_id = ?",
            args: [id]
        });

        // Delete the product
        const result = await db.execute({
            sql: 'DELETE FROM products WHERE id = ?',
            args: [id]
        });

        if (result.rowsAffected === 0) {
            return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404 });
        }

        return new Response(JSON.stringify({ success: true, message: 'Product deleted successfully' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Product DELETE Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to delete product', message: error.message }), { status: 500 });
    }
}
