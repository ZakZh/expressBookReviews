const express = require('express');
const bcrypt = require('bcrypt');
const usersDB = require("./auth_users.js");
const books = require("./booksdb.js");
const public_users = express.Router();

// Middleware to parse JSON bodies
public_users.use(express.json());

// Function to check if username exists
const isValid = (username) => {
  return usersDB.users.some(user => user.username === username);
};

// Register Route
public_users.post("/register", async (req, res) => {
  const { username, password } = req.body;

  

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required!" });
  }

  if (isValid(username)) {
    return res.status(409).json({ message: "User already exists!" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    usersDB.users.push({ username, password: hashedPassword });
    
    return res.status(201).json({ message: "You are registered!" });
  } catch (error) {

    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get the book list available in the shop
public_users.get('/', (req, res) => {
  res.status(200).json(books);
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  if (book) {
    res.status(200).json(book);
  } else {
    res.status(404).json({ message: "Book not found" });
  }
});

// Get book details based on author
public_users.get('/author/:author', (req, res) => {
  const author = req.params.author.toLowerCase().replace(' ', '-');
  const booksByAuthor = Object.values(books).filter(book => 
    book.author.toLowerCase().replace(' ', '-') === author
  );
  res.status(200).json(booksByAuthor);
});

// Get all books based on title
public_users.get('/title/:title', (req, res) => {
  const title = req.params.title.toLowerCase().replace(' ', '-');
  const booksByTitle = Object.values(books).filter(book => 
    book.title.toLowerCase().replace(' ', '-') === title
  );
  res.status(200).json(booksByTitle);
});

// Get book review
public_users.get('/review/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  if (book && book.reviews) {
    res.status(200).json(book.reviews);
  } else {
    res.status(404).json({ message: "Reviews not found for this book" });
  }
});

module.exports.general = public_users;