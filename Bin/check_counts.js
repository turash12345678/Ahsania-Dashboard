const { createClient } = require('@libsql/client');

const client = createClient({
    url: 'libsql://ahsania-db-turashahsan8.aws-ap-northeast-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjM3MjQzOTcsImlkIjoiNzMxYTI0YjgtMmEyZS00NjZlLWFiZDMtMWMzZDk0MzdhNDA1IiwicmlkIjoiMzhiMzllODgtODE3MC00ZTdmLTk4NmQtNmVjY2RkYjRmZDEwIn0.WAfBeZ69cPg3VYqvjtiCIqjtW0HbbpKwTVJ9O8t3BE85fQC6tiJOmKrS8wfjW7s1IVoaGXCoNlKKXygpFRKTCQ'
});

async function checkCounts() {
    try {
        const productCount = await client.execute("SELECT COUNT(*) as count FROM products");
        const saleCount = await client.execute("SELECT COUNT(*) as count FROM sales");
        const serviceCount = await client.execute("SELECT COUNT(*) as count FROM services");

        console.log("=== ACTUAL DATABASE COUNTS ===");
        console.log(`Products: ${productCount.rows[0].count}`);
        console.log(`Sales:    ${saleCount.rows[0].count}`);
        console.log(`Services: ${serviceCount.rows[0].count}`);
        console.log("==============================");
    } catch (err) {
        console.error(err);
    }
}

checkCounts();
