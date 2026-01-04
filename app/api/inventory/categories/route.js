import db from '@/lib/db';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    try {
        let query = 'SELECT * FROM categories';
        const args = [];
        if (type) {
            query += ' WHERE type = ?';
            args.push(type);
        }
        query += ' ORDER BY name';

        const result = await db.execute({ sql: query, args });
        return new Response(JSON.stringify(result.rows), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, type } = body;

        if (!name || !type) {
            return new Response(JSON.stringify({ error: 'Name and type are required' }), { status: 400 });
        }

        const result = await db.execute({
            sql: 'INSERT INTO categories (name, type) VALUES (?, ?)',
            args: [name, type]
        });

        // Fetch the created category using lastInsertRowid
        // Handle BigInt if returned
        const id = result.lastInsertRowid;

        const newCategory = await db.execute({
            sql: 'SELECT * FROM categories WHERE id = ?',
            args: [id]
        });

        return new Response(JSON.stringify(newCategory.rows[0]), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error creating category:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, name } = body;

        if (!id || !name) {
            return new Response(JSON.stringify({ error: 'ID and Name are required' }), { status: 400 });
        }

        await db.execute({
            sql: 'UPDATE categories SET name = ? WHERE id = ?',
            args: [name, id]
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return new Response(JSON.stringify({ error: 'ID is required' }), { status: 400 });
        }

        // Optional: Set products/services category_id to NULL before deleting
        await db.execute({
            sql: 'UPDATE products SET category_id = NULL WHERE category_id = ?',
            args: [id]
        });

        // Also update services if they share the table (or separate query)
        // Assuming services table exists and has category_id
        try {
            await db.execute({
                sql: 'UPDATE services SET category_id = NULL WHERE category_id = ?',
                args: [id]
            });
        } catch (e) {
            // ignore if services table doesn't exist or no column
        }

        await db.execute({
            sql: 'DELETE FROM categories WHERE id = ?',
            args: [id]
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
