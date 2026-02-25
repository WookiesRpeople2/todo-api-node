/**
 * Database module for SQLite operations using sql.js
 * Provides file-backed in-memory database with persistence
 */
const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

// Database file path in project root
const DB_PATH = path.join(__dirname, "..", "todo.db");

// Singleton database instance
let db;

/**
 * Get database instance (singleton pattern)
 * Initializes database from file if exists, or creates new in-memory database
 * Creates todos table if it doesn't exist
 * @returns {Promise<Database>} SQLite database instance
 */
async function getDb() {
  // Return existing instance if already initialized
  if (db) return db;
  
  console.log("initializing database connection");
  const SQL = await initSqlJs();
  
  // Load existing database from file or create new one
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  // Ensure todos table exists with proper schema
  db.run(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending'
    )
  `);
  
  return db;
}

/**
 * Persist in-memory database to disk
 * Exports database binary and writes to file
 * Should be called after any data modification
 */
function saveDb() {
  if (db) {
    console.log("saving database to disk");
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }
}

module.exports = { getDb, saveDb };
