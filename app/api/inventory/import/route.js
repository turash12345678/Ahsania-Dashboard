import db from '@/lib/db';
import * as XLSX from 'xlsx';
import * as pdfLib from 'pdf-parse';
const pdf = pdfLib.default || pdfLib;
import { sanitizeInput } from '@/lib/validation';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return new Response(JSON.stringify({ error: 'No file uploaded' }), { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileType = file.type || file.name.split('.').pop().toLowerCase();

        let itemsToProcess = [];

        // --- STRATEGY: PARSE FILE TO COMMON FORMAT ---

        if (file.name.endsWith('.pdf') || fileType === 'application/pdf') {
            // PDF PARSING LOGIC
            try {
                const data = await pdf(buffer);
                const text = data.text;
                const lines = text.split(/\n/);

                // Heuristic: Verify it looks like a list
                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;

                    // Skip header-like lines
                    if (trimmed.toLowerCase().includes('product name') && trimmed.toLowerCase().includes('price')) continue;

                    // Regex to find Name + Numbers at the end
                    // Format: [Name string] [Space] [Buy?] [Space] [Sell] [Space] [Stock]
                    const match = trimmed.match(/^(.*?)(\s+[\d\.]+)?\s+([\d\.]+)\s+([\d\.]+)\s+(\d+)$/);

                    if (match) {
                        let namePart = match[1].trim();
                        const buyPrice = parseFloat(match[3]) || 0;
                        const sellPrice = parseFloat(match[4]) || 0;
                        const stock = parseInt(match[5]) || 0;

                        itemsToProcess.push({
                            name: namePart,
                            category: 'Uncategorized',
                            buy_price: buyPrice,
                            sell_price: sellPrice,
                            stock: stock
                        });
                    }
                }
            } catch (e) {
                return new Response(JSON.stringify({ error: 'Failed to parse PDF. Ensure it is a text-based PDF.' }), { status: 400 });
            }

        } else {
            // EXCEL PARSING LOGIC
            const workbook = XLSX.read(buffer, { type: 'buffer' });

            let sheet = null;
            let rawData = [];
            let headerRowIndex = -1;
            let headerMap = {};

            // Iterate sheets to find one with "Product Name"
            // We use a robust fuzzy matcher
            for (const sheetName of workbook.SheetNames) {
                const s = workbook.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(s, { header: 1 });

                for (let i = 0; i < data.length; i++) {
                    const row = data[i];
                    if (!Array.isArray(row)) continue;

                    let hasName = false;
                    let tempMap = {};

                    row.forEach((col, idx) => {
                        if (!col) return;
                        // Clean column name: "  PRODUCT NAME  " -> "productname"
                        const cleanCol = String(col).toLowerCase().trim().replace(/[\s_\-.]+/g, '');

                        if (cleanCol.includes('productname') || cleanCol === 'name' || cleanCol === 'product') {
                            hasName = true;
                            tempMap['name'] = idx;
                        }
                        else if (cleanCol.includes('buyprice') || cleanCol.includes('cost') || cleanCol.includes('buyingprice')) {
                            tempMap['buy_price'] = idx;
                        }
                        else if (cleanCol.includes('sellprice') || cleanCol.includes('price') || cleanCol.includes('sellingprice')) {
                            tempMap['sell_price'] = idx;
                        }
                        else if (cleanCol.includes('stock') || cleanCol.includes('quantity') || cleanCol.includes('qty')) {
                            tempMap['stock'] = idx;
                        }
                        else if (cleanCol.includes('category')) {
                            tempMap['category'] = idx;
                        }
                    });

                    // If we found a Name column, we assume this is the header row
                    // We don't strictly require price/stock to support partial imports if needed, 
                    // but practically we need them.
                    if (hasName) {
                        headerRowIndex = i;
                        sheet = s;
                        rawData = data;
                        headerMap = tempMap;
                        break;
                    }
                }
                if (headerRowIndex !== -1) break; // Found the sheet
            }

            if (headerRowIndex === -1) {
                return new Response(JSON.stringify({ error: 'Could not find "Product Name" column in any sheet. Please ensure your Excel file has a header row.' }), { status: 400 });
            }

            // Parse Rows
            for (let i = headerRowIndex + 1; i < rawData.length; i++) {
                const row = rawData[i];
                if (!row || row.length === 0) continue;

                const name = row[headerMap['name']];
                if (!name) continue;

                // Robust Stock Parsing (Handle "Out of Stock")
                let stockVal = headerMap['stock'] !== undefined ? row[headerMap['stock']] : 0;
                let stock = 0;
                if (typeof stockVal === 'string' && stockVal.toLowerCase().includes('out')) {
                    stock = 0;
                } else {
                    stock = parseInt(stockVal) || 0;
                }

                itemsToProcess.push({
                    name: name,
                    category: headerMap['category'] !== undefined ? row[headerMap['category']] : 'Uncategorized',
                    buy_price: headerMap['buy_price'] !== undefined ? (parseFloat(row[headerMap['buy_price']]) || 0) : 0,
                    sell_price: headerMap['sell_price'] !== undefined ? (parseFloat(row[headerMap['sell_price']]) || 0) : 0,
                    stock: stock
                });
            }
        }

        // --- COMMON PROCESSING (Insert Items) ---
        let successCount = 0;
        let errors = [];

        // 1. Extract Unique Categories & Ensure they exist (DB Safe Mode)
        let uniqueCategories = new Set();
        itemsToProcess.forEach(item => {
            if (item.category) uniqueCategories.add(item.category.toString().trim());
        });

        // Use INSERT OR IGNORE for atomic safety
        let categoryMap = {};

        // Pre-fetch all PRODUCT categories
        const allCats = await db.execute("SELECT id, name FROM categories WHERE type = 'product'");
        if (allCats.rows) allCats.rows.forEach(c => categoryMap[c.name.toLowerCase()] = c.id);

        for (const catName of uniqueCategories) {
            const lowerName = catName.toLowerCase();

            // If category doesn't exist for 'product' type, create it
            if (!categoryMap[lowerName]) {
                try {
                    await db.execute({
                        sql: `INSERT OR IGNORE INTO categories (name, type) VALUES (?, 'product')`,
                        args: [catName]
                    });

                    // Fetch to get ID (whether inserted or ignored)
                    const res = await db.execute({
                        sql: "SELECT id FROM categories WHERE name = ? AND type = 'product'",
                        args: [catName]
                    });
                    if (res.rows.length > 0) {
                        categoryMap[lowerName] = res.rows[0].id;
                    }
                } catch (e) {
                    console.error("Cat insert error", e);
                }
            }
        }

        // 2. Insert Products
        for (const item of itemsToProcess) {
            const sanitizedName = sanitizeInput(item.name.toString());

            try {
                // Check duplicate
                const dupCheck = await db.execute({
                    sql: "SELECT id FROM products WHERE name = ?",
                    args: [sanitizedName]
                });

                if (dupCheck.rows.length > 0) {
                    errors.push(`Skipped ${sanitizedName}: Already exists`);
                    continue;
                }

                let categoryId = null;
                if (item.category) {
                    categoryId = categoryMap[item.category.toString().trim().toLowerCase()];
                }

                await db.execute({
                    sql: 'INSERT INTO products (name, category_id, buy_price, sell_price, stock_quantity) VALUES (?, ?, ?, ?, ?)',
                    args: [sanitizedName, categoryId, item.buy_price, item.sell_price, item.stock]
                });
                successCount++;
            } catch (err) {
                errors.push(`Failed ${sanitizedName}: ${err.message}`);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            count: successCount,
            errors: errors
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Import Error:', error);
        return new Response(JSON.stringify({ error: `Failed to process file: ${error.message}` }), { status: 500 });
    }
}
