const express = require("express");
const router = express.Router();
const { isLoggedIn, isAdmin } = require("../middlewares/verifyToken");
const {
    addUserFine,
    clearUserFine,
    getUsersWithFines,
    getUserFineHistory,
    getFinesStats
} = require("../controllers/fine.controller");

// Admin routes for managing fines
router.post("/add-fine", isLoggedIn, isAdmin, addUserFine);
router.post("/clear-fine", isLoggedIn, isAdmin, clearUserFine);
router.get("/users-with-fines", isLoggedIn, isAdmin, getUsersWithFines);
router.get("/history/:userId", isLoggedIn, isAdmin, getUserFineHistory);
router.get("/stats", isLoggedIn, isAdmin, getFinesStats);

// User routes (for viewing their own fine history)
router.get("/my-history", isLoggedIn, async (req, res) => {
    req.params.userId = req.user._id;
    return getUserFineHistory(req, res);
});

module.exports = router;