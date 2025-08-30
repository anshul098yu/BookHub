const express = require("express");
const router = express.Router();

const {
    searchGoogleBooks,
    searchOpenLibrary,
    getBookByISBN,
    addExternalBook,
} = require("../controllers/integration.controller");

const { isLoggedIn, isAdmin } = require("../middlewares/verifyToken");

// Search books using Google Books API
router.get("/google-books", isLoggedIn, searchGoogleBooks);

// Search books using Open Library API
router.get("/open-library", isLoggedIn, searchOpenLibrary);

// Get book details by ISBN
router.get("/isbn/:isbn", isLoggedIn, getBookByISBN);

// Add external book to library (admin only)
router.post("/add-book", isLoggedIn, isAdmin, addExternalBook);

module.exports = router;