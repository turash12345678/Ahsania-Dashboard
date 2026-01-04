import db from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(request) {
    try {
        const result = await db.execute('SELECT id, username, role, created_at, permissions FROM users ORDER BY id');
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
        const { username, password, role } = body;

        if (!username || !password || !role) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Check if user exists
        const existingResult = await db.execute({
            sql: 'SELECT id FROM users WHERE username = ?',
            args: [username]
        });

        if (existingResult.rows.length > 0) {
            return new Response(JSON.stringify({ error: 'Username already exists' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const hash = bcrypt.hashSync(password, 10);
        const result = await db.execute({
            sql: 'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
            args: [username, hash, role]
        });

        return new Response(JSON.stringify({ success: true, id: result.lastInsertRowid }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
