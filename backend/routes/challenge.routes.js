const express = require("express");
const router = express.Router();

const {
    createChallenge,
    getUserChallenges,
    completeBookInChallenge,
    cancelChallenge,
} = require("../controllers/challenge.controller");

const { isLoggedIn } = require("../middlewares/verifyToken");

// Create a new reading challenge
router.post("/create", isLoggedIn, createChallenge);

// Get user's challenges
router.get("/user", isLoggedIn, getUserChallenges);

// Mark book as completed in challenge
router.post("/complete", isLoggedIn, completeBookInChallenge);

// Cancel a challenge
router.delete("/:challengeId", isLoggedIn, cancelChallenge);

module.exports = router;