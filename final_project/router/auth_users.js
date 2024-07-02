const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const JWT_SECRET = 'your_jwt_secret_key';

const isValid = (username) => {
  return users.some(user => user.username === username);
};

const authenticatedUser = (username, password) => {
  return users.find(user => user.username === username && bcrypt.compareSync(password, user.password));
};

// Register a new user
regd_users.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (isValid(username)) {
    return res.status(409).json({ message: "User already exists" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password: hashedPassword });

    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Only registered users can login
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  const user = authenticatedUser(username, password);

  if (user) {
    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    return res.status(200).json({ message: "Logged in successfully", token });
  } else {
    return res.status(401).json({ message: "Invalid username or password" });
  }
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const { isbn } = req.params;
  const { review } = req.body;
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }

    const username = user.username;

    if (!books[isbn]) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (!books[isbn].reviews) {
      books[isbn].reviews = {};
    }

    // Add or modify the review
    books[isbn].reviews[username] = review;
    return res.status(200).json({ message: "Review added/modified successfully", reviews: books[isbn].reviews });
  });
});

regd_users.delete("/auth/review/:isbn", (req, res) => {
  const { isbn } = req.params;
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }

    const username = user.username;

    if (!books[isbn]) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (books[isbn].reviews && books[isbn].reviews[username]) {
      delete books[isbn].reviews[username];
      return res.status(200).json({ message: "Review deleted successfully", reviews: books[isbn].reviews });
    } else {
      return res.status(404).json({ message: "Review not found for the user" });
    }
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
