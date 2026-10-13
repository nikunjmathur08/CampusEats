const express = require('express');
const db = require('../db');

const router = express.Router();

const requireLogin = (req, res, next) =>
  req.user ? next() : res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));

router.get('/search', (req, res) => {
  const q = (req.query.q || '').trim();
  const sql = "SELECT * FROM products WHERE name LIKE '%" + q + "%' OR description LIKE '%" + q + "%'";
  const products = q ? db.all(sql) : [];
  res.render('search', { title: 'Search', q: q, products: products });
});

const notFound = (res) => res.status(404).render('error', { title: 'Not found', message: 'That product does not exist.' });

router.get('/products/:id', (req, res) => {
  const product = db.get('SELECT * FROM products WHERE id = ?', req.params.id);
  if (!product) return notFound(res);
  const reviews = db.all('SELECT * FROM reviews WHERE product_id = ? ORDER BY id DESC', product.id);
  res.render('product', { title: product.name, product: product, reviews: reviews });
});

router.post('/products/:id/reviews', requireLogin, (req, res) => {
  const product = db.get('SELECT * FROM products WHERE id = ?', req.params.id);
  if (!product) return notFound(res);
  db.run('INSERT INTO reviews (product_id, username, rating, body) VALUES (?, ?, ?, ?)',
    product.id, req.user.username, Number(req.body.rating) || 5, req.body.body);
  res.redirect('/products/' + product.id);
});

module.exports = router;
