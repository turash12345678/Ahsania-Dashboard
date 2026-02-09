import db from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('product_id');

        if (!productId) {
            return new Response(JSON.stringify({ error: 'Product ID is required' }), { status: 400 });
        }

        // Fetch logs for the product
        const logsResult = await db.execute({
            sql: `SELECT * FROM stock_logs WHERE product_id = ? ORDER BY created_at DESC`,
            args: [productId]
        });

        // Fetch Total Earned from Sale Items
        const salesResult = await db.execute({
            sql: `SELECT SUM(quantity * price_at_sale) as total_earned FROM sale_items WHERE item_id = ? AND item_type = 'product'`,
            args: [productId]
        });

        const totalEarned = salesResult.rows[0]?.total_earned || 0;

        return new Response(JSON.stringify({
            logs: logsResult.rows,
            total_earned: totalEarned
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Logs GET Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch logs' }), { status: 500 });
    }
}
