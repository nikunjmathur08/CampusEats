const fs = require('fs');
const path = require('path');
const config = require('../config');
const db = require('../db');

const label = process.argv[2] || 'report';
const products = db.all('SELECT * FROM products');
const orders = db.all('SELECT * FROM orders');
const revenue = orders.reduce((total, order) => total + order.total, 0);

const lines = [
  'CampusEats report: ' + label,
  'Generated: ' + new Date().toISOString(),
  'Products on the menu: ' + products.length,
  'Orders placed: ' + orders.length,
  'Revenue: ' + revenue.toFixed(2),
];
for (const product of products) {
  lines.push('  - ' + product.name + ' (' + product.category + ') ' + product.price.toFixed(2));
}

const outFile = path.join(config.projectDir, 'data', 'report.txt');
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, lines.join('\n') + '\n');
console.log('Report written to ' + outFile);
