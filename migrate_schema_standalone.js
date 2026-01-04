// Standalone migration script
const { createClient } = require("@libsql/client");

// Manually verify credentials or read from .env if package available.
// Using hardcoded credentials from db.js for reliability in this script.
const client = createClient({
    url: 'libsql://ahsania-db-turashahsan8.aws-ap-northeast-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjM3MjQzOTcsImlkIjoiNzMxYTI0YjgtMmEyZS00NjZlLWFiZDMtMWMzZDk0MzdhNDA1IiwicmlkIjoiMzhiMzllODgtODE3MC00ZTdmLTk4NmQtNmVjY2RkYjRmZDEwIn0.WAfBeZ69cPg3VYqvjtiCIqjtW0HbbpKwTVJ9O8t3BE85fQC6tiJOmKrS8wfjW7s1IVoaGXCoNlKKXygpFRKTCQ',
});

async function migrate() {
    console.log('Starting migration...');

    try {
        // 1. Add buy_price_at_sale to sale_items
        try {
            await client.execute("ALTER TABLE sale_items ADD COLUMN buy_price_at_sale REAL DEFAULT 0");
            console.log("Added buy_price_at_sale column.");
        } catch (e) {
            if (e.message && e.message.includes("duplicate column")) {
                console.log("buy_price_at_sale column already exists.");
            } else {
                console.error("Error adding buy_price_at_sale:", e);
            }
        }

        // 2. Add email and phone to users
        try {
            await client.execute("ALTER TABLE users ADD COLUMN email TEXT");
            console.log("Added email column.");
        } catch (e) {
            if (e.message && e.message.includes("duplicate column")) console.log("email column already exists.");
            else console.error("Error adding email:", e);
        }

        try {
            await client.execute("ALTER TABLE users ADD COLUMN phone TEXT");
            console.log("Added phone column.");
        } catch (e) {
            if (e.message && e.message.includes("duplicate column")) console.log("phone column already exists.");
            else console.error("Error adding phone:", e);
        }

        // 3. Backfill
        console.log("Backfilling historical profit data...");
        // SQLite update with join/subquery support varies, but simple subquery usually works.
        try {
            await client.execute(`
            UPDATE sale_items 
            SET buy_price_at_sale = (SELECT buy_price FROM products WHERE products.id = sale_items.item_id)
            WHERE item_type = 'product' AND (buy_price_at_sale IS NULL OR buy_price_at_sale = 0)
        `);
            console.log("Backfill complete.");
        } catch (e) {
            console.error("Backfill partial error:", e);
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
