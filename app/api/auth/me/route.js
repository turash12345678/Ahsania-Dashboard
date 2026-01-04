import { parse } from 'cookie';

export async function GET(request) {
    // AUTH DISABLED: Always return admin user
    // This allows bypassing the login screen for development/client request.
    const adminUser = {
        id: 1, // Assumes ID 1 is the main admin/manager
        username: 'admin',
        role: 'manager'
    };

    return new Response(JSON.stringify({ user: adminUser }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}
