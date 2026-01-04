
const { createClient } = require('@libsql/client');

const client = createClient({
    url: 'libsql://ahsania-db-turashahsan8.aws-ap-northeast-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjM3MjQzOTcsImlkIjoiNzMxYTI0YjgtMmEyZS00NjZlLWFiZDMtMWMzZDk0MzdhNDA1IiwicmlkIjoiMzhiMzllODgtODE3MC00ZTdmLTk4NmQtNmVjY2RkYjRmZDEwIn0.WAfBeZ69cPg3VYqvjtiCIqjtW0HbbpKwTVJ9O8t3BE85fQC6tiJOmKrS8wfjW7s1IVoaGXCoNlKKXygpFRKTCQ'
});

const rawData = `হাইস্কুল কলম	Stationery	4.35	5	59
হাইস্পিড কলম	Stationery	3.75	5	27
টপার কালার কলম	Stationery	6	6	2
জড়ি কলম	Stationery	11.75	20	18
অলটাইম কলম	Stationery	5.17	6	29
ফ্রেশ স্প্রিন্ট কলম	Stationery	4.5	5	Out of Stock
কালম মার্কার 	Stationery	16.6	25	6
মোটা মার্কার	Stationery	15	30	8
VIP 120 খাতা	Stationery	20	25	Out of Stock
VIP 160 খাতা	Stationery	19.1	25	12
ফ্রেশ বাইন্ডিং খাতা	Stationery	42.5	55	Out of Stock
MP খাতা	Stationery	36.6	45	Out of Stock
VIP 52 খাতা	Stationery	6.4	10	51
VIP 300 খাতা	Stationery	12.91	20	28
72 P খাতা	Stationery	15.82	35	37
52 P খাতা	Stationery	10.13	25	36
টালী খাতা	Stationery	55	70	5
রেজিস্টারী খাতা	Stationery	35	50	6
হাজিরা খাতা	Stationery	35	50	6
সাদা খাতা	Stationery	15.2	25	11
নিউজ প্রিন্ট খাতা	Stationery	10.4	20	16
কাটার	Stationery	4	5	179
রাবার	Stationery	4	5	92
C3 রঙ (ছোট)	Stationery	29.5	50	10
C3 রঙ (বড়)	Stationery	60	120	2
DOMG রঙ (ছোট)	Stationery	39.5	60	7
DOMG রঙ (বড়)	Stationery	70	150	3
LCD স্লেট	Stationery	110	150	7
বক্স রঙ	Stationery	50	60	Out of Stock
ফ্রেশ পেন্সিল বক্স	Stationery	33.3	60	4
চিকন পেন্সিল বক্স	Stationery	33.3	50	8
পেন্সিল	Stationery	3	5	47
C3 পেন্সিল	Stationery	5	10	151
বড় কাটার	Stationery	11.6	20	11
স্ট্যাপলার পিন RANGE ছোট 	Stationery	15	20	19
স্টেপলার পিন POWER	Stationery	17	25	2
হেন্ড ব্যাগ (নরমাল)	Stationery	15.8	20	Out of Stock
হেন্ড ব্যাগ (২ পার্ট)	Stationery	15.8	25	6
কাচি	Stationery	45	50	3
স্ট্যাম্প (৫০)	Stationery	57	65	Out of Stock
স্ট্যাম্প (১০০)	Stationery	107	120	1
হলুদ কস্টেপ	Stationery	50	70	4
সাদা কস্টেপ	Stationery	4.5	15	9
কালো কস্টেপ	Stationery	12.9	25	8
ফেবিকন আঠা	Stationery	14	25	5
GITTEN ক্যালকুলেটর	Stationery	120	200	2
KENKO ক্যালকুলেটর	Stationery	125	150	3
হার্ডবোর্ড (MUNNA)	Stationery	24	50	2
হার্ডবোর্ড (MAA)	Stationery	22.91	40	12
হার্ডবোর্ড (RAKIB)	Stationery	18.3	30	2
সাদা ফাইল	Stationery	8.3	20	6
বড় ছাতা	Stationery	220	30	Out of Stock
ছোট ছাতা	Stationery	250	400	Out of Stock
 কালো স্লেট	Stationery	40	70	4
কার্বন পেপার	Stationery	3.8	10	100
প্লাস্টিক স্কেল	Stationery	10	15	12
রাবার স্কেল	Stationery	19.16	25	2
স্টিল স্কেল	Stationery	12.91	30	15
রহিম চক	Stationery	7.19	20	39
আদর্শলিপি বই (কম্বো)	Stationery	80	150	Out of Stock
কায়দা	Stationery	11.25	30	21
আমপারা	Stationery	14.16	30	7
রেহাল	Stationery	70	150	5
কুরআন শরীফ	Stationery	170	300	Out of Stock
কুরআন শরীফ (অর্থসহ)	Stationery	380	600	1
 ব্যাট ANWAR (১টা)	Stationery	96.25	180	6
জালি ব্যাট - বড় (১টা)	Stationery	83.75	150	4
জালি ব্যাট - ছোট (১টা)	Stationery	71.25	130	2
পানির বোতল (বড়)	Stationery	60	100	12
পাানির বোতল (ছোট)	Stationery	60	80	7
ফ্লুইট	Stationery	19.58	25	10
মার্শাল জ্যামিতি বক্স	Stationery	66.25	120	10
ম্যাক্স জ্যামিতি বক্স	Stationery	67.91	100	11
DOMG জলরং ১২	Stationery	32	60	1
DOMG জলরং ১৮	Stationery	45	80	2
স্ট্যাপলার মেশিন RANGE ছোট 	Stationery	32.5	50	6
স্ট্যাপলার মেশিন (পিন সহ)	Stationery	56	100	6
স্ট্যাপলার মেশিন RANGE বড়	Stationery	80	120	3
স্ট্যাপলার মেশিন POWER	Stationery	115	150	1
DOMG সাইন পেন	Stationery	4.64	10	27
বাইন্ডার ক্লিপ	Stationery	4.58	10	36
প্রাইজ রুল	Stationery	16.5	20	9
অলিম্পিক ব্যাটারী	Stationery	16.5	20	10
অলিম্পিক গোল্ড ব্যাটারী	Stationery	17.5	20	3
ফ্লাওয়ার SMASH	Stationery	13	30	9
ফ্লাওয়ার T10	Stationery	12.91	20	12
ক্লে	Stationery	2.55	5	85
বল সুতা	Stationery	4.37	10	19
ডাইরি ২৪০	Stationery	72.5	150	2
ডাইরি সিনারি	Stationery	82.5	180	2
বাচ্চাদের বই	Stationery	10	30	69
কালার পেপার	Stationery	1	2	500
কালার পেপার (মাল্টি)	Stationery	1	2	216`;

