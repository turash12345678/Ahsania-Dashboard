import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { serialize } from 'cookie';

export async function POST(request) {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
        return new Response(JSON.stringify({ error: 'Missing username or password' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const result = await db.execute({
        sql: 'SELECT * FROM users WHERE username = ?',
        args: [username]
    });
    const user = result.rows[0];

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Parse permissions if they exist, otherwise default to empty
    let perms = {};
    try {
        if (user.permissions) perms = JSON.parse(user.permissions);
    } catch (e) { console.error('Perms Parse Error', e); }

    const userSession = {
        id: user.id,
        username: user.username,
        role: user.role,
        permissions: perms
    };
    const cookieValue = JSON.stringify(userSession);

    const cookieSerialized = serialize('session', cookieValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: '/',
    });

    return new Response(JSON.stringify({ success: true, user: userSession }), {
        status: 200,
        headers: {
            'Set-Cookie': cookieSerialized,
            'Content-Type': 'application/json',
        },
    });
}
