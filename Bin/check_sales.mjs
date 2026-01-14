import { createClient } from "@libsql/client";

const client = createClient({
    url: (process.env.TURSO_DATABASE_URL || 'libsql://ahsania-db-turso.aws-ap-northeast-1.turso.io').trim(),
    authToken: (process.env.TURSO_AUTH_TOKEN || '...').trim(),
});

async function checkSales() {
    try {
        const res = await client.execute("SELECT * FROM sales ORDER BY sale_date DESC LIMIT 10");
        console.log("Recent Sales:", res.rows);

        const count = await client.execute("SELECT COUNT(*) as count FROM sales");
        console.log("Total Sales:", count.rows[0]);

        const items = await client.execute("SELECT * FROM sale_items LIMIT 5");
        console.log("Sample Sale Items:", items.rows);

    } catch (e) {
        console.error(e);
    }
}

checkSales();