async function main() {
    console.log("Parsing data...");
    const lines = rawData.split('\n');
    let imported = 0;

    // 1. Ensure Category
    let categoryId = null;
    const catName = 'Stationery';

    // Check if category exists
    const catRes = await client.execute({
        sql: "SELECT id FROM categories WHERE name = ? AND type = 'product'",
        args: [catName]
    });

    if (catRes.rows.length > 0) {
        categoryId = catRes.rows[0].id;
    } else {
        await client.execute({ sql: "INSERT INTO categories (name, type) VALUES (?, 'product')", args: [catName] });
        const newCat = await client.execute({ sql: "SELECT id FROM categories WHERE name = ?", args: [catName] });
        categoryId = newCat.rows[0].id;
    }

    console.log(`Using Category ID: ${categoryId}`);

    // 2. Process Rows
    for (const line of lines) {
        if (!line.trim()) continue;

        // Split by Tab (copied from spreadsheet)
        const parts = line.split('\t');
        if (parts.length < 5) continue;

        const name = parts[0].trim();
        // Skip header if included
        if (name === 'PRODUCT NAME') continue;

        // parts[1] is Category (we have it)
        const buyPrice = parseFloat(parts[2]) || 0;
        const sellPrice = parseFloat(parts[3]) || 0;

        let stockStr = parts[4].trim().toLowerCase();
        let stock = 0;
        if (stockStr.includes('out')) {
            stock = 0;
        } else {
            stock = parseInt(parts[4]) || 0;
        }

        try {
            await client.execute({
                sql: "INSERT INTO products (name, category_id, buy_price, sell_price, stock_quantity) VALUES (?, ?, ?, ?, ?)",
                args: [name, categoryId, buyPrice, sellPrice, stock]
            });
            imported++;
        } catch (e) {
            console.error(`Error inserting ${name}: ${e.message}`);
        }
    }

    console.log(`Successfully imported ${imported} products.`);
}

main();
