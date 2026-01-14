import client from './lib/db.js';
import bcrypt from 'bcryptjs';

async function migrate() {
    console.log('Starting Access Control Migration (ESM)...');

    try {
        // 1. Add permissions column
        try {
            await client.execute("ALTER TABLE users ADD COLUMN permissions TEXT DEFAULT '{}'");
            console.log("Added permissions column.");
        } catch (e) {
            if (e.message.includes("duplicate column")) {
                console.log("permissions column already exists.");
            } else {
                console.error("Error adding permissions column:", e.message);
            }
        }

        // 2. Create Master Admin
        const username = 'turashahsan8@gmail.com';
        const passwordRaw = 'Ahsania_123';
        const hash = bcrypt.hashSync(passwordRaw, 10);

        // Full permissions for admin
        const adminPerms = JSON.stringify({
            view_reports: true,
            manage_sales: true,
            manage_inventory: true,
            manage_users: true
        });

        // Check availability
        const check = await client.execute({
            sql: "SELECT id FROM users WHERE username = ?",
            args: [username]
        });

        if (check.rows.length > 0) {
            console.log("Updating Master Admin...");
            await client.execute({
                sql: "UPDATE users SET password_hash = ?, role = 'manager', permissions = ? WHERE username = ?",
                args: [hash, adminPerms, username]
            });
        } else {
            console.log("Creating Master Admin...");
            await client.execute({
                sql: "INSERT INTO users (username, password_hash, role, permissions, email) VALUES (?, ?, 'manager', ?, ?)",
                args: [username, hash, adminPerms, username]
            });
        }

        console.log("Migration & Admin Creation Done.");

    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
