const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const sqlite3 = require('sqlite3').verbose();

// DB file under data directory
const dataDir = path.join(__dirname, '..', 'data/db');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, 'app.db');
const db = new sqlite3.Database(dbPath);

// Small promise helpers over sqlite3
function exec(sql) {
  return new Promise((resolve, reject) => db.exec(sql, (err) => err ? reject(err) : resolve()));
}
function run(sql, params = []) {
  return new Promise((resolve, reject) => db.run(sql, params, function(err) {
    if (err) return reject(err);
    resolve(this);
  }));
}
function get(sql, params = []) {
  return new Promise((resolve, reject) => db.get(sql, params, (err, row) => err ? reject(err) : resolve(row)));
}
function all(sql, params = []) {
  return new Promise((resolve, reject) => db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows)));
}

// Initialize schema
(async () => {
  await exec(`PRAGMA journal_mode = WAL;`);
  await exec(`
CREATE TABLE IF NOT EXISTS invitation_data (
  id TEXT PRIMARY KEY,
  json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS guestbook (
  invitation_id TEXT NOT NULL,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY(invitation_id, name, message, created_at)
);
CREATE TABLE IF NOT EXISTS upload_hash (
  invitation_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  hash TEXT NOT NULL,
  PRIMARY KEY(invitation_id, hash)
);
`);
  await mergeDataJsonOnStartup();
})().catch(() => { /* ignore init errors to not crash server */ });

async function mergeDataJsonOnStartup() {
  const jsonFile = path.join(__dirname, '..', 'data/data.json');
  try {
    const content = await fsPromises.readFile(jsonFile, 'utf8');
    const parsed = JSON.parse(content);
    await exec('BEGIN');
    try {
      for (const [id, value] of Object.entries(parsed)) {
        const exists = await get('SELECT 1 FROM invitation_data WHERE id=?', [id]);
        if (!exists) {
          await run('INSERT INTO invitation_data(id,json) VALUES(?,?)', [id, JSON.stringify(value)]);
        }
      }
      await exec('COMMIT');
    } catch (e) {
      await exec('ROLLBACK');
      throw e;
    }
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
}

// ----- Async DB helpers -----
async function getInvitationData(id) {
  const row = await get('SELECT json FROM invitation_data WHERE id=?', [id]);
  if (!row) return null;
  try { return JSON.parse(row.json); } catch { return null; }
}

async function addGuestbookEntry(invitationId, name, message) {
  await run('INSERT INTO guestbook(invitation_id,name,message,created_at) VALUES(?,?,?,?)', [invitationId, name, message, Date.now()]);
}

async function getGuestbookEntries(invitationId) {
  const rows = await all('SELECT name,message,created_at FROM guestbook WHERE invitation_id=? ORDER BY created_at ASC', [invitationId]);
  return rows.map(r => ({ name: r.name, message: r.message }));
}

async function getNextUploadIndex(invitationId) {
  const row = await get('SELECT COUNT(*) as cnt FROM upload_hash WHERE invitation_id=?', [invitationId]);
  return (row?.cnt || 0) + 1;
}

async function addUploadHash(invitationId, fileName, hash) {
  await run('INSERT OR IGNORE INTO upload_hash(invitation_id,file_name,hash) VALUES(?,?,?)', [invitationId, fileName, hash]);
}

async function checkDuplicateHashes(invitationId, hashes) {
  if (!hashes.length) return [];
  const placeholders = hashes.map(() => '?').join(',');
  const sql = `SELECT hash FROM upload_hash WHERE invitation_id=? AND hash IN (${placeholders})`;
  const rows = await all(sql, [invitationId, ...hashes]);
  return rows.map(r => r.hash);
}

module.exports = {
  getInvitationData,
  addGuestbookEntry,
  getGuestbookEntries,
  getNextUploadIndex,
  addUploadHash,
  checkDuplicateHashes,
};
