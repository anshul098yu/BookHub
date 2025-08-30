const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middlewares/verifyToken');
const {
    addToWishlist,
    removeFromWishlist,
    getWishlist,
    isInWishlist
} = require('../controllers/wishlist.controller');

// Add book to wishlist
router.post('/add', isLoggedIn, addToWishlist);

// Remove book from wishlist
router.delete('/remove/:bookId', isLoggedIn, removeFromWishlist);

// Get user's wishlist
router.get('/', isLoggedIn, getWishlist);

// Check if book is in wishlist
router.get('/check/:bookId', isLoggedIn, isInWishlist);

module.exports = router;