import db from '@/lib/db';

// TEMP DEBUG ENDPOINT - remove after debugging
export async function GET(request) {
    try {
        // Fetch last 20 stock_logs with raw created_at
        const logs = await db.execute({
            sql: `SELECT id, product_id, quantity, buy_price, created_at, 
                         SUBSTR(created_at, 1, 7) as month_part
                  FROM stock_logs 
                  ORDER BY id DESC 
                  LIMIT 20`,
            args: []
        });

        // Also test the March filter directly
        const marchTest = await db.execute({
            sql: `SELECT SUM(quantity * buy_price) as total
                  FROM stock_logs
                  WHERE SUBSTR(created_at, 1, 7) = '2026-03'`,
            args: []
        });

        // Also fetch all distinct month_parts to see what's stored
        const months = await db.execute({
            sql: `SELECT DISTINCT SUBSTR(created_at, 1, 7) as month_part, COUNT(*) as count
                  FROM stock_logs
                  GROUP BY month_part
                  ORDER BY month_part`,
            args: []
        });

        return new Response(JSON.stringify({
            recent_logs: logs.rows,
            march_total: marchTest.rows[0]?.total || 0,
            all_months: months.rows
        }, null, 2), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
