import db from '@/lib/db';

export async function GET() {
    try {
        // Get all tables to understand schema
        const tables = await db.execute(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`);
        const tableNames = tables.rows.map(r => r.name);

        // All sales with product details — Jan 1 to March 31 2026
        const salesQuery = await db.execute(`
            SELECT 
                s.id AS sale_id,
                s.created_at AS sale_date,
                s.payment_method,
                s.total_amount AS sale_total,
                si.item_type,
                si.item_id,
                si.quantity,
                si.price_at_sale AS sell_price_at_sale,
                si.buy_price_at_sale,
                p.name AS product_name,
                p.buy_price AS current_buy_price,
                p.sell_price AS current_sell_price,
                p.stock_quantity AS current_stock,
                c.name AS category
            FROM sales s
            JOIN sale_items si ON si.sale_id = s.id
            LEFT JOIN products p ON p.id = si.item_id AND si.item_type = 'product'
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE s.created_at >= '2026-01-01T00:00:00.000Z'
              AND s.created_at <  '2026-04-01T00:00:00.000Z'
            ORDER BY s.created_at ASC, s.id ASC
        `);

        const rawRows = salesQuery.rows;

        // Aggregate by product
        const productMap = {};
        const serviceItems = [];

        for (const row of rawRows) {
            if (row.item_type === 'service') {
                serviceItems.push(row);
                continue;
            }

            const key = String(row.item_id);
            if (!productMap[key]) {
                productMap[key] = {
                    product_id: row.item_id,
                    product_name: row.product_name || `Product #${row.item_id}`,
                    category: row.category || 'Uncategorized',
                    current_buy_price: parseFloat(row.current_buy_price || 0),
                    current_sell_price: parseFloat(row.current_sell_price || 0),
                    current_stock: parseInt(row.current_stock || 0),
                    total_qty_sold: 0,
                    total_revenue: 0,
                    total_cogs: 0,
                    sales_transactions: [],
                };
            }

            const qty = parseInt(row.quantity || 0);
            const sellPrice = parseFloat(row.sell_price_at_sale || 0);
            const buyPrice = parseFloat(row.buy_price_at_sale || 0);

            productMap[key].total_qty_sold += qty;
            productMap[key].total_revenue += qty * sellPrice;
            productMap[key].total_cogs += qty * buyPrice;
            productMap[key].sales_transactions.push({
                sale_id: String(row.sale_id),
                date: row.sale_date,
                qty,
                sell_price_at_sale: sellPrice,
                buy_price_at_sale: buyPrice,
                payment_method: row.payment_method,
            });
        }

        const products = Object.values(productMap)
            .sort((a, b) => b.total_qty_sold - a.total_qty_sold)
            .map(p => ({
                ...p,
                product_id: String(p.product_id),
                gross_profit: parseFloat((p.total_revenue - p.total_cogs).toFixed(2)),
                total_revenue: parseFloat(p.total_revenue.toFixed(2)),
                total_cogs: parseFloat(p.total_cogs.toFixed(2)),
            }));

        const grandTotalQty = products.reduce((s, p) => s + p.total_qty_sold, 0);
        const grandTotalRevenue = products.reduce((s, p) => s + p.total_revenue, 0);
        const grandTotalCOGS = products.reduce((s, p) => s + p.total_cogs, 0);

        return Response.json({
            period: 'January–March 2026',
            tables: tableNames,
            raw_row_count: rawRows.length,
            service_items_count: serviceItems.length,
            total_unique_products: products.length,
            grand_total_units: grandTotalQty,
            grand_total_revenue: parseFloat(grandTotalRevenue.toFixed(2)),
            grand_total_cogs: parseFloat(grandTotalCOGS.toFixed(2)),
            gross_profit: parseFloat((grandTotalRevenue - grandTotalCOGS).toFixed(2)),
            products,
        });

    } catch (error) {
        return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
    }
}
