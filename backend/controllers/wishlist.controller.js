const User = require('../models/user.model');
const Book = require('../models/book.model');

// Add a book to wishlist
exports.addToWishlist = async (req, res) => {
    try {
        const { bookId } = req.body;
        const userId = req.user._id;

        if (!bookId) {
            return res.status(400).json({
                success: false,
                message: "Book ID is required"
            });
        }

        // Check if book exists
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({
                success: false,
                message: "Book not found"
            });
        }

        // Check if book is already in wishlist
        const user = await User.findById(userId);
        if (user.wishlist.includes(bookId)) {
            return res.status(400).json({
                success: false,
                message: "Book already in wishlist"
            });
        }

        // Add book to wishlist
        user.wishlist.push(bookId);
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Book added to wishlist",
            wishlistCount: user.wishlist.length
        });
    } catch (error) {
        console.error("Error in addToWishlist:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// Remove a book from wishlist
exports.removeFromWishlist = async (req, res) => {
    try {
        const { bookId } = req.params;
        const userId = req.user._id;

        if (!bookId) {
            return res.status(400).json({
                success: false,
                message: "Book ID is required"
            });
        }

        // Remove book from wishlist
        const user = await User.findByIdAndUpdate(
            userId,
            { $pull: { wishlist: bookId } },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: "Book removed from wishlist",
            wishlistCount: user.wishlist.length
        });
    } catch (error) {
        console.error("Error in removeFromWishlist:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// Get user's wishlist
exports.getWishlist = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId).populate({
            path: 'wishlist',
            select: 'title authors coverImage availableQuantity rating'
        });

        return res.status(200).json({
            success: true,
            data: user.wishlist,
            wishlistCount: user.wishlist.length
        });
    } catch (error) {
        console.error("Error in getWishlist:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// Check if a book is in wishlist
exports.isInWishlist = async (req, res) => {
    try {
        const { bookId } = req.params;
        const userId = req.user._id;

        if (!bookId) {
            return res.status(400).json({
                success: false,
                message: "Book ID is required"
            });
        }

        const user = await User.findById(userId);
        const isInWishlist = user.wishlist.includes(bookId);

        return res.status(200).json({
            success: true,
            isInWishlist
        });
    } catch (error) {
        console.error("Error in isInWishlist:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};