import db from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request) {
    try {
        const body = await request.json();
        const { product_id, quantity, buy_price, sell_price, created_at } = body;

        if (!product_id || !quantity) {
            return new Response(JSON.stringify({ error: 'Product ID and Quantity are required' }), { status: 400 });
        }

        const qty = parseInt(quantity);
        const bPrice = parseFloat(buy_price) || 0;
        const sPrice = parseFloat(sell_price) || 0;

        // 1. Get current stock
        const productRes = await db.execute({
            sql: 'SELECT stock_quantity FROM products WHERE id = ?',
            args: [product_id]
        });

        if (!productRes.rows || productRes.rows.length === 0) {
            return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404 });
        }

        const currentStock = productRes.rows[0].stock_quantity;
        const newStock = currentStock + qty;

        // 2. Update Product (Stock + Latest Prices)
        await db.execute({
            sql: `UPDATE products SET 
                  stock_quantity = ?, 
                  buy_price = ?, 
                  sell_price = ? 
                  WHERE id = ?`,
            args: [newStock, bPrice, sPrice, product_id]
        });

        // 3. Create Stock Log (Batch)
        // Note: We are using the 'sell_price' column we just added
        await db.execute({
            sql: `INSERT INTO stock_logs (product_id, quantity, remaining_quantity, buy_price, sell_price, note, created_at)
                  VALUES (?, ?, ?, ?, ?, 'Restock', ?)`,
            args: [product_id, qty, qty, bPrice, sPrice, created_at || new Date().toISOString()]
        });

        return new Response(JSON.stringify({
            success: true,
            message: 'Restock successful',
            new_stock: newStock
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Restock Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
