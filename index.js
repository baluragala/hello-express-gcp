// app.js
const express = require("express");
const mysql = require("mysql2"); // Using mysql2 for promises support
const bodyParser = require("body-parser");

const app = express();
const port = 8080;

// Middleware to parse JSON request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// --- MySQL Database Configuration ---
// IMPORTANT: Replace with your actual database credentials
const dbConfig = {
  host: "35.225.1.235",
  user: "todo_app_api", // e.g., 'root'
  password: "PM0%^xHA1q_1e0IT", // e.g., 'password'
  database: "todo_app_db", // The database we will create
};

// Create a connection pool for better performance and resilience
const pool = mysql.createPool(dbConfig);

// Test database connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to the database:", err.stack);
    return;
  }
  console.log("Connected to MySQL database as ID " + connection.threadId);
  connection.release(); // Release the connection back to the pool
});

// --- API Endpoints for Todos ---

/**
 * @route GET /todos
 * @description Get all todo items
 */
app.get("/todos", (req, res) => {
  const sql = "SELECT * FROM todos ORDER BY created_at DESC";
  pool.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching todos:", err);
      return res.status(500).json({ error: "Failed to fetch todos" });
    }
    res.status(200).json(results);
  });
});

/**
 * @route GET /todos/:id
 * @description Get a single todo item by ID
 */
app.get("/todos/:id", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM todos WHERE id = ?";
  pool.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error fetching todo by ID:", err);
      return res.status(500).json({ error: "Failed to fetch todo" });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: "Todo not found" });
    }
    res.status(200).json(result[0]);
  });
});

/**
 * @route POST /todos
 * @description Create a new todo item
 * @body {string} title - The title of the todo
 * @body {boolean} [completed=false] - Whether the todo is completed
 */
app.post("/todos", (req, res) => {
  const { title, completed } = req.body;

  // Basic validation
  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  const sql = "INSERT INTO todos (title, completed) VALUES (?, ?)";
  pool.query(sql, [title, completed || false], (err, result) => {
    if (err) {
      console.error("Error creating todo:", err);
      return res.status(500).json({ error: "Failed to create todo" });
    }
    res.status(201).json({
      message: "Todo created successfully",
      id: result.insertId,
      title,
      completed: completed || false,
    });
  });
});

/**
 * @route PUT /todos/:id
 * @description Update an existing todo item
 * @body {string} [title] - The new title of the todo
 * @body {boolean} [completed] - The new completion status of the todo
 */
app.put("/todos/:id", (req, res) => {
  const { id } = req.params;
  const { title, completed } = req.body;

  // Ensure at least one field is provided for update
  if (title === undefined && completed === undefined) {
    return res.status(400).json({
      error: "At least one field (title or completed) is required for update",
    });
  }

  let sql = "UPDATE todos SET ";
  const params = [];
  const updates = [];

  if (title !== undefined) {
    updates.push("title = ?");
    params.push(title);
  }
  if (completed !== undefined) {
    updates.push("completed = ?");
    params.push(completed);
  }

  sql += updates.join(", ") + " WHERE id = ?";
  params.push(id);

  pool.query(sql, params, (err, result) => {
    if (err) {
      console.error("Error updating todo:", err);
      return res.status(500).json({ error: "Failed to update todo" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Todo not found" });
    }
    res.status(200).json({ message: "Todo updated successfully" });
  });
});

/**
 * @route DELETE /todos/:id
 * @description Delete a todo item
 */
app.delete("/todos/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM todos WHERE id = ?";
  pool.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error deleting todo:", err);
      return res.status(500).json({ error: "Failed to delete todo" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Todo not found" });
    }
    res.status(200).json({ message: "Todo deleted successfully" });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
