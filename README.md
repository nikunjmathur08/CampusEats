Intentionally vulnerable. For workshop use only. Never deploy this.

# CampusEats

CampusEats is a tiny canteen ordering app built for a first-year security
workshop. Students read the source code and find the planted bugs. All data is
fake: names are invented, every email uses `example.com`, and every secret or
API key in the repo is an obvious placeholder such as `FAKE-sk-test-not-a-real-key`.
The server binds to `127.0.0.1` by default and makes no outbound network calls.

## Requirements

- Node.js 20 or newer (tested on 20, 22 and 24)
- No global installs, no database server, no build step

## Run it

```bash
npm install
npm start
```

Then open <http://127.0.0.1:3000>.

Other commands:

| Command          | What it does                                              |
| ---------------- | --------------------------------------------------------- |
| `npm start`      | Starts the server, creates and seeds `data/campuseats.db` if missing |
| `npm run dev`    | Same as start, but restarts on file changes (`node --watch`) |
| `npm run reset`  | Deletes and reseeds the database (stop the server first)  |

Works the same way on Windows, macOS and Linux. The database is created
automatically on first start, so a fresh clone only needs `npm install`.

The host and port come from environment variables and fall back to safe
defaults; `.env` in the project root is read on startup:

```
HOST=127.0.0.1
PORT=3000
```

## Demo accounts

| Username | Password     | Role     |
| -------- | ------------ | -------- |
| admin    | admin123     | admin    |
| priya    | password123  | customer |
| rahul    | rahul@123    | customer |
| sneha    | sunnyday42   | customer |
| arjun    | campus2024   | customer |

New accounts registered through the UI also work.

## What is in the app

- Product list and search, product page with reviews
- Register, login, logout
- Cart, coupon field and checkout (creates an order)
- Order history, single order page and receipt download
- Profile page (email and address)
- Admin dashboard with a report export
- Error page

Seed data: 12 canteen products, 5 users (one admin), 3 orders and 6 reviews.

## Project layout

```
server.js                 Express app, middleware, error handler
config.js                 Config and .env loading
db.js                     SQLite setup and seed data
routes/auth.js            Register, login, logout, profile
routes/search.js          Search and product pages
routes/orders.js          Cart, checkout, orders, receipts
routes/admin.js           Admin dashboard and report export
scripts/export-report.js  Writes data/report.txt
views/                    EJS templates
public/                   style.css and app.js
receipts/                 Sample receipt text files
data/                     SQLite file (created on first start)
```

## Where things are stored

- Database: `data/campuseats.db` (created and seeded on first start)
- Report exports: `data/report.txt`
- Receipts: `receipts/order-<id>.txt`
