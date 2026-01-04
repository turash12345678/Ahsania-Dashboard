import { serialize } from 'cookie';

export async function POST() {
    const cookieSerialized = serialize('session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: -1,
        path: '/',
    });

    return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
            'Set-Cookie': cookieSerialized,
            'Content-Type': 'application/json',
        },
    });
}
