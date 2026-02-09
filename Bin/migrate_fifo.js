const { createClient } = require("@libsql/client");

// Credentials from lib/db.js
const url = (process.env.TURSO_DATABASE_URL || 'libsql://ahsania-db-turashahsan8.aws-ap-northeast-1.turso.io').trim();
const authToken = (process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjM3MjQzOTcsImlkIjoiNzMxYTI0YjgtMmEyZS00NjZlLWFiZDMtMWMzZDk0MzdhNDA1IiwicmlkIjoiMzhiMzllODgtODE3MC00ZTdmLTk4NmQtNmVjY2RkYjRmZDEwIn0.WAfBeZ69cPg3VYqvjtiCIqjtW0HbbpKwTVJ9O8t3BE85fQC6tiJOmKrS8wfjW7s1IVoaGXCoNlKKXygpFRKTCQ').trim();

const client = createClient({
    url,
    authToken
});

async function migrate() {
    try {
        console.log("Connected to Turso DB.");

        // 1. Create stock_logs table
        await client.execute(`
            CREATE TABLE IF NOT EXISTS stock_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL, -- Original quantity bought
                remaining_quantity INTEGER NOT NULL, -- Current quantity available for sale
                buy_price REAL NOT NULL,
                note TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(product_id) REFERENCES products(id)
            )
        `);
        console.log("stock_logs table created/verified.");

        // 2. Create sale_batch_allocations table
        await client.execute(`
            CREATE TABLE IF NOT EXISTS sale_batch_allocations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sale_item_id INTEGER NOT NULL, -- Link to sale_items
                stock_log_id INTEGER NOT NULL, -- Link to source batch
                quantity INTEGER NOT NULL, -- Amount taken from this batch
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(sale_item_id) REFERENCES sale_items(id),
                FOREIGN KEY(stock_log_id) REFERENCES stock_logs(id)
            )
        `);
        console.log("sale_batch_allocations table created/verified.");

        // 3. Backfill Legacy Batches
        const productsResult = await client.execute(`SELECT id, name, stock_quantity, buy_price, created_at FROM products`);
        const products = productsResult.rows;

        let count = 0;
        for (const p of products) {
            // Check if log exists
            const logResult = await client.execute({
                sql: `SELECT id FROM stock_logs WHERE product_id = ?`,
                args: [p.id]
            });

            if (logResult.rows.length === 0) {
                // Create Legacy Batch
                await client.execute({
                    sql: `INSERT INTO stock_logs (product_id, quantity, remaining_quantity, buy_price, note, created_at)
                          VALUES (?, ?, ?, ?, ?, ?)`,
                    args: [p.id, p.stock_quantity, p.stock_quantity, p.buy_price, 'Legacy Migration: Initial Stock', p.created_at]
                });
                console.log(`Migrated ${p.name}: Stock ${p.stock_quantity}`);
                count++;
            }
        }

        console.log(`Processed ${count} products.`);
    } catch (error) {
        console.error("Migration failed:", error);
    }
}

migrate();
