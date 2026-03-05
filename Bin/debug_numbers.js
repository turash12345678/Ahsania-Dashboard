const { createClient } = require('@libsql/client');
const db = createClient({
    url: 'libsql://ahsania-db-turashahsan8.aws-ap-northeast-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjM3MjQzOTcsImlkIjoiNzMxYTI0YjgtMmEyZS00NjZlLWFiZDMtMWMzZDk0MzdhNDA1IiwicmlkIjoiMzhiMzllODgtODE3MC00ZTdmLTk4NmQtNmVjY2RkYjRmZDEwIn0.WAfBeZ69cPg3VYqvjtiCIqjtW0HbbpKwTVJ9O8t3BE85fQC6tiJOmKrS8wfjW7s1IVoaGXCoNlKKXygpFRKTCQ'
});

async function compare() {
    // 1. Overview Revenue (Sales in Jan)
    const overview = await db.execute({
        sql: "SELECT SUM(total_amount) as rev FROM sales WHERE SUBSTR(sale_date, 1, 7) = '2026-01'",
        args: []
    });
    console.log('Overview Revenue (Jan Sales):', overview.rows[0].rev);

    // 2. Tracker Revenue (Jan Batch Sales)
    const tracker = await db.execute({
        sql: `SELECT SUM(sba.quantity * si.price_at_sale) as rev
               FROM sale_batch_allocations sba
               JOIN stock_logs sl ON sba.stock_log_id = sl.id
               JOIN sale_items si ON sba.sale_item_id = si.id
               WHERE SUBSTR(sl.created_at, 1, 7) = '2026-01'`,
        args: []
    });
    console.log('Tracker Revenue (Jan Batch Lifetime):', tracker.rows[0].rev);

    // 3. Find Jan Batch items sold in FEB
    const janInFeb = await db.execute({
        sql: `SELECT SUM(sba.quantity * si.price_at_sale) as rev
               FROM sale_batch_allocations sba
               JOIN stock_logs sl ON sba.stock_log_id = sl.id
               JOIN sale_items si ON sba.sale_item_id = si.id
               JOIN sales s ON si.sale_id = s.id
               WHERE SUBSTR(sl.created_at, 1, 7) = '2026-01' 
                 AND SUBSTR(s.sale_date, 1, 7) > '2026-01'`,
        args: []
    });
    console.log('Jan Batch Revenue sold in Feb or later:', janInFeb.rows[0].rev);

    // 4. Find PRE-JAN Batch items sold in JAN
    const preInJan = await db.execute({
        sql: `SELECT SUM(sba.quantity * si.price_at_sale) as rev
               FROM sale_batch_allocations sba
               JOIN stock_logs sl ON sba.stock_log_id = sl.id
               JOIN sale_items si ON sba.sale_item_id = si.id
               JOIN sales s ON si.sale_id = s.id
               WHERE SUBSTR(sl.created_at, 1, 7) < '2026-01' 
                 AND SUBSTR(s.sale_date, 1, 7) = '2026-01'`,
        args: []
    });
    console.log('Older Batch Revenue sold in January:', preInJan.rows[0].rev);
}
compare().catch(console.error);
