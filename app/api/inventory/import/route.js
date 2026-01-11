import db from '@/lib/db';
import * as XLSX from 'xlsx';
import * as pdfLib from 'pdf-parse';
const pdf = pdfLib.default || pdfLib;
import { sanitizeInput } from '@/lib/validation';

// Helper: Normalize strings for easier matching
// e.g. "Product Name " -> "productname", "দাম (টাকা)" -> "দাম"
function normalize(str) {
    if (!str) return '';
    return String(str).toLowerCase().trim()
        .replace(/[\s_\-.]+/g, '') // Remove spaces, underscores, dots
        .replace(/[(){}\[\]]/g, ''); // Remove brackets
}

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

        // ==========================================================
        // STRATEGY 1: PDF PARSING (Keep existing heuristic)
        // ==========================================================
        if (file.name.endsWith('.pdf') || fileType === 'application/pdf') {
            try {
                const data = await pdf(buffer);
                const lines = data.text.split(/\n/);

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;
                    // Skip header-like lines
                    if (trimmed.toLowerCase().includes('product name') && trimmed.toLowerCase().includes('price')) continue;

                    // Regex: [Name] [Buy?] [Sell] [Stock]
                    const match = trimmed.match(/^(.*?)(\s+[\d\.]+)?\s+([\d\.]+)\s+([\d\.]+)\s+(\d+)$/);

                    if (match) {
                        itemsToProcess.push({
                            name: match[1].trim(),
                            category: 'Uncategorized',
                            buy_price: parseFloat(match[3]) || 0,
                            sell_price: parseFloat(match[4]) || 0,
                            stock: parseInt(match[5]) || 0
                        });
                    }
                }
            } catch (e) {
                return new Response(JSON.stringify({ error: 'Failed to parse PDF.' }), { status: 400 });
            }
        }

        // ==========================================================
        // STRATEGY 2: EXCEL / CSV PARSING (Robust Rebuild)
        // ==========================================================
        else {
            const workbook = XLSX.read(buffer, { type: 'buffer' });

            // 1. ITERATE SHEETS
            // We look for the first sheet that looks like data
            let foundData = false;

            for (const sheetName of workbook.SheetNames) {
                if (foundData) break;

                const sheet = workbook.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Get array of arrays

                if (data.length < 2) continue; // Too small

                let headerMap = {};
                let headerRowIndex = -1;
                let strategy = 'unknown';

                // 2. FIND HEADER ROW (Scan first 10 rows)
                for (let i = 0; i < Math.min(data.length, 10); i++) {
                    const row = data[i];
                    if (!Array.isArray(row) || row.length === 0) continue;

                    // Compute Score for this row being a header
                    let score = 0;
                    let tempMap = {};

                    row.forEach((col, idx) => {
                        const val = normalize(col);
                        if (!val) return;

                        // -- KEYWORD MATCHING (English & Bengali) --

                        // Name Matches: product, name, item, title, description, নাম, বিবরণ
                        if (val.match(/product|name|item|title|desc|নাম|বিবরণ/)) {
                            tempMap['name'] = idx;
                            score += 5;
                        }
                        // Category Matches: category, type, cat, group, বিভাগ, ধরন
                        else if (val.match(/cat|type|group|বিভাগ|ধরন/)) {
                            tempMap['category'] = idx;
                            score += 3;
                        }
                        // Buy Price Matches: buy, cost, purchase, kenar, pore, কেনা, ক্রয়
                        else if (val.match(/buy|cost|purch|কেনা|ক্রয়/)) {
                            tempMap['buy_price'] = idx;
                            score += 3;
                        }
                        // Sell Price Matches: sell, price, rate, bikroi, dam, বিক্রয়, দাম
                        else if (val.match(/sell|price|rate|bikroi|dam|বিক্রয়|দাম/)) {
                            tempMap['sell_price'] = idx;
                            score += 3;
                        }
                        // Stock Matches: stock, qty, quantity, count, মজুদ, পরিমাণ, স্টক
                        else if (val.match(/stock|qty|quan|count|মজুদ|পরিমাণ|স্টক/)) {
                            tempMap['stock'] = idx;
                            score += 3;
                        }
                    });

                    // If we found a strong candidate (must have Name + at least one other field)
                    if (tempMap['name'] !== undefined || score >= 5) {
                        headerRowIndex = i;
                        headerMap = tempMap;
                        strategy = 'header_match';

                        // Heuristic: If we found "Name" but missed others, assume standard order for missing ones IF they are adjacent?
                        // Actually, let's keep it safe. If found, we use it.
                        break;
                    }
                }

                // 3. FALLBACK: POSITIONAL STRATEGY
                // If no header found, assume standard layout if data looks like data
                // Assumption: Col 0 = Name, Col 1 = Category (Optional), Col 2/3 = Price, Col 4 = Stock ??
                // Better Assumption (based on user's manual seed output):
                // Format: [Name] [Category] [Buy] [Sell] [Stock] 
                if (headerRowIndex === -1 && data.length > 0) {
                    // Check Row 0 to see if it's "Product Name" (Header) just missed by regex?
                    // If Row 0 is string, string, number... it might be data or header. 
                    // Let's assume Row 0 is header we couldn't parse, start from Row 1.
                    // OR if Row 0 values look like real data (not string "Name"), use Row 0.

                    // Simply use positional mapping
                    // 0: Name, 1: Category, 2: Buy, 3: Sell, 4: Stock
                    strategy = 'positional_fallback';
                    headerMap = {
                        name: 0,
                        category: 1,
                        buy_price: 2,
                        sell_price: 3,
                        stock: 4
                    };
                    headerRowIndex = 0;
                    // If Row 0 is definitely text-heavy and Row 1 is number-heavy, skip Row 0
                    const row0 = data[0];
                    if (row0 && typeof row0[2] === 'string' && isNaN(parseFloat(row0[2]))) {
                        headerRowIndex = 1; // Skip potential unparsed header
                    }
                }

                if (strategy === 'unknown') continue;

                // 4. PARSE DATA ROWS
                for (let i = headerRowIndex; i < data.length; i++) {
                    const row = data[i];
                    if (!row || row.length === 0) continue;

                    // Name is mandatory
                    const nameIdx = headerMap['name'];
                    if (nameIdx === undefined || !row[nameIdx]) continue;

                    const rawName = row[nameIdx].toString().trim();
                    // Skip if valid name looks like a header (recheck)
                    if (normalize(rawName).match(/product|name|item|নাম/)) continue;

                    // Extract Values
                    let category = 'Uncategorized';
                    if (headerMap['category'] !== undefined && row[headerMap['category']]) {
                        category = row[headerMap['category']].toString().trim();
                    }

                    // Price Parsing (Handle "12.50 Tk" etc)
                    const parsePrice = (val) => {
                        if (!val) return 0;
                        if (typeof val === 'number') return val;
                        // Remove commas, currency symbols
                        const numStr = val.toString().replace(/[^\d.-]/g, '');
                        return parseFloat(numStr) || 0;
                    };

                    let buyPrice = 0;
                    if (headerMap['buy_price'] !== undefined) buyPrice = parsePrice(row[headerMap['buy_price']]);

                    let sellPrice = 0;
                    if (headerMap['sell_price'] !== undefined) sellPrice = parsePrice(row[headerMap['sell_price']]);

                    // Stock Parsing
                    let stock = 0;
                    if (headerMap['stock'] !== undefined) {
                        const sVal = row[headerMap['stock']];
                        if (typeof sVal === 'string' && sVal.toLowerCase().includes('out')) {
                            stock = 0;
                        } else {
                            // aggressive string cleanup
                            const sNum = sVal ? sVal.toString().replace(/[^\d-]/g, '') : '0';
                            stock = parseInt(sNum) || 0;
                        }
                    }

                    itemsToProcess.push({
                        name: rawName,
                        category,
                        buy_price: buyPrice,
                        sell_price: sellPrice,
                        stock
                    });
                }

                if (itemsToProcess.length > 0) {
                    foundData = true;
                }
            } // end sheet loop
        }

        if (itemsToProcess.length === 0) {
            return new Response(JSON.stringify({ error: 'No recognizable product data found. Please ensure Columns are: Name, Category, BuyPrice, SellPrice, Stock.' }), { status: 400 });
        }


        // ==========================================================
        // 3. DATABASE INSERTION (Efficient & Safe)
        // ==========================================================
        let successCount = 0;
        let errors = [];

        // Pre-fetch Categories
        let categoryMap = {};
        const allCats = await db.execute("SELECT id, name FROM categories WHERE type = 'product'");
        if (allCats.rows) allCats.rows.forEach(c => categoryMap[c.name.toLowerCase()] = c.id);

        let uniqueCategories = new Set(itemsToProcess.map(i => i.category));

        // Create missing categories
        for (const catName of uniqueCategories) {
            const lowerCat = catName.toLowerCase();
            if (!categoryMap[lowerCat]) {
                try {
                    await db.execute({
                        sql: "INSERT INTO categories (name, type) VALUES (?, 'product')",
                        args: [catName]
                    });
                    // Fetch ID back
                    const res = await db.execute({
                        sql: "SELECT id FROM categories WHERE name = ? AND type = 'product'",
                        args: [catName]
                    });
                    if (res.rows.length) categoryMap[lowerCat] = res.rows[0].id;
                } catch (e) {
                    console.error("Cat create error:", e);
                }
            }
        }

        // Insert Items
        for (const item of itemsToProcess) {
            const sanitizedName = sanitizeInput(item.name);

            try {
                // Duplicate check
                const dup = await db.execute({ sql: "SELECT id FROM products WHERE name = ?", args: [sanitizedName] });
                if (dup.rows.length > 0) {
                    errors.push(`${sanitizedName}: Already exists`);
                    continue;
                }

                const catId = categoryMap[item.category.toLowerCase()] || null;

                await db.execute({
                    sql: 'INSERT INTO products (name, category_id, buy_price, sell_price, stock_quantity) VALUES (?, ?, ?, ?, ?)',
                    args: [sanitizedName, catId, item.buy_price, item.sell_price, item.stock]
                });
                successCount++;

            } catch (err) {
                errors.push(`${sanitizedName}: ${err.message}`);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            count: successCount,
            errors: errors
        }), { status: 200 });

    } catch (error) {
        console.error('Import Error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
