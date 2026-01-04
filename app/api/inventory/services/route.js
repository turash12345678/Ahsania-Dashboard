import db from '@/lib/db';
import { validateService, sanitizeInput } from '@/lib/validation';

export async function GET(request) {
    try {
        const result = await db.execute(`
            SELECT services.*, categories.name as category_name,
            (SELECT COALESCE(SUM(quantity), 0) FROM sale_items WHERE item_id = services.id AND item_type = 'service') as sales_count
            FROM services 
            LEFT JOIN categories ON services.category_id = categories.id 
            ORDER BY services.name
        `);

        // Ensure all prices are properly formatted
        const formattedRows = result.rows?.map(row => ({
            ...row,
            price: parseFloat(row.price || 0),
            sales_count: parseInt(row.sales_count || 0)
        })) || [];

        return new Response(JSON.stringify(formattedRows), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Services GET Error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to fetch services',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, category_id, price } = body;

        // Sanitize inputs
        const sanitizedName = sanitizeInput(name);

        // Validate
        const validation = validateService({
            name: sanitizedName,
            price: parseFloat(price)
        });

        if (!validation.isValid) {
            return new Response(JSON.stringify({
                error: 'Validation failed',
                details: validation.errors
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Check for duplicate service name
        const duplicateCheck = await db.execute({
            sql: 'SELECT id FROM services WHERE LOWER(name) = LOWER(?) LIMIT 1',
            args: [sanitizedName]
        });

        if (duplicateCheck.rows && duplicateCheck.rows.length > 0) {
            return new Response(JSON.stringify({
                error: 'Service already exists',
                details: ['A service with this name already exists']
            }), {
                status: 409, // Conflict
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // If category_id is provided, verify it exists
        if (category_id) {
            const categoryCheck = await db.execute({
                sql: 'SELECT id FROM categories WHERE id = ?',
                args: [category_id]
            });

            if (!categoryCheck.rows || categoryCheck.rows.length === 0) {
                return new Response(JSON.stringify({
                    error: 'Invalid category',
                    details: [`Category ID ${category_id} does not exist`]
                }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        }

        const result = await db.execute({
            sql: 'INSERT INTO services (name, category_id, price) VALUES (?, ?, ?)',
            args: [
                sanitizedName,
                category_id || null,
                parseFloat(price)
            ]
        });

        const id = result.lastInsertRowid.toString();

        return new Response(JSON.stringify({
            success: true,
            id,
            message: 'Service created successfully'
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Service POST Error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to create service',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, name, category_id, price } = body;

        if (!id) {
            return new Response(JSON.stringify({ error: 'Service ID is required' }), { status: 400 });
        }

        const sanitizedName = sanitizeInput(name);

        const result = await db.execute({
            sql: `UPDATE services SET 
                  name = ?, 
                  category_id = ?, 
                  price = ?
                  WHERE id = ?`,
            args: [
                sanitizedName,
                category_id || null,
                parseFloat(price),
                id
            ]
        });

        if (result.rowsAffected === 0) {
            return new Response(JSON.stringify({ error: 'Service not found' }), { status: 404 });
        }

        return new Response(JSON.stringify({ success: true, message: 'Service updated successfully' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Service PUT Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to update service' }), { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return new Response(JSON.stringify({ error: 'Service ID is required' }), { status: 400 });
        }

        const result = await db.execute({
            sql: 'DELETE FROM services WHERE id = ?',
            args: [id]
        });

        if (result.rowsAffected === 0) {
            return new Response(JSON.stringify({ error: 'Service not found' }), { status: 404 });
        }

        return new Response(JSON.stringify({ success: true, message: 'Service deleted successfully' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Service DELETE Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to delete service' }), { status: 500 });
    }
}
