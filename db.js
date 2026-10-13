const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const config = require('./config');

const USERS = [
  ['admin', 'admin123', 'admin@example.com', 'Admin Office, Block A', 'admin'],
  ['priya', 'password123', 'priya@example.com', 'Hostel 2, Room 214', 'customer'],
  ['rahul', 'rahul@123', 'rahul@example.com', 'Hostel 1, Room 108', 'customer'],
  ['sneha', 'sunnyday42', 'sneha@example.com', 'Day Scholar Quarters, Flat 3', 'customer'],
  ['arjun', 'campus2024', 'arjun@example.com', 'Hostel 3, Room 330', 'customer'],
];

const PRODUCTS = [
  ['Masala Dosa', 'Crispy rice crepe with spiced potato filling, served with sambar and chutney.', 3.5, 'Breakfast'],
  ['Samosa (2 pc)', 'Golden fried pastry parcels stuffed with peas and potatoes.', 1.5, 'Snacks'],
  ['Veg Sandwich', 'Toasted multigrain sandwich with cucumber, tomato and mint mayo.', 2.75, 'Snacks'],
  ['Paneer Roll', 'Soft flatbread rolled around grilled paneer, onions and green chutney.', 4.0, 'Lunch'],
  ['Chole Bhature', 'Fluffy fried bread served with tangy chickpea curry.', 3.25, 'Lunch'],
  ['Idli Sambar', 'Steamed rice cakes with lentil stew and coconut chutney.', 2.5, 'Breakfast'],
  ['Veg Thali', 'Roti, dal, rice, seasonal sabzi, salad and a small dessert.', 5.5, 'Lunch'],
  ['Maggi Noodles', 'Two minute masala noodles, the classic study fuel.', 1.75, 'Snacks'],
  ['Fresh Lime Soda', 'Chilled lime, mint and soda, sweet or salty.', 1.25, 'Drinks'],
  ['Masala Chai', 'Cutting chai brewed with ginger and cardamom.', 0.75, 'Drinks'],
  ['Cold Coffee', 'Blended iced coffee with a scoop of vanilla ice cream.', 2.0, 'Drinks'],
  ['Chocolate Brownie', 'Dense chocolate brownie with walnuts.', 1.8, 'Desserts'],
];

const REVIEWS = [
  [1, 'priya', 5, 'Best dosa on campus, the chutney is excellent.'],
  [1, 'rahul', 4, 'Good portion for the price, service is quick.'],
  [4, 'sneha', 4, 'Paneer was fresh and the roll is quite filling.'],
  [7, 'arjun', 5, 'Thali is the best value lunch in the canteen.'],
  [11, 'priya', 3, 'A bit too sweet for me, but nicely chilled.'],
  [12, 'rahul', 5, 'Brownie warmed up with chai is a great combo.'],
];

const ORDERS = [
  { userId: 2, status: 'paid', created: '2026-10-01T09:15:00.000Z', items: [[1, 1], [10, 2]] },
  { userId: 3, status: 'paid', created: '2026-10-03T12:40:00.000Z', items: [[7, 1], [9, 1]] },
  { userId: 4, status: 'paid', created: '2026-10-05T16:05:00.000Z', items: [[4, 2], [12, 1]] },
];

const SCHEMA = [
  "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, email TEXT DEFAULT '', address TEXT DEFAULT '', role TEXT DEFAULT 'customer')",
  'CREATE TABLE products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT DEFAULT \'\', price REAL NOT NULL, category TEXT DEFAULT \'Other\')',
  'CREATE TABLE reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, product_id INTEGER NOT NULL, username TEXT NOT NULL, rating INTEGER DEFAULT 5, body TEXT DEFAULT \'\')',
  'CREATE TABLE orders (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, total REAL NOT NULL, status TEXT DEFAULT \'paid\', created_at TEXT DEFAULT \'\')',
  'CREATE TABLE order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL, product_id INTEGER, name TEXT, price REAL, qty INTEGER)',
];

let db = null;

function getDb() {
  if (!db) db = new Database(config.dbFile);
  return db;
}

function query(kind) {
  return function (sql, ...params) {
    try {
      return getDb().prepare(sql)[kind](...params);
    } catch (err) {
      err.sql = sql;
      throw err;
    }
  };
}

const run = query('run');
const all = query('all');
const get = query('get');

function seed() {
  const database = getDb();
  const insertUser = database.prepare('INSERT INTO users (username, password, email, address, role) VALUES (?, ?, ?, ?, ?)');
  for (const user of USERS) insertUser.run(...user);
  const insertProduct = database.prepare('INSERT INTO products (name, description, price, category) VALUES (?, ?, ?, ?)');
  for (const product of PRODUCTS) insertProduct.run(...product);
  const insertReview = database.prepare('INSERT INTO reviews (product_id, username, rating, body) VALUES (?, ?, ?, ?)');
  for (const review of REVIEWS) insertReview.run(...review);
  const insertOrder = database.prepare('INSERT INTO orders (user_id, total, status, created_at) VALUES (?, ?, ?, ?)');
  const insertItem = database.prepare('INSERT INTO order_items (order_id, product_id, name, price, qty) VALUES (?, ?, ?, ?, ?)');
  for (const order of ORDERS) {
    const total = order.items.reduce((sum, item) => sum + PRODUCTS[item[0] - 1][2] * item[1], 0);
    const info = insertOrder.run(order.userId, total, order.status, order.created);
    for (const item of order.items) {
      const product = PRODUCTS[item[0] - 1];
      insertItem.run(info.lastInsertRowid, item[0], product[0], product[2], item[1]);
    }
  }
}

function ensureDb() {
  if (fs.existsSync(config.dbFile)) return;
  fs.mkdirSync(path.dirname(config.dbFile), { recursive: true });
  db = new Database(config.dbFile);
  getDb().exec(SCHEMA.join(';\n'));
  seed();
}

function reset() {
  if (db) {
    db.close();
    db = null;
  }
  for (const suffix of ['', '-wal', '-shm']) fs.rmSync(config.dbFile + suffix, { force: true });
  ensureDb();
}

const findUserById = (id) => get('SELECT * FROM users WHERE id = ?', id);
const findUserByUsername = (username) => get('SELECT * FROM users WHERE username = ?', username);

ensureDb();

module.exports = { run, all, get, reset, findUserById, findUserByUsername };
