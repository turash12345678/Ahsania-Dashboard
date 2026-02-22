import db from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const filter = searchParams.get('filter') || 'all';

        const isMonthFilter = filter !== 'all' && filter.match(/^\d{4}-\d{2}$/);

        // 1. Total Investment
        const investResult = await db.execute(
            isMonthFilter
                ? {
                    sql: `SELECT SUM(quantity * buy_price) as total_invest 
                          FROM stock_logs 
                          WHERE SUBSTR(created_at, 1, 7) = ?`,
                    args: [filter]
                }
                : {
                    sql: `SELECT SUM(quantity * buy_price) as total_invest FROM stock_logs`,
                    args: []
                }
        );

        // 2. Revenue & Profit
        const salesResult = await db.execute(
            isMonthFilter
                ? {
                    sql: `SELECT 
                            SUM(sba.quantity * si.price_at_sale) as total_revenue,
                            SUM(sba.quantity * (si.price_at_sale - sl.buy_price)) as total_profit
                          FROM sale_batch_allocations sba
                          JOIN stock_logs sl ON sba.stock_log_id = sl.id
                          JOIN sale_items si ON sba.sale_item_id = si.id
                          WHERE SUBSTR(sl.created_at, 1, 7) = ?`,
                    args: [filter]
                }
                : {
                    sql: `SELECT 
                            SUM(sba.quantity * si.price_at_sale) as total_revenue,
                            SUM(sba.quantity * (si.price_at_sale - sl.buy_price)) as total_profit
                          FROM sale_batch_allocations sba
                          JOIN stock_logs sl ON sba.stock_log_id = sl.id
                          JOIN sale_items si ON sba.sale_item_id = si.id`,
                    args: []
                }
        );

        const resp = {
            invest: investResult.rows[0]?.total_invest || 0,
            revenue: salesResult.rows[0]?.total_revenue || 0,
            profit: salesResult.rows[0]?.total_profit || 0
        };

        return new Response(JSON.stringify(resp), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('[Investment API] ERROR:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch investment stats', detail: error.message }), { status: 500 });
    }
}
