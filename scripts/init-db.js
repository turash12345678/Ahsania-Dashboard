const { createClient } = require("@libsql/client");
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const db = createClient({
  url: 'libsql://ahsania-db-turashahsan8.aws-ap-northeast-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjM3MjQzOTcsImlkIjoiNzMxYTI0YjgtMmEyZS00NjZlLWFiZDMtMWMzZDk0MzdhNDA1IiwicmlkIjoiMzhiMzllODgtODE3MC00ZTdmLTk4NmQtNmVjY2RkYjRmZDEwIn0.WAfBeZ69cPg3VYqvjtiCIqjtW0HbbpKwTVJ9O8t3BE85fQC6tiJOmKrS8wfjW7s1IVoaGXCoNlKKXygpFRKTCQ',
});

async function init() {
  console.log('Initializing Turso database...');

  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('manager', 'shopkeeper', 'accounts')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('product', 'service'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_id INTEGER,
      buy_price REAL NOT NULL,
      sell_price REAL NOT NULL,
      stock_quantity INTEGER DEFAULT 0,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_id INTEGER,
      price REAL NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'bkash', 'nagad')),
      sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      item_type TEXT NOT NULL CHECK(item_type IN ('product', 'service')),
      item_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price_at_sale REAL NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales(id)
    )
  `);

  // Seed Admin User
  const adminExists = await db.execute({
    sql: 'SELECT * FROM users WHERE username = ?',
    args: ['admin']
  });

  if (adminExists.rows.length === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    await db.execute({
      sql: 'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      args: ['admin', hash, 'manager']
    });
    console.log('Admin user created.');
  }

  // Seed Categories
  const categories = [
    { name: 'Printing', type: 'service' },
    { name: 'Stationery', type: 'product' },
    { name: 'Tech Accessories', type: 'product' },
    { name: 'Design', type: 'service' }
  ];

  for (const cat of categories) {
    try {
      await db.execute({
        sql: 'INSERT INTO categories (name, type) VALUES (?, ?)',
        args: [cat.name, cat.type]
      });
    } catch (e) {
      // Ignore unique constraint errors
    }
  }
  console.log('Categories seeded.');

  console.log('Database initialized successfully.');
}

init().catch(console.error);
