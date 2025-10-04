const express = require("express");
const router = express.Router();

const {
    getBadges,
    getUserBadges,
    initializeBadges,
} = require("../controllers/badge.controller");

const { isLoggedIn, isAdmin } = require("../middlewares/verifyToken");

// Get all badges
router.get("/", isLoggedIn, getBadges);

// Get user's badges
router.get("/user", isLoggedIn, getUserBadges);

// Initialize badges (admin only)
router.post("/initialize", isLoggedIn, isAdmin, initializeBadges);

module.exports = router;