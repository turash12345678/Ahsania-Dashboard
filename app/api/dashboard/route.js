import db from '@/lib/db';

export async function GET(request) {
  try {
    // 1. Today's Sales
    const todaySalesResult = await db.execute(`
      SELECT SUM(total_amount) as total 
      FROM sales 
      WHERE date(sale_date, 'localtime') = date('now', 'localtime')
    `);
    const todaySales = todaySalesResult.rows[0];

    // 2. Monthly Sales
    const monthlySalesResult = await db.execute(`
      SELECT SUM(total_amount) as total 
      FROM sales 
      WHERE strftime('%Y-%m', sale_date, 'localtime') = strftime('%Y-%m', 'now', 'localtime')
    `);
    const monthlySales = monthlySalesResult.rows[0];

    // 3. Low Stock Items (Threshold < 5)
    const lowStockResult = await db.execute(`
      SELECT COUNT(*) as count FROM products WHERE stock_quantity < 5
    `);
    const lowStock = lowStockResult.rows[0];

    // 4. Recent Activity (Last 5 sales)
    const recentSalesResult = await db.execute(`
      SELECT sales.id, sales.total_amount, sales.sale_date, users.username
      FROM sales
      LEFT JOIN users ON sales.user_id = users.id
      ORDER BY sales.sale_date DESC
      LIMIT 5
    `);
    const recentSales = recentSalesResult.rows;

    return new Response(JSON.stringify({
      todaySales: todaySales.total || 0,
      monthlySales: monthlySales.total || 0,
      lowStockCount: lowStock.count || 0,
      recentSales
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
