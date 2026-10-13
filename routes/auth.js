const express = require('express');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router();
const sessions = {};

const md5 = (text) => crypto.createHash('md5').update(text).digest('hex');

function startSession(res, userId) {
  const sid = String(Date.now()) + '-' + userId;
  sessions[sid] = { userId: userId, createdAt: Date.now() };
  res.cookie('sid', sid);
}

const requireLogin = (req, res, next) =>
  req.user ? next() : res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));

router.get('/register', (req, res) => res.render('register', { title: 'Create an account', error: null }));

router.post('/register', (req, res) => {
  const { username, password, email, address } = req.body;
  if (!username || !password) {
    return res.render('register', { title: 'Create an account', error: 'Username and password are required.' });
  }
  if (db.findUserByUsername(username)) {
    return res.render('register', { title: 'Create an account', error: 'That username is already taken.' });
  }
  const info = db.run('INSERT INTO users (username, password, email, address, role) VALUES (?, ?, ?, ?, ?)',
    username, md5(password), email || '', address || '', 'customer');
  startSession(res, info.lastInsertRowid);
  res.redirect('/profile');
});

router.get('/login', (req, res) =>
  res.render('login', { title: 'Log in', error: null, next: req.query.next || '/' }));

router.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const sql = "SELECT * FROM users WHERE username = '" + username +
    "' AND (password = '" + password + "' OR password = '" + md5(password) + "')";
  const user = db.get(sql);
  if (!user) {
    return res.status(401).render('login', { title: 'Log in', error: 'Invalid username or password.', next: req.body.next || '/' });
  }
  startSession(res, user.id);
  res.redirect(req.body.next || '/');
});

router.post('/logout', (req, res) => res.clearCookie('sid').redirect('/'));

router.get('/profile', requireLogin, (req, res) =>
  res.render('profile', { title: 'My profile', message: req.query.updated ? 'Profile updated.' : null }));

router.post('/profile', requireLogin, (req, res) => {
  db.run('UPDATE users SET email = ?, address = ?, role = ? WHERE id = ?',
    req.body.email, req.body.address, req.body.role, req.user.id);
  res.redirect('/profile?updated=1');
});

module.exports = router;
module.exports.sessions = sessions;
