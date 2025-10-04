const express = require("express");
const router = express.Router();
const { isLoggedIn, isAdmin } = require("../middlewares/verifyToken");
const borrowController = require("../controllers/borrow.controller");

// Borrow Management
router.get("/send/borrowRequest/:bookId", isLoggedIn, borrowController.sendBorrowRequest);
router.post("/handle-request", isLoggedIn, isAdmin, borrowController.handleBorrowRequest);

// Return Management
router.get("/return/:requestId", isLoggedIn, borrowController.sendReturnRequest);
router.post("/handle-return", isLoggedIn, isAdmin, borrowController.handleReturnRequest);

// Renew Management
router.get("/renew/:requestId", isLoggedIn, borrowController.renewBook);

// Admin Issue Book by Email
router.post("/issue-by-email", isLoggedIn, isAdmin, borrowController.issueBookUsingEmail);

// Get user's issued books
router.get("/issued-books", isLoggedIn, borrowController.getIssuedBooks);

// Get user's returned books
router.get("/returned-books", isLoggedIn, borrowController.getReturnedBooks);

// Get borrow history
router.get("/history", isLoggedIn, borrowController.getBorrowHistory);

// Get request stats (for admin) - Updated to match frontend expectation
router.get("/requestStats", isLoggedIn, isAdmin, borrowController.getRequestStats);

// Get request data (for admin) - Updated to match frontend expectation
router.get("/requestData", isLoggedIn, isAdmin, borrowController.fetchRequestData);

// Export router
module.exports = router;