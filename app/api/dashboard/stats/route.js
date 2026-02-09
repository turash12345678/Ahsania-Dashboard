import db from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);

        const now = new Date();
        // 1. Daily/Selected Date Context
        // 1. Daily/Selected Date Context
        // Expecting strict ISO strings from client for specific ranges
        let selectedStart = searchParams.get('startDate')
            ? searchParams.get('startDate')
            : new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

        let selectedEnd = searchParams.get('endDate')
            ? searchParams.get('endDate')
            : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

        const userId = searchParams.get('userId'); // For "My Sales"
        const dateStrParam = searchParams.get('dateStr');

        // 2. Monthly Context (Right Side & Graph)
        // Use dateStr if available to anchor month correctly (ignoring timezone shift of start time)
        let refDate;
        if (dateStrParam) {
            refDate = new Date(dateStrParam); // Parses as UTC Midnight (e.g. 2026-01-01 -> 2026-01-01T00:00:00Z)
        } else {
            refDate = new Date(selectedStart);
        }

        const startOfMonth = new Date(refDate.getFullYear(), refDate.getMonth(), 1).toISOString();
        const endOfMonth = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

        // --- HELPER: Calculate Stats for a Range ---
        const getStats = async (start, end, userFilterId = null) => {
            let salesSql = "SELECT SUM(total_amount) as total, COUNT(*) as count FROM sales WHERE sale_date >= ? AND sale_date <= ?";
            let salesArgs = [start, end];

            if (userFilterId) {
                salesSql += " AND user_id = ?";
                salesArgs.push(userFilterId);
            }

            const salesRes = await db.execute({ sql: salesSql, args: salesArgs });

            // Profit (Only Global, usually not per user unless sensitive)
            let profit = 0;
            if (!userFilterId) {
                const prodProfitRes = await db.execute({
                    sql: `SELECT SUM((sale_items.price_at_sale - COALESCE(sale_items.buy_price_at_sale, 0)) * sale_items.quantity) as profit
                           FROM sale_items JOIN sales ON sale_items.sale_id = sales.id
                           WHERE sale_items.item_type = 'product' AND sales.sale_date >= ? AND sales.sale_date <= ?`,
                    args: [start, end]
                });
                const servProfitRes = await db.execute({
                    sql: `SELECT SUM(sale_items.price_at_sale * sale_items.quantity) as profit
                           FROM sale_items JOIN sales ON sale_items.sale_id = sales.id
                           WHERE sale_items.item_type = 'service' AND sales.sale_date >= ? AND sales.sale_date <= ?`,
                    args: [start, end]
                });
                profit = (prodProfitRes.rows[0].profit || 0) + (servProfitRes.rows[0].profit || 0);
            }

            return {
                revenue: salesRes.rows[0].total || 0,
                orders: salesRes.rows[0].count || 0,
                profit: profit
            };
        };

        // --- HELPER: Get Item Type Counters ---
        const getItemCounts = async (start, end) => {
            const res = await db.execute({
                sql: `
                    SELECT item_type, SUM(quantity) as total_qty 
                    FROM sale_items 
                    JOIN sales ON sale_items.sale_id = sales.id 
                    WHERE sales.sale_date >= ? AND sales.sale_date <= ?
                    GROUP BY item_type
                `,
                args: [start, end]
            });

            let productCount = 0;
            let serviceCount = 0;

            res.rows.forEach(row => {
                if (row.item_type === 'product') productCount = row.total_qty;
                if (row.item_type === 'service') serviceCount = row.total_qty;
            });

            return { productCount, serviceCount };
        };

        // --- EXECUTE QUERIES ---

        // A. Daily Stats (Left Side)
        const dailyStats = await getStats(selectedStart, selectedEnd);

        // B. Monthly Stats (Right Side)
        const monthlyStats = await getStats(startOfMonth, endOfMonth);
        const monthlyItemCounts = await getItemCounts(startOfMonth, endOfMonth);

        // C. User Performance (This Month)
        let userStats = { revenue: 0, orders: 0 };
        if (userId) {
            userStats = await getStats(startOfMonth, endOfMonth, userId);
        }

        // D. Daily Sales History
        const dailyHistoryRes = await db.execute({
            sql: `SELECT id, total_amount, sale_date as created_at, payment_method FROM sales WHERE sale_date >= ? AND sale_date <= ? ORDER BY sale_date DESC`,
            args: [selectedStart, selectedEnd]
        });

        // --- FETCH ITEMS FOR HISTORY ---
        const sales = dailyHistoryRes.rows;
        if (sales.length > 0) {
            const saleIds = sales.map(s => s.id);
            const placeholders = saleIds.map(() => '?').join(',');

            // Fetch items with names joined from products/services tables
            const itemsRes = await db.execute({
                sql: `
                    SELECT 
                        si.sale_id, 
                        si.quantity, 
                        si.price_at_sale, 
                        si.item_type,
                        p.name as product_name,
                        s.name as service_name
                    FROM sale_items si
                    LEFT JOIN products p ON si.item_id = p.id AND si.item_type = 'product'
                    LEFT JOIN services s ON si.item_id = s.id AND si.item_type = 'service'
                    WHERE si.sale_id IN (${placeholders})
                `,
                args: saleIds
            });

            // Group items by sale_id
            const itemsMap = {};
            itemsRes.rows.forEach(item => {
                if (!itemsMap[item.sale_id]) itemsMap[item.sale_id] = [];
                itemsMap[item.sale_id].push({
                    name: item.item_type === 'product' ? item.product_name : item.service_name,
                    quantity: item.quantity,
                    price: item.price_at_sale,
                    type: item.item_type
                });
            });

            // Attach items to sales
            sales.forEach(sale => {
                sale.items = itemsMap[sale.id] || [];
            });
        }

        // E. Monthly Graph
        const graphResult = await db.execute({
            sql: "SELECT date(sale_date) as date, SUM(total_amount) as total FROM sales WHERE sale_date >= ? AND sale_date <= ? GROUP BY date(sale_date)",
            args: [startOfMonth, endOfMonth]
        });

        // Fill missing dates with 0
        const filledGraphData = [];
        const currentTracker = new Date(startOfMonth);
        const endTracker = new Date(endOfMonth);

        // Map existing data for quick lookup
        const graphMap = new Map();
        graphResult.rows.forEach(row => {
            graphMap.set(row.date, row.total);
        });

        while (currentTracker <= endTracker) {
            const dateStr = currentTracker.toISOString().split('T')[0];
            filledGraphData.push({
                date: dateStr,
                total: graphMap.get(dateStr) || 0
            });
            currentTracker.setDate(currentTracker.getDate() + 1);
        }

        // F. Top Products (Monthly)
        const topProductsResult = await db.execute({
            sql: `
                SELECT products.name, SUM(sale_items.quantity) as sold_qty 
                FROM sale_items
                JOIN products ON sale_items.item_id = products.id
                JOIN sales ON sale_items.sale_id = sales.id
                WHERE sale_items.item_type = 'product' AND sales.sale_date >= ? AND sales.sale_date <= ?
                GROUP BY products.id ORDER BY sold_qty DESC LIMIT 5
            `,
            args: [startOfMonth, endOfMonth]
        });

        // G. Stock Alerts (Only show if stock is 1 or less)
        const lowStockResult = await db.execute("SELECT name, stock_quantity FROM products WHERE stock_quantity <= 1 LIMIT 10");

        // H. Monthly Investment Stats (For products created in this month)
        // Investment = (Current Stock + Total Sold) * Buy Price
        // Revenue = Total Sales of these products (Lifetime)
        // Profit = Total Profit of these products (Lifetime)
        const investmentResult = await db.execute({
            sql: `
                SELECT 
                    SUM((p.stock_quantity + COALESCE((SELECT SUM(quantity) FROM sale_items WHERE item_id = p.id AND item_type='product'), 0)) * p.buy_price) as total_invest,
                    
                    SUM(COALESCE((SELECT SUM(si.price_at_sale * si.quantity) FROM sale_items si WHERE si.item_id = p.id AND si.item_type='product'), 0)) as total_revenue,
                    
                    SUM(COALESCE((SELECT SUM((si.price_at_sale - COALESCE(si.buy_price_at_sale, 0)) * si.quantity) FROM sale_items si WHERE si.item_id = p.id AND si.item_type='product'), 0)) as total_profit
                FROM products p
                WHERE p.created_at >= ? AND p.created_at <= ?
            `,
            args: [startOfMonth, endOfMonth]
        });

        const investmentStats = {
            invest: investmentResult.rows[0].total_invest || 0,
            revenue: investmentResult.rows[0].total_revenue || 0,
            profit: investmentResult.rows[0].total_profit || 0
        };

        return new Response(JSON.stringify({
            daily: { ...dailyStats, history: dailyHistoryRes.rows },
            monthly: {
                ...monthlyStats,
                product_count: monthlyItemCounts.productCount || 0,
                service_count: monthlyItemCounts.serviceCount || 0,
                graph_data: filledGraphData,
                top_products: topProductsResult.rows
            },
            user_performance: userStats,
            alerts: lowStockResult.rows,
            investment: investmentStats
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch dashboard stats' }), { status: 500 });
    }
}
