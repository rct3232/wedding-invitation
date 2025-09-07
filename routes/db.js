const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const Database = require('better-sqlite3');

// DB file under data directory
const dataDir = path.join(__dirname, '..', 'data/db');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, 'app.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
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

const stmtSelectInvitation = db.prepare('SELECT json FROM invitation_data WHERE id=?');
const stmtInsertInvitation = db.prepare('INSERT INTO invitation_data(id,json) VALUES(?,?)');
const stmtExistsInvitation = db.prepare('SELECT 1 FROM invitation_data WHERE id=?');
const stmtInsertGuestbook = db.prepare('INSERT INTO guestbook(invitation_id,name,message,created_at) VALUES(?,?,?,?)');
const stmtSelectGuestbook = db.prepare('SELECT name,message,created_at FROM guestbook WHERE invitation_id=? ORDER BY created_at ASC');
const stmtCountUpload = db.prepare('SELECT COUNT(*) as cnt FROM upload_hash WHERE invitation_id=?');
const stmtInsertUploadHash = db.prepare('INSERT OR IGNORE INTO upload_hash(invitation_id,file_name,hash) VALUES(?,?,?)');

async function mergeDataJsonOnStartup() {
  const jsonFile = path.join(__dirname, '..', 'data/data.json');
  try {
    const content = await fsPromises.readFile(jsonFile, 'utf8');
    const parsed = JSON.parse(content);
    const insertMissing = db.transaction((entries) => {
      for (const [id, value] of Object.entries(entries)) {
        const exists = stmtExistsInvitation.get(id);
        if (!exists) {
          stmtInsertInvitation.run(id, JSON.stringify(value));
        }
      }
    });
    insertMissing(parsed);
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
}
mergeDataJsonOnStartup();

function getInvitationData(id) {
  const row = stmtSelectInvitation.get(id);
  if (!row) return null;
  try { return JSON.parse(row.json); } catch { return null; }
}

function addGuestbookEntry(invitationId, name, message) {
  stmtInsertGuestbook.run(invitationId, name, message, Date.now());
}

function getGuestbookEntries(invitationId) {
  return stmtSelectGuestbook.all(invitationId).map(r => ({ name: r.name, message: r.message }));
}

function getNextUploadIndex(invitationId) {
  return stmtCountUpload.get(invitationId).cnt + 1;
}

function addUploadHash(invitationId, fileName, hash) {
  stmtInsertUploadHash.run(invitationId, fileName, hash);
}

function checkDuplicateHashes(invitationId, hashes) {
  if (!hashes.length) return [];
  const placeholders = hashes.map(() => '?').join(',');
  const sql = `SELECT hash FROM upload_hash WHERE invitation_id=? AND hash IN (${placeholders})`;
  const rows = db.prepare(sql).all(invitationId, ...hashes);
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
