const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const sep = line.indexOf('=');
    if (sep === -1) continue;
    const key = line.slice(0, sep).trim();
    let value = line.slice(sep + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile();

module.exports = {
  host: process.env.HOST || '127.0.0.1',
  port: Number(process.env.PORT || 3000),
  sessionSecret: process.env.SESSION_SECRET || 'FAKE-session-secret-not-for-production',
  dbPassword: process.env.DB_PASSWORD || 'FAKE-db-password-not-for-production',
  paymentApiKey: 'FAKE-sk-test-not-a-real-key',
  dbFile: process.env.DB_FILE || path.join(__dirname, 'data', 'campuseats.db'),
  receiptsDir: path.join(__dirname, 'receipts'),
  projectDir: __dirname,
};
