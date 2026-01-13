
const Database = require('better-sqlite3');
const db = new Database('ahsania.db');

try {
    const services = db.prepare("SELECT * FROM services").all();
    console.log("Services:", services);

    const products = db.prepare("SELECT * FROM products").all();
    console.log("Products (first 5):", products.slice(0, 5));
} catch (error) {
    console.error("Error reading DB:", error);
}
