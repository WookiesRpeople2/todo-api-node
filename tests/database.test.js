const fs = require('fs');
const path = require('path');
const { getDb, saveDb } = require('../database/database');

const testDbPath = path.join(__dirname, '..', 'test.db');

let db;

describe('Database Module', () => {
  beforeEach(async () => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    db = null;
    const database = await getDb();
    database.run("DELETE FROM todos");
    saveDb();
  });

  afterEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  test('getDb should initialize database connection', async () => {
    const database = await getDb();
    expect(database).toBeDefined();
  });

  test('getDb should create todos table', async () => {
    const database = await getDb();
    const result = database.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='todos'");
    expect(result.length).toBeGreaterThan(0);
  });

  test('should insert and retrieve a todo', async () => {
    const database = await getDb();
    database.run("INSERT INTO todos (title, description, status) VALUES (?, ?, ?)", 
      ['Test Todo', 'Test Description', 'pending']);
    
    const result = database.exec("SELECT * FROM todos WHERE title = ?", ['Test Todo']);
    expect(result[0].values.length).toBe(1);
    expect(result[0].values[0][1]).toBe('Test Todo');
  });

  test('should handle multiple inserts', async () => {
    const database = await getDb();
    database.run("INSERT INTO todos (title, status) VALUES (?, ?)", ['Todo 1', 'pending']);
    database.run("INSERT INTO todos (title, status) VALUES (?, ?)", ['Todo 2', 'completed']);
    
    const result = database.exec("SELECT * FROM todos");
    expect(result[0].values.length).toBe(2);
  });

  test('saveDb should persist database', async () => {
    const database = await getDb();
    database.run("INSERT INTO todos (title) VALUES (?)", ['Persist Test']);
    saveDb();
    
    expect(fs.existsSync(path.join(__dirname, '..', 'todo.db'))).toBeTruthy();
  });
});
