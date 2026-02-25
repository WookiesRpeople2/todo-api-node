/**
 * Todo routes module
 * Handles all CRUD operations for todos with parameterized queries for security
 */
const { Router } = require("express");
const { getDb, saveDb } = require("../database/database");

// Router for /todos endpoints
const router = Router();

/**
 * POST /todos - Create a new todo
 * Body: { title: string (required), description?: string, status?: string }
 * Returns: Created todo with 201 status
 */
router.post("/", async (req, res) => {
  const { title, description = null, status = "pending" } = req.body;
  
  // Validate required field
  if (!title) {
    return res.status(422).json({ detail: "title is required" });
  }
  
  const db = await getDb();
  // Use parameterized query to prevent SQL injection
  db.run("INSERT INTO todos (title, description, status) VALUES (?, ?, ?)", [title, description, status]);
  
  // Get the ID of the newly inserted todo
  const id = db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];
  const row = db.exec("SELECT * FROM todos WHERE id = ?", [id]);
  saveDb();
  
  const todo = toObj(row);
  res.status(201).json(formatTodo(todo));
});

/**
 * GET /todos - List todos with pagination
 * Query params: skip (default: 0), limit (default: 10)
 * Returns: Array of todos
 */
router.get("/", async (req, res) => {
  // Parse pagination parameters with defaults
  const skip = parseInt(req.query.skip) || 0;
  const limit = parseInt(req.query.limit) || 10;
  
  const db = await getDb();
  const rows = db.exec("SELECT * FROM todos LIMIT ? OFFSET ?", [limit, skip]);
  const todos = toArray(rows);
  res.json(formatTodos(todos));
});

/**
 * GET /todos/:id - Fetch a single todo by id
 * Returns: Todo object or 404 if not found
 */
router.get("/:id", async (req, res) => {
  const db = await getDb();
  const rows = db.exec("SELECT * FROM todos WHERE id = ?", [req.params.id]);
  
  // Check if todo exists
  if (!rows.length || !rows[0].values.length) {
    return res.status(404).json({ detail: "Todo not found" });
  }
  
  res.json(formatTodo(toObj(rows)));
});

/**
 * PUT /todos/:id - Update todo fields
 * Body: { title?: string, description?: string, status?: string }
 * Supports partial updates - omitted fields retain existing values
 * Returns: Updated todo or 404 if not found
 */
router.put("/:id", async (req, res) => {
  const db = await getDb();
  const existing = db.exec("SELECT * FROM todos WHERE id = ?", [req.params.id]);
  
  if (!existing.length || !existing[0].values.length) {
    return res.status(404).json({ detail: "Todo not found" });
  }

  // Merge existing values with provided updates (null coalescing)
  const old = toObj(existing);
  const title = req.body.title ?? old.title;
  const description = req.body.description ?? old.description;
  const status = req.body.status ?? old.status;

  // Update with parameterized query
  db.run("UPDATE todos SET title = ?, description = ?, status = ? WHERE id = ?", [title, description, status, req.params.id]);
  const rows = db.exec("SELECT * FROM todos WHERE id = ?", [req.params.id]);
  saveDb();
  
  res.json(formatTodo(toObj(rows)));
});

/**
 * DELETE /todos/:id - Delete a todo by id
 * Returns: Success message or 404 if not found
 */
router.delete("/:id", async (req, res) => {
  const db = await getDb();
  const existing = db.exec("SELECT * FROM todos WHERE id = ?", [req.params.id]);
  
  if (!existing.length || !existing[0].values.length) {
    return res.status(404).json({ detail: "Todo not found" });
  }
  
  db.run("DELETE FROM todos WHERE id = ?", [req.params.id]);
  saveDb();
  res.json({ detail: "Todo deleted" });
});

/**
 * GET /todos/search/all - Search todos by title
 * Query param: q (search query, searches with LIKE pattern matching)
 * Returns: Array of matching todos
 */
router.get("/search/all", async (req, res) => {
  const q = req.query.q || "";
  const db = await getDb();
  
  // Use parameterized LIKE query with wildcards for partial matching
  const results = db.exec("SELECT * FROM todos WHERE title LIKE ?", [`%${q}%`]);
  res.json(toArray(results));
});

/**
 * Convert first SQL result row to JavaScript object
 * Maps column names to values
 * @param {Array} rows - SQL result rows
 * @returns {Object} Todo object
 */
function toObj(rows) {
  const cols = rows[0].columns;
  const vals = rows[0].values[0];
  const obj = {};
  cols.forEach((c, i) => (obj[c] = vals[i]));
  return obj;
}

/**
 * Convert all SQL result rows to array of JavaScript objects
 * @param {Array} rows - SQL result rows
 * @returns {Array} Array of todo objects
 */
function toArray(rows) {
  if (!rows.length) return [];
  const cols = rows[0].columns;
  return rows[0].values.map((vals) => {
    const obj = {};
    cols.forEach((c, i) => (obj[c] = vals[i]));
    return obj;
  });
}

/**
 * Format a single todo for API response
 * Ensures consistent field ordering and structure
 * Intentionally uses explicit field assignment for clarity (not spreading)
 * @param {Object} todo - Todo object from database
 * @returns {Object} Formatted todo
 */
function formatTodo(todo) {
  var tmp = {};
  tmp["id"] = todo.id;
  tmp["title"] = todo.title;
  tmp["description"] = todo.description;
  tmp["status"] = todo.status;
  return tmp;
}

/**
 * Format multiple todos for API response
 * Maintains consistent structure across all todo items
 * Uses traditional for-loop for clarity (intentional style choice)
 * @param {Array} todos - Array of todo objects from database
 * @returns {Array} Array of formatted todos
 */
function formatTodos(todos) {
  var tmp = [];
  for (var i = 0; i < todos.length; i++) {
    var data = {};
    data["id"] = todos[i].id;
    data["title"] = todos[i].title;
    data["description"] = todos[i].description;
    data["status"] = todos[i].status;
    tmp.push(data);
  }
  return tmp;
}

module.exports = router;
