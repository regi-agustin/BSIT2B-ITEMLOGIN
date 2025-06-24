const express = require("express");
const mysql2 = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

const db = mysql2.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "login",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

db.getConnection((err) => {
  if (err) {
    console.log("Database Connection Failed", err);
  } else {
    console.log("Connected to MySQL database");
  }
});

//register

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const checkUserSql = "SELECT * FROM users WHERE username = ?";

  db.query(checkUserSql, [username], (err, results) => {
    if (err) return res.status(500).json({ message: "Database Error" });
    if (results.length > 0) {
      return res.status(400).json({ message: "Username already exist" });
    }
    const insertUserSql = "INSERT INTO users (username, password) VALUES (?,?)";
    db.query(insertUserSql, [username, hashedPassword], (err, result) => {
      if (err) return res.status(500).json({ message: "Registration Failed" });

      res.status(201).json({ message: "User registered successfully" });
    });
  });
});

// Login User
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const sql = "SELECT * FROM users WHERE username = ?";
  db.query(sql, [username], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ message: "Login successful", token, username: user.username });
  });
});

// Fetch all items for the logged-in user
app.get("/items", (req, res) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).json({ message: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });

    const userId = decoded.id; // Get the user ID from the token
    const fetchItemsSql = "SELECT * FROM items WHERE user_id = ?";
    db.query(fetchItemsSql, [userId], (err, results) => {
      if (err) return res.status(500).json({ message: "Database Error" });

      res.json(results);
    });
  });
});

// Add a new item for the logged-in user
app.post("/items", (req, res) => {
  const { name } = req.body;
  const token = req.headers["authorization"];
  if (!token) return res.status(403).json({ message: "No token provided" });

  if (!name) {
    return res.status(400).json({ message: "Item name is required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });

    const userId = decoded.id; // Get the user ID from the token
    const insertItemSql = "INSERT INTO items (name, user_id) VALUES (?, ?)";
    db.query(insertItemSql, [name, userId], (err, result) => {
      if (err) return res.status(500).json({ message: "Database Error" });

      res.status(201).json({ id: result.insertId, name, user_id: userId });
    });
  });
});

// Delete an item for the logged-in user
app.delete("/items/:id", (req, res) => {
  const { id } = req.params;
  const token = req.headers["authorization"];
  if (!token) return res.status(403).json({ message: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });

    const userId = decoded.id; // Get the user ID from the token

    // Check if the item belongs to the logged-in user
    const checkItemOwnerSql = "SELECT * FROM items WHERE id = ? AND user_id = ?";
    db.query(checkItemOwnerSql, [id, userId], (err, results) => {
      if (err) return res.status(500).json({ message: "Database Error" });

      if (results.length === 0) {
        return res.status(403).json({ message: "You don't have permission to delete this item" });
      }

      const deleteItemSql = "DELETE FROM items WHERE id = ?";
      db.query(deleteItemSql, [id], (err) => {
        if (err) return res.status(500).json({ message: "Database Error" });

        res.json({ message: "Item deleted successfully" });
      });
    });
  });
});
app.listen(5000, () => {
  console.log("Server running on port 5000");
});


