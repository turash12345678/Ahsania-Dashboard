import db from '@/lib/db';

export async function GET(request) {
    try {
        // SQLite/LibSQL date functions work similarly
        const result = await db.execute(`
      SELECT sales.*, users.username 
      FROM sales 
      LEFT JOIN users ON sales.user_id = users.id
      WHERE date(sale_date, 'localtime') = date('now', 'localtime')
      ORDER BY sale_date DESC
    `);

        const sales = result.rows;

        // Calculate summary
        const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
        const totalTransactions = sales.length;

        const paymentSummary = sales.reduce((acc, sale) => {
            acc[sale.payment_method] = (acc[sale.payment_method] || 0) + sale.total_amount;
            return acc;
        }, {});

        return new Response(JSON.stringify({
            sales,
            summary: {
                totalRevenue,
                totalTransactions,
                paymentSummary
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
