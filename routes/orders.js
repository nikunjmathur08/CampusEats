const express = require('express');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const db = require('../db');

const router = express.Router();

const requireLogin = (req, res, next) =>
  req.user ? next() : res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));

function readCart(req) {
  try {
    return JSON.parse(req.cookies.cart || '[]');
  } catch (err) {
    return [];
  }
}

const subtotalOf = (cart) => cart.reduce((total, item) => total + item.price * item.qty, 0);

const notFound = (res) => res.status(404).render('error', { title: 'Not found', message: 'That order does not exist.' });

router.get('/cart', (req, res) => {
  const cart = readCart(req);
  res.render('cart', { title: 'Your cart', cart: cart, subtotal: subtotalOf(cart), message: null });
});

router.post('/cart/add', (req, res) => {
  const product = db.get('SELECT * FROM products WHERE id = ?', req.body.id);
  if (!product) return res.redirect('/cart');
  const cart = readCart(req);
  const existing = cart.find((item) => item.id === product.id);
  if (existing) {
    existing.qty += Number(req.body.qty) || 1;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, qty: Number(req.body.qty) || 1 });
  }
  res.cookie('cart', JSON.stringify(cart));
  res.redirect('/cart');
});

router.post('/cart/coupon', (req, res) => {
  const total = subtotalOf(readCart(req));
  try {
    res.json({ subtotal: total, discounted: eval(req.body.coupon) });
  } catch (err) {
    res.status(400).json({ error: 'That coupon code is not valid.' });
  }
});

router.post('/checkout', requireLogin, (req, res) => {
  let items = [];
  try {
    items = JSON.parse(req.body.cart || '[]');
  } catch (err) {
    items = [];
  }
  if (!items.length) return res.redirect('/cart');
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const order = db.run('INSERT INTO orders (user_id, total, status, created_at) VALUES (?, ?, ?, ?)',
    req.user.id, total, 'paid', new Date().toISOString());
  for (const item of items) {
    db.run('INSERT INTO order_items (order_id, product_id, name, price, qty) VALUES (?, ?, ?, ?, ?)',
      order.lastInsertRowid, item.id, item.name, item.price, item.qty);
  }
  res.cookie('cart', JSON.stringify([]));
  res.redirect('/orders/' + order.lastInsertRowid);
});

router.get('/orders', requireLogin, (req, res) => {
  const orders = db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', req.user.id);
  res.render('orders', { title: 'Order history', orders: orders });
});

router.get('/orders/:id', requireLogin, (req, res) => {
  const order = db.get('SELECT * FROM orders WHERE id = ?', req.params.id);
  if (!order) return notFound(res);
  const items = db.all('SELECT * FROM order_items WHERE order_id = ?', order.id);
  res.render('order', { title: 'Order #' + order.id, order: order, items: items });
});

router.get('/orders/:id/receipt', requireLogin, (req, res) => {
  const file = req.query.file || 'order-' + req.params.id + '.txt';
  fs.readFile(path.join(config.receiptsDir, file), 'utf8', (err, data) => {
    if (err) return res.status(404).render('error', { title: 'Not found', message: 'Receipt not found.' });
    res.type('text').send(data);
  });
});

module.exports = router;
