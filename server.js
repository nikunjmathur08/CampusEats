const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const _ = require('lodash');
const config = require('./config');
const db = require('./db');
const authRoutes = require('./routes/auth');
const searchRoutes = require('./routes/search');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.locals.title = 'CampusEats';
  res.locals.message = '';
  res.locals.stack = '';
  res.locals.sql = '';
  const sid = req.cookies.sid;
  req.session = sid ? authRoutes.sessions[sid] : null;
  req.user = req.session ? db.findUserById(req.session.userId) : null;
  res.locals.currentUser = req.user;
  let cart = [];
  try {
    cart = JSON.parse(req.cookies.cart || '[]');
  } catch (err) {
    cart = [];
  }
  res.locals.cartCount = cart.reduce((total, item) => total + item.qty, 0);
  next();
});

app.get('/', (req, res) => {
  const products = db.all('SELECT * FROM products');
  res.render('home', { products: _.sortBy(products, 'name') });
});

app.use('/', authRoutes);
app.use('/', searchRoutes);
app.use('/', orderRoutes);
app.use('/', adminRoutes);

app.use((req, res) => res.status(404).render('error', { title: 'Not found', message: 'Sorry, that page does not exist.' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', {
    title: 'Something broke',
    message: err.message,
    stack: err.stack,
    sql: err.sql || '',
  });
});

app.listen(config.port, config.host, () => {
  console.log('CampusEats running at http://' + config.host + ':' + config.port);
});
