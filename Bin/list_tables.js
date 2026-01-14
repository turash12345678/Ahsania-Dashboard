
const { createClient } = require('@libsql/client');

const client = createClient({
    url: 'libsql://ahsania-db-turashahsan8.aws-ap-northeast-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjM3MjQzOTcsImlkIjoiNzMxYTI0YjgtMmEyZS00NjZlLWFiZDMtMWMzZDk0MzdhNDA1IiwicmlkIjoiMzhiMzllODgtODE3MC00ZTdmLTk4NmQtNmVjY2RkYjRmZDEwIn0.WAfBeZ69cPg3VYqvjtiCIqjtW0HbbpKwTVJ9O8t3BE85fQC6tiJOmKrS8wfjW7s1IVoaGXCoNlKKXygpFRKTCQ'
});

async function main() {
    try {
        const res = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
        console.log("Tables:", res.rows);
    } catch (e) {
        console.error(e);
    }
}

main();
