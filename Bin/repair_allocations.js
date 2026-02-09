const { createClient } = require("@libsql/client");

const url = (process.env.TURSO_DATABASE_URL || 'libsql://ahsania-db-turashahsan8.aws-ap-northeast-1.turso.io').trim();
const authToken = (process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjM3MjQzOTcsImlkIjoiNzMxYTI0YjgtMmEyZS00NjZlLWFiZDMtMWMzZDk0MzdhNDA1IiwicmlkIjoiMzhiMzllODgtODE3MC00ZTdmLTk4NmQtNmVjY2RkYjRmZDEwIn0.WAfBeZ69cPg3VYqvjtiCIqjtW0HbbpKwTVJ9O8t3BE85fQC6tiJOmKrS8wfjW7s1IVoaGXCoNlKKXygpFRKTCQ').trim();

const client = createClient({
    url,
    authToken
});

async function repair() {
    try {
        console.log("Starting Repair...");

        // 1. Fetch All Products to map ProductID -> StockLogID
        const productsRes = await client.execute("SELECT id FROM products");
        const products = productsRes.rows;

        for (const p of products) {
            // Find Legacy Log (Initial Stock)
            // We assume the first log is the legacy one or filtered by 'Initial Stock' note if needed
            // But simpler: just get the oldest log.
            const logRes = await client.execute({
                sql: "SELECT id, quantity FROM stock_logs WHERE product_id = ? ORDER BY created_at ASC LIMIT 1",
                args: [p.id]
            });

            if (logRes.rows.length === 0) continue;
            const log = logRes.rows[0];
            let totalSold = 0;

            // 2. Find Past Sales for this product that have NO allocation
            // We iterate sale_items for this product
            const salesRes = await client.execute({
                sql: `SELECT si.id, si.quantity 
                      FROM sale_items si 
                      LEFT JOIN sale_batch_allocations sba ON si.id = sba.sale_item_id
                      WHERE si.item_id = ? AND si.item_type = 'product' AND sba.id IS NULL`,
                args: [p.id]
            });

            for (const saleItem of salesRes.rows) {
                // Create Allocation
                await client.execute({
                    sql: "INSERT INTO sale_batch_allocations (sale_item_id, stock_log_id, quantity) VALUES (?, ?, ?)",
                    args: [saleItem.id, log.id, saleItem.quantity]
                });
                totalSold += saleItem.quantity;
            }

            if (totalSold > 0) {
                // 3. Update Legacy Log Quantity
                // Original Quantity should be (Remaining/Legacy + Sold)
                // Currently 'quantity' is just 'Current Stock' (from previous migration)
                // So we add 'totalSold' to it.
                await client.execute({
                    sql: "UPDATE stock_logs SET quantity = quantity + ? WHERE id = ?",
                    args: [totalSold, log.id]
                });
                console.log(`Product ${p.id}: Backfilled ${totalSold} sold items. Updated Legacy Batch.`);
            }
        }

        console.log("Repair Complete.");

    } catch (error) {
        console.error("Repair Failed:", error);
    }
}

repair();
