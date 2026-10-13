const express = require('express');
const { exec } = require('child_process');
const config = require('../config');
const db = require('../db');

const router = express.Router();

function dashboardStats() {
  return {
    users: db.get('SELECT COUNT(*) AS count FROM users').count,
    products: db.get('SELECT COUNT(*) AS count FROM products').count,
    orders: db.get('SELECT COUNT(*) AS count FROM orders').count,
    revenue: db.get('SELECT COALESCE(SUM(total), 0) AS sum FROM orders').sum,
  };
}

router.get('/admin', (req, res) =>
  res.render('admin', { title: 'Admin dashboard', stats: dashboardStats(), result: null, name: '' }));

router.get('/admin/export', (req, res) => {
  const name = req.query.name || 'report';
  exec('node scripts/export-report.js ' + name, { cwd: config.projectDir }, (err, stdout, stderr) => {
    if (err) return res.status(500).render('error', { title: 'Export failed', message: stderr || err.message });
    res.render('admin', { title: 'Admin dashboard', stats: dashboardStats(), result: stdout.trim(), name: name });
  });
});

module.exports = router;
