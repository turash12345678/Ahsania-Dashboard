import db from '@/lib/db';

export async function POST(request) {
    try {
        const { message, selectedDate } = await request.json();

        if (!message) {
            return Response.json({ error: 'Message is required' }, { status: 400 });
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            return Response.json({ error: 'OpenRouter API key not configured' }, { status: 500 });
        }

        // --- Determine date context ---
        const dateStr = selectedDate || new Date().toISOString().split('T')[0];
        const [y, m, d] = dateStr.split('-').map(Number);
        const startOfDay = new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
        const endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
        const startOfMonth = new Date(y, m - 1, 1).toISOString();
        const endOfMonth = new Date(y, m, 0, 23, 59, 59, 999).toISOString();
        const monthName = new Date(y, m - 1, 1).toLocaleString('default', { month: 'long' });

        // --- Fetch live data from database for AI context ---

        // 1. Monthly revenue & profit
        const [monthlySales, monthlyProfit] = await Promise.all([
            db.execute({
                sql: 'SELECT SUM(total_amount) as revenue, COUNT(*) as orders FROM sales WHERE sale_date >= ? AND sale_date <= ?',
                args: [startOfMonth, endOfMonth]
            }),
            db.execute({
                sql: `SELECT 
                    SUM((si.price_at_sale - COALESCE(si.buy_price_at_sale, 0)) * si.quantity) as profit
                    FROM sale_items si JOIN sales s ON si.sale_id = s.id
                    WHERE s.sale_date >= ? AND s.sale_date <= ? AND si.item_type = 'product'`,
                args: [startOfMonth, endOfMonth]
            })
        ]);

        // 2. Today's sales
        const todaySales = await db.execute({
            sql: 'SELECT SUM(total_amount) as revenue, COUNT(*) as orders FROM sales WHERE sale_date >= ? AND sale_date <= ?',
            args: [startOfDay, endOfDay]
        });

        // 3. Top 5 products this month
        const topProducts = await db.execute({
            sql: `SELECT products.name, SUM(sale_items.quantity) as sold_qty,
                SUM(sale_items.price_at_sale * sale_items.quantity) as revenue,
                SUM((sale_items.price_at_sale - COALESCE(sale_items.buy_price_at_sale, 0)) * sale_items.quantity) as profit
                FROM sale_items
                JOIN products ON sale_items.item_id = products.id
                JOIN sales ON sale_items.sale_id = sales.id
                WHERE sale_items.item_type = 'product' AND sales.sale_date >= ? AND sales.sale_date <= ?
                GROUP BY products.id ORDER BY sold_qty DESC LIMIT 5`,
            args: [startOfMonth, endOfMonth]
        });

        // 4. Low stock items
        const lowStock = await db.execute(
            'SELECT name, stock_quantity, sell_price FROM products WHERE stock_quantity <= 5 ORDER BY stock_quantity ASC LIMIT 10'
        );

        // 5. Total active inventory value
        const inventoryValue = await db.execute(
            'SELECT COUNT(*) as total_products, SUM(stock_quantity * buy_price) as total_value, SUM(stock_quantity * sell_price) as potential_revenue FROM products WHERE stock_quantity > 0'
        );

        // 6. Dead stock this month
        const deadStock = await db.execute({
            sql: `SELECT name, stock_quantity, buy_price, (stock_quantity * buy_price) as blocked_capital
                FROM products p
                WHERE NOT EXISTS (
                    SELECT 1 FROM sale_items si JOIN sales s ON si.sale_id = s.id
                    WHERE s.sale_date >= ? AND s.sale_date <= ? AND si.item_id = p.id AND si.item_type = 'product'
                ) AND p.stock_quantity > 0
                ORDER BY blocked_capital DESC LIMIT 5`,
            args: [startOfMonth, endOfMonth]
        });

        // 7. Overall all-time totals
        const allTimeTotals = await db.execute(
            'SELECT SUM(total_amount) as total_revenue, COUNT(*) as total_orders FROM sales'
        );

        // --- Build context string ---
        const monthly = monthlySales.rows[0];
        const today = todaySales.rows[0];
        const inv = inventoryValue.rows[0];
        const allTime = allTimeTotals.rows[0];
        const monthlyProfitVal = monthlyProfit.rows[0]?.profit || 0;
        const monthlyRevenue = monthly?.revenue || 0;
        const marginPct = monthlyRevenue > 0 ? ((monthlyProfitVal / monthlyRevenue) * 100).toFixed(1) : 0;

        const topProductsText = topProducts.rows.length > 0
            ? topProducts.rows.map((p, i) =>
                `  ${i + 1}. ${p.name}: sold ${p.sold_qty} units, revenue ৳${Number(p.revenue || 0).toLocaleString()}, profit ৳${Number(p.profit || 0).toLocaleString()}`
            ).join('\n')
            : '  No products sold this month.';

        const lowStockText = lowStock.rows.length > 0
            ? lowStock.rows.map(p =>
                `  - ${p.name}: only ${p.stock_quantity} left (sell price ৳${p.sell_price})`
            ).join('\n')
            : '  No low stock items.';

        const deadStockText = deadStock.rows.length > 0
            ? deadStock.rows.map(p =>
                `  - ${p.name}: ${p.stock_quantity} units, capital locked ৳${Number(p.blocked_capital || 0).toLocaleString()}`
            ).join('\n')
            : '  No dead stock this month.';

        const systemPrompt = `You are an intelligent business analyst AI assistant embedded in the Ahsania Dashboard — a telecom/mobile shop inventory and sales management system. You have real-time access to the business data shown below. Your job is to answer questions, perform calculations, spot trends, and give actionable recommendations based on this data.

Be concise, direct, and helpful. Use Bangladeshi Taka (৳) for currency. If the user writes in Bengali, respond in Bengali. If in English, respond in English.

--- LIVE BUSINESS DATA (as of ${dateStr}) ---

📅 TODAY (${dateStr}):
- Revenue: ৳${Number(today?.revenue || 0).toLocaleString()}
- Orders: ${today?.orders || 0}

📆 THIS MONTH (${monthName} ${y}):
- Revenue: ৳${Number(monthlyRevenue).toLocaleString()}
- Profit: ৳${Number(monthlyProfitVal).toLocaleString()}
- Profit Margin: ${marginPct}%
- Total Orders: ${monthly?.orders || 0}

🏆 TOP SELLING PRODUCTS (${monthName}):
${topProductsText}

⚠️ LOW STOCK ALERTS (≤5 units):
${lowStockText}

📦 DEAD STOCK THIS MONTH (no sales):
${deadStockText}

🏭 TOTAL ACTIVE INVENTORY:
- Products with stock: ${inv?.total_products || 0}
- Total inventory value (buy price): ৳${Number(inv?.total_value || 0).toLocaleString()}
- Potential revenue if all sold: ৳${Number(inv?.potential_revenue || 0).toLocaleString()}

📊 ALL-TIME TOTALS:
- Total Revenue: ৳${Number(allTime?.total_revenue || 0).toLocaleString()}
- Total Orders: ${allTime?.total_orders || 0}

--- END OF DATA ---

Answer the user's question based on this data. You can calculate, compare, and provide business recommendations. If asked something not covered by the data, say so politely.`;

        // --- Call OpenRouter API ---
        const openrouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://ahsania-dashboard.vercel.app',
                'X-Title': 'Ahsania Dashboard AI'
            },
            body: JSON.stringify({
                model: 'anthropic/claude-opus-4.6',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                max_tokens: 1024,
                temperature: 0.3
            })
        });

        if (!openrouterRes.ok) {
            const errText = await openrouterRes.text();
            console.error('OpenRouter error:', errText);
            return Response.json({ error: 'AI service error: ' + errText }, { status: 502 });
        }

        const aiData = await openrouterRes.json();
        const reply = aiData.choices?.[0]?.message?.content || 'No response from AI.';

        return Response.json({ reply });

    } catch (error) {
        console.error('AI Chat API Error:', error);
        return Response.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
    }
}
