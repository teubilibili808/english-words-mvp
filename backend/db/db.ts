const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const dbDir = __dirname;
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      passwordHash TEXT,
      createdAt TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      word TEXT,
      meaning TEXT,
      level TEXT,
      memoryLevel INTEGER,
      forgetStreak INTEGER,
      reviewCount INTEGER,
      lastReviewedDate TEXT,
      nextReviewDate TEXT,
      isDifficult INTEGER,
      note TEXT,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);
});

function run(sql: string, params: unknown[] = []) {
  return new Promise<{ lastID: number; changes: number }>((resolve, reject) => {
    db.run(sql, params, function onRun(this: { lastID: number; changes: number }, err: Error | null) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get<T = unknown>(sql: string, params: unknown[] = []) {
  return new Promise<T | undefined>((resolve, reject) => {
    db.get(sql, params, (err: Error | null, row: T | undefined) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all<T = unknown>(sql: string, params: unknown[] = []) {
  return new Promise<T[]>((resolve, reject) => {
    db.all(sql, params, (err: Error | null, rows: T[]) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

module.exports = {
  db,
  run,
  get,
  all,
};
