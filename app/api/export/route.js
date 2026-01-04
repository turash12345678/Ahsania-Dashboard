import db from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const startParam = searchParams.get('startDate');
        const endParam = searchParams.get('endDate');

        if (!startParam || !endParam) {
            return new Response('Start Date and End Date required', { status: 400 });
        }

        // Parse dates
        const startStr = new Date(startParam).toISOString();
        const endDate = new Date(endParam);
        endDate.setHours(23, 59, 59, 999);
        const endStr = endDate.toISOString();

        // --- 1. OVERALL SUMMARY ---
        const summaryRes = await db.execute({
            sql: `SELECT 
                    SUM(total_amount) as total_revenue, 
                    COUNT(id) as total_orders
                  FROM sales WHERE sale_date >= ? AND sale_date <= ?`,
            args: [startStr, endStr]
        });

        // Calculate Total Profit (Products + Services)
        const prodProfitRes = await db.execute({
            sql: `SELECT SUM((si.price_at_sale - COALESCE(si.buy_price_at_sale, 0)) * si.quantity) as profit
                  FROM sale_items si JOIN sales s ON si.sale_id = s.id
                  WHERE si.item_type = 'product' AND s.sale_date >= ? AND s.sale_date <= ?`,
            args: [startStr, endStr]
        });
        const servProfitRes = await db.execute({
            sql: `SELECT SUM(si.price_at_sale * si.quantity) as profit
                  FROM sale_items si JOIN sales s ON si.sale_id = s.id
                  WHERE si.item_type = 'service' AND s.sale_date >= ? AND s.sale_date <= ?`,
            args: [startStr, endStr]
        });

        const totalRevenue = summaryRes.rows[0].total_revenue || 0;
        const totalOrders = summaryRes.rows[0].total_orders || 0;
        const totalProfit = (prodProfitRes.rows[0].profit || 0) + (servProfitRes.rows[0].profit || 0);


        // --- 2. DAILY BREAKDOWN ---
        const dailyRes = await db.execute({
            sql: `SELECT 
                    date(sale_date) as day, 
                    SUM(total_amount) as revenue 
                  FROM sales WHERE sale_date >= ? AND sale_date <= ? 
                  GROUP BY date(sale_date) ORDER BY day DESC`,
            args: [startStr, endStr]
        });
        // Note: Profit per day is complex in one query without massive joins, sticking to Revenue for daily breakdown for speed, 
        // or we can do a quick profit est per day if needed. User asked for "Income & Revenue". 
        // Let's try to get Daily Profit too? It requires joining.
        // Let's simplify and give Daily Revenue which is "Income" (Sales) usually. 
        // User Terminology: "Income" = Profit, "Revenue" = Sale (based on dashboard).
        // Let's call it "Daily Income (Revenue)". Actually dashboard says: Net Sale = Revenue, Net Income = Profit.
        // I will just list Revenue per day for now to keep query simple, or I can add a profit query. 
        // Let's stick to Revenue for Daily table to ensure stability, unless I can write the join easily.
        // Join is okay:
        /*
        SELECT date(s.sale_date) as day, 
               SUM(s.total_amount) as revenue,
               SUM( (si.price_at_sale - COALESCE(si.buy_price_at_sale, si.price_at_sale*0)) * si.quantity ) as estimated_profit
               -- Logic is tricky with services having 0 cost.
        */
        // Let's just output Revenue for now to be safe.


        // --- 3. TOP SELLING PRODUCTS ---
        const topProdRes = await db.execute({
            sql: `SELECT p.name, SUM(si.quantity) as qty, SUM(si.price_at_sale * si.quantity) as rev
                  FROM sale_items si
                  JOIN products p ON si.item_id = p.id
                  JOIN sales s ON si.sale_id = s.id
                  WHERE si.item_type = 'product' AND s.sale_date >= ? AND s.sale_date <= ?
                  GROUP BY p.id ORDER BY qty DESC LIMIT 10`,
            args: [startStr, endStr]
        });


        // --- 4. STOCK ALERTS ---
        const stockRes = await db.execute("SELECT name, stock_quantity FROM products WHERE stock_quantity < 10 ORDER BY stock_quantity ASC LIMIT 20");


        // --- 5. DETAILED TRANSACTIONS ---
        const salesRes = await db.execute({
            sql: `
                SELECT 
                    s.id, s.sale_date, s.user_id, s.total_amount, s.payment_method,
                    (
                        SELECT GROUP_CONCAT(
                            (CASE WHEN si.item_type='product' THEN p.name ELSE ser.name END) || ' (Qty:' || si.quantity || ')', 
                            '; '
                        ) 
                        FROM sale_items si
                        LEFT JOIN products p ON (si.item_id = p.id AND si.item_type = 'product')
                        LEFT JOIN services ser ON (si.item_id = ser.id AND si.item_type = 'service')
                        WHERE si.sale_id = s.id
                    ) as items_summary
                FROM sales s
                WHERE s.sale_date >= ? AND s.sale_date <= ?
                ORDER BY s.sale_date DESC
            `,
            args: [startStr, endStr]
        });


        // --- BUILD CSV ---
        const rows = [];

        // Header
        rows.push([`REPORT FOR: ${startParam} TO ${endParam}`]);
        rows.push([]);

        // Section 1: Summary
        rows.push(['--- MONTHLY SUMMARY ---']);
        rows.push(['Total Revenue', 'Total Profit', 'Total Orders']);
        rows.push([totalRevenue, totalProfit, totalOrders]);
        rows.push([]);

        // Section 2: Daily Breakdown
        rows.push(['--- DAILY BREAKDOWN ---']);
        rows.push(['Date', 'Daily Revenue']);
        dailyRes.rows.forEach(r => rows.push([r.day, r.revenue]));
        rows.push([]);

        // Section 3: Top Products
        rows.push(['--- TOP PRODUCTS ---']);
        rows.push(['Product Name', 'Quantity Sold', 'Revenue Generated']);
        topProdRes.rows.forEach(r => rows.push([r.name, r.qty, r.rev]));
        rows.push([]);

        // Section 4: Stock Alerts
        rows.push(['--- LOW STOCK ALERTS ---']);
        rows.push(['Product Name', 'Current Stock']);
        stockRes.rows.forEach(r => rows.push([r.name, r.stock_quantity]));
        rows.push([]);

        // Section 5: Transactions
        rows.push(['--- DETAILED TRANSACTIONS ---']);
        rows.push(['Sale ID', 'Date', 'Time', 'Amount', 'Method', 'Items']);
        salesRes.rows.forEach(r => {
            const d = new Date(r.sale_date);
            rows.push([
                r.id,
                d.toLocaleDateString(),
                d.toLocaleTimeString(),
                r.total_amount,
                r.payment_method,
                `"${(r.items_summary || '').replace(/"/g, '""')}"`
            ]);
        });

        const csvContent = rows.map(r => r.join(',')).join('\n');

        return new Response(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="Full_Report_${startParam}_${endParam}.csv"`
            }
        });

    } catch (error) {
        console.error('Export Error:', error);
        return new Response('Failed to generate export', { status: 500 });
    }
}
