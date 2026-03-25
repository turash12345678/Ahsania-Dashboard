
import db from './lib/db.js';

async function fixOldLogs() {
    try {
        console.log("Fixing old stock logs...");
        // Update stock_logs sell_price from products table where it is 0 or NULL
        // Note: SQLite update with join/subquery syntax may vary.
        // Standard SQL update from another table:
        await db.execute(`
            UPDATE stock_logs 
            SET sell_price = (SELECT sell_price FROM products WHERE products.id = stock_logs.product_id)
            WHERE sell_price IS NULL OR sell_price = 0
        `);
        console.log("Fix successful.");
    } catch (e) {
        console.error("Fix failed:", e);
    }
}

fixOldLogs();
