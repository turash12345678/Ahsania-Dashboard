
const XLSX = require('xlsx');

function testExcelParsing() {
    try {
        // 1. Create a dummy workbook
        const wb = XLSX.utils.book_new();
        const headers = ["Product Name", "Category", "Buy Price", "Sell Price", "Stock"];
        const data = [
            headers,
            ["Test Item 1", "General", 100, 150, 50],
            ["Test Item 2", "Food", 20, 30, "Out of Stock"]
        ];
        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

        // 2. Write to buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        console.log("Created buffer of size:", buffer.length);

        // 3. Simulating the API Logic
        const workbookRead = XLSX.read(buffer, { type: 'buffer' });

        let headerRowIndex = -1;
        let headerMap = {};
        let rawData = [];

        // Iterate sheets
        for (const sheetName of workbookRead.SheetNames) {
            const s = workbookRead.Sheets[sheetName];
            const d = XLSX.utils.sheet_to_json(s, { header: 1 });

            for (let i = 0; i < d.length; i++) {
                const row = d[i];
                const rowStr = row.map(c => String(c).toLowerCase().trim());
                if (rowStr.includes('name') || rowStr.includes('product name') || rowStr.includes('product_name')) {
                    headerRowIndex = i;
                    rawData = d;
                    // Build Map
                    row.forEach((col, idx) => {
                        const cleanCol = String(col).toLowerCase().trim().replace(/[\s_-]+/g, '');
                        if (cleanCol.includes('productname') || cleanCol === 'name') headerMap['name'] = idx;
                        else if (cleanCol.includes('buyprice') || cleanCol.includes('cost')) headerMap['buy_price'] = idx;
                        else if (cleanCol.includes('sellprice') || cleanCol.includes('price')) headerMap['sell_price'] = idx;
                        else if (cleanCol.includes('stock') || cleanCol.includes('quantity') || cleanCol.includes('qty')) headerMap['stock'] = idx;
                        else if (cleanCol.includes('category')) headerMap['category'] = idx;
                    });
                    break;
                }
            }
            if (headerRowIndex !== -1) break;
        }

        if (headerRowIndex === -1) {
            console.error("FAIL: Could not find header row");
            return;
        }

        console.log("Header found at index:", headerRowIndex);
        console.log("Header Map:", headerMap);

        const items = [];
        for (let i = headerRowIndex + 1; i < rawData.length; i++) {
            const row = rawData[i];
            if (!row || !row[headerMap['name']]) continue;

            const name = row[headerMap['name']];
            let stockVal = row[headerMap['stock']];
            let stock = 0;
            if (typeof stockVal === 'string' && stockVal.toLowerCase().includes('out')) {
                stock = 0;
            } else {
                stock = parseInt(stockVal) || 0;
            }

            items.push({
                name,
                category: row[headerMap['category']],
                buy: row[headerMap['buy_price']],
                sell: row[headerMap['sell_price']],
                stock
            });
        }

        console.log("Parsed Items:", items);
        console.log("SUCCESS: Test Passed");

    } catch (e) {
        console.error("CRASH:", e);
    }
}

testExcelParsing();
