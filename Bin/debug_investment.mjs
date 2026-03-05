// Debug: test deleting product id=X (Hello product)
import { createClient } from '@libsql/client';

const db = createClient({
    url: 'libsql://ahsania-db-turashahsan8.aws-ap-northeast-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjM3MjQzOTcsImlkIjoiNzMxYTI0YjgtMmEyZS00NjZlLWFiZDMtMWMzZDk0MzdhNDA1IiwicmlkIjoiMzhiMzllODgtODE3MC00ZTdmLTk4NmQtNmVjY2RkYjRmZDEwIn0.WAfBeZ69cPg3VYqvjtiCIqjtW0HbbpKwTVJ9O8t3BE85fQC6tiJOmKrS8wfjW7s1IVoaGXCoNlKKXygpFRKTCQ'
});

async function debug() {
    // Find the "Hello" product
    const p = await db.execute({ sql: `SELECT id, name FROM products WHERE name='Hello'`, args: [] });
    console.log('Hello product:', p.rows);

    const id = p.rows[0]?.id;
    if (!id) { console.log('Product not found'); return; }

    // Check sale_items
    const sales = await db.execute({
        sql: `SELECT COUNT(*) as count FROM sale_items WHERE item_id=? AND item_type='product'`,
        args: [id]
    });
    console.log('sale_items count:', sales.rows[0]?.count);

    // Check stock_logs
    const logs = await db.execute({
        sql: `SELECT id, quantity, buy_price, created_at FROM stock_logs WHERE product_id=?`,
        args: [id]
    });
    console.log('stock_logs:', logs.rows);

    // Check sale_batch_allocations linked to these stock_logs
    if (logs.rows.length > 0) {
        const logIds = logs.rows.map(r => r.id).join(',');
        const sba = await db.execute({
            sql: `SELECT COUNT(*) as count FROM sale_batch_allocations WHERE stock_log_id IN (${logIds})`,
            args: []
        });
        console.log('sale_batch_allocations count:', sba.rows[0]?.count);
    }
}

debug().catch(console.error);
