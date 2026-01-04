import db from '@/lib/db';

export async function GET(request, { params }) {
    try {
        const userId = params.id;

        // 1. Fetch User Details
        const userResult = await db.execute({
            sql: "SELECT id, username, role, email, phone FROM users WHERE id = ?",
            args: [userId]
        });

        if (!userResult.rows || userResult.rows.length === 0) {
            return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
        }
        const user = userResult.rows[0];

        // 2. Calculate Stats
        // Total Sales (All Time)
        const totalSalesRes = await db.execute({
            sql: "SELECT SUM(total_amount) as total, COUNT(*) as count FROM sales WHERE user_id = ?",
            args: [userId]
        });

        // This Month Sales
        const { searchParams } = new URL(request.url);
        const clientStartOfMonth = searchParams.get('startOfMonth');

        let startOfMonth;
        if (clientStartOfMonth) {
            startOfMonth = clientStartOfMonth;
        } else {
            const now = new Date();
            startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        }

        const monthSalesRes = await db.execute({
            sql: "SELECT SUM(total_amount) as total, COUNT(*) as count FROM sales WHERE user_id = ? AND created_at >= ?",
            args: [userId, startOfMonth]
        });

        const stats = {
            total_revenue: totalSalesRes.rows[0].total || 0,
            total_orders: totalSalesRes.rows[0].count || 0,
            month_revenue: monthSalesRes.rows[0].total || 0,
            month_orders: monthSalesRes.rows[0].count || 0
        };

        // 3. Recent Sales History (Top 20)
        const historyRes = await db.execute({
            sql: "SELECT id, total_amount, created_at, payment_method FROM sales WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('User Update Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to update profile' }), { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const userId = params.id;

        // 1. Permission Check
        // We need to verify if the requester has 'manage_users' permission
        // Since we are in an API route, we need to parse the cookie manually or assume middleware handled auth.
        // But middleware only checks "is logged in". We need to check role/perms.

        // Retrieve session for permission check
        // Note: In Next.js App Router, we can get cookies
        const cookieStore = request.cookies;
        const sessionStr = cookieStore.get('session')?.value;
        let hasPermission = false;

        if (sessionStr) {
            try {
                const session = JSON.parse(sessionStr);
                // Allow if role is manager OR has manage_users permission
                if (session.role === 'manager' || session.permissions?.manage_users) {
                    hasPermission = true;
                }
            } catch (e) { }
        }

        if (!hasPermission) {
            return new Response(JSON.stringify({ error: 'Unauthorized: Insufficient permissions' }), { status: 403 });
        }

        // 2. Delete Related Data (Sales)
        // This solves the foreign key constraint issue
        await db.execute({
            sql: "DELETE FROM sales WHERE user_id = ?",
            args: [userId]
        });

        // 3. Delete User
        await db.execute({
            sql: "DELETE FROM users WHERE id = ?",
            args: [userId]
        });

        return new Response(JSON.stringify({ success: true, message: 'User and related data deleted' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('User Delete Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to delete user. They might have related data that could not be cleared.' }), { status: 500 });
    }
}
