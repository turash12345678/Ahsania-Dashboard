const { createClient } = require("@libsql/client");

const db = createClient({
    url: (process.env.TURSO_DATABASE_URL || 'libsql://ahsania-db-turashahsan8.aws-ap-northeast-1.turso.io').trim(),
    authToken: (process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjM3MjQzOTcsImlkIjoiNzMxYTI0YjgtMmEyZS00NjZlLWFiZDMtMWMzZDk0MzdhNDA1IiwicmlkIjoiMzhiMzllODgtODE3MC00ZTdmLTk4NmQtNmVjY2RkYjRmZDEwIn0.WAfBeZ69cPg3VYqvjtiCIqjtW0HbbpKwTVJ9O8t3BE85fQC6tiJOmKrS8wfjW7s1IVoaGXCoNlKKXygpFRKTCQ').trim(),
});

async function migrate() {
    console.log('Starting migration for products created_at...');

    try {
        // 1. Add created_at column
        try {
            await db.execute("ALTER TABLE products ADD COLUMN created_at TEXT");
            console.log("Added created_at column.");
        } catch (e) {
            if (e.message.includes("duplicate column")) console.log("created_at column already exists.");
            else console.error("Error adding created_at:", e.message);
        }

        // 2. Backfill existing products to January 2026 (User Request: "Bortomane jei Product Gula ase...Oigular Date January te kore deu")
        // Defaulting to 2026-01-01
        const backfillDate = '2026-01-01T00:00:00.000Z';
        console.log(`Backfilling existing products to ${backfillDate}...`);

        await db.execute(
            "UPDATE products SET created_at = ? WHERE created_at IS NULL OR created_at = ''",
            [backfillDate]
        );

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
