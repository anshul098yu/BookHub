const express = require("express");
const router = express.Router();

const {
    createDiscussion,
    getAllDiscussions,
    getDiscussionsByBook,
    getDiscussionById,
    getReplies,
    voteDiscussion,
    likeDiscussion,
    deleteDiscussion,
} = require("../controllers/discussion.controller");

const { isLoggedIn } = require("../middlewares/verifyToken");

// Create a new discussion
router.post("/create", isLoggedIn, createDiscussion);

// Get all discussions
router.get("/all", isLoggedIn, getAllDiscussions);

// Get a single discussion by ID
router.get("/:discussionId", isLoggedIn, getDiscussionById);

// Get discussions for a book
router.get("/book/:bookId", isLoggedIn, getDiscussionsByBook);

// Get replies for a discussion
router.get("/replies/:discussionId", isLoggedIn, getReplies);

// Vote on a discussion
router.post("/vote", isLoggedIn, voteDiscussion);

// Like/unlike a discussion
router.patch("/like/:discussionId", isLoggedIn, likeDiscussion);

// Delete a discussion
router.delete("/:discussionId", isLoggedIn, deleteDiscussion);

module.exports = router;