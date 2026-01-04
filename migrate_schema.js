const db = require('./lib/db');

async function migrate() {
    console.log('Starting migration...');

    try {
        // 1. Add buy_price_at_sale to sale_items
        // We check if column exists first (SQLite doesn't support IF NOT EXISTS for columns easily in all versions, 
        // but adding it blindly might error if exists. We will try-catch).
        try {
            await db.execute("ALTER TABLE sale_items ADD COLUMN buy_price_at_sale REAL DEFAULT 0");
            console.log("Added buy_price_at_sale column.");
        } catch (e) {
            if (e.message.includes("duplicate column")) {
                console.log("buy_price_at_sale column already exists.");
            } else {
                console.error("Error adding buy_price_at_sale:", e.message);
            }
        }

        // 2. Add email and phone to users
        try {
            await db.execute("ALTER TABLE users ADD COLUMN email TEXT");
            console.log("Added email column.");
        } catch (e) {
            if (e.message.includes("duplicate column")) console.log("email column already exists.");
            else console.error("Error adding email:", e.message);
        }

        try {
            await db.execute("ALTER TABLE users ADD COLUMN phone TEXT");
            console.log("Added phone column.");
        } catch (e) {
            if (e.message.includes("duplicate column")) console.log("phone column already exists.");
            else console.error("Error adding phone:", e.message);
        }

        // 3. Fix existing sale_items (Optional: Backfill?)
        // For now, old sales will have 0 profit calculated, which is safer than guessing.
        // Or we could update them based on current product buy_price? 
        // Let's do a smart update: set buy_price_at_sale to current product buy_price for old items.

        console.log("Backfilling historical profit data...");
        await db.execute(`
        UPDATE sale_items 
        SET buy_price_at_sale = (SELECT buy_price FROM products WHERE products.id = sale_items.item_id)
        WHERE item_type = 'product' AND (buy_price_at_sale IS NULL OR buy_price_at_sale = 0)
    `);

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
