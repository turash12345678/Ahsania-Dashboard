import db from '@/lib/db';
import { sanitizeInput } from '@/lib/validation';

export async function POST(request) {
    try {
        const body = await request.json();
        const { items, transportCost } = body;

        // Validation
        if (!Array.isArray(items) || items.length === 0) {
            return new Response(JSON.stringify({ error: 'No items provided for shipment' }), { status: 400 });
        }

        const missingRequired = items.some(item => !item.id || item.qty == null || item.adjustedBuyPrice == null || item.suggestedSRP == null);
        if (missingRequired) {
            return new Response(JSON.stringify({ error: 'Missing required item fields (id, qty, adjustedBuyPrice, suggestedSRP)' }), { status: 400 });
        }

        // Start bulk process
        const now = new Date().toISOString();
        let totalProcessed = 0;

        for (const item of items) {
            const { id, qty, adjustedBuyPrice, suggestedSRP } = item;

            if (qty <= 0) continue; // Skip items with no added quantity

            // 1. Get current stock
            const currentProduct = await db.execute({ sql: 'SELECT stock_quantity FROM products WHERE id = ?', args: [id] });
            const currentStock = currentProduct.rows[0]?.stock_quantity || 0;
            const newStock = currentStock + parseInt(qty);

            // 2. Update product
            await db.execute({
                sql: `UPDATE products SET 
                        stock_quantity = ?, 
                        buy_price = ?, 
                        sell_price = ? 
                      WHERE id = ?`,
                args: [newStock, parseFloat(adjustedBuyPrice), parseFloat(suggestedSRP), id]
            });

            // 3. Insert stock_log
            await db.execute({
                sql: `INSERT INTO stock_logs (product_id, quantity, remaining_quantity, buy_price, note, created_at)
                      VALUES (?, ?, ?, ?, 'Shipment Batch Allocation', ?)`,
                args: [id, parseInt(qty), parseInt(qty), parseFloat(adjustedBuyPrice), now]
            });

            totalProcessed++;
        }

        return new Response(JSON.stringify({
            success: true,
            message: `Shipment recorded successfully. Updated ${totalProcessed} products.`
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Shipment POST Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to record shipment', message: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
