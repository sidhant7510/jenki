const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import CORS middleware
require('dotenv').config();

const app = express();

const corsOptions = {
  origin: 'http://192.168.1.57:3001',  // Your frontend URL
  methods: ['GET', 'POST', 'DELETE'], // Allow specific methods (you can add more if needed)
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow headers you want
};

// Use CORS middleware
app.use(cors(corsOptions));

// Middleware
app.use(bodyParser.json());


// Environment Variables
const PORT = process.env.PORT || 5000;
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

// Create MySQL connection pool
const db = mysql.createPool(dbConfig);

// Check database connection and create the table if it doesn't exist
db.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    process.exit(1);
  }
  console.log("Connected to the MySQL database!");

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS todos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL
    );
  `;
  connection.query(createTableQuery, (err) => {
    if (err) {
      console.error("Error creating the todos table:", err);
      process.exit(1);
    }
    console.log("Table 'todos' is ready.");
  });

  // Release the connection
  connection.release();
});

// Routes
app.get("/todos", (req, res) => {
  const query = "SELECT * FROM todos";
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Database error" });
    } else {
      res.json(results);
    }
  });
});

app.post("/todos", (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  const query = "INSERT INTO todos (title) VALUES (?)";
  db.query(query, [title], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Database error" });
    } else {
      res.json({ id: results.insertId, title });
    }
  });
});

app.delete("/todos/:id", (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM todos WHERE id = ?";
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Database error" });
    } else if (results.affectedRows === 0) {
      res.status(404).json({ error: "Todo not found" });
    } else {
      res.json({ message: "Todo deleted" });
    }
  });
});

// Start the server
app.listen(PORT,'0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
