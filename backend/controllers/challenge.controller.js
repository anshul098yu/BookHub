const ReadingChallenge = require("../models/readingChallenge.model");
const UserBadge = require("../models/userBadge.model");
const Badge = require("../models/badge.model");
const Book = require("../models/book.model");

// Create a new reading challenge
exports.createChallenge = async (req, res) => {
    try {
        const { name, targetBooks, startDate, endDate } = req.body;
        const userId = req.user._id;

        // Validate input
        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Challenge name is required",
            });
        }

        if (!targetBooks || targetBooks < 1) {
            return res.status(400).json({
                success: false,
                message: "Target books must be at least 1",
            });
        }

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "Start date and end date are required",
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start >= end) {
            return res.status(400).json({
                success: false,
                message: "End date must be after start date",
            });
        }

        // Check if user already has an active challenge
        const existingActiveChallenge = await ReadingChallenge.findOne({
            userId,
            isActive: true,
        });

        if (existingActiveChallenge) {
            return res.status(400).json({
                success: false,
                message: "You already have an active challenge",
            });
        }

        const challenge = await ReadingChallenge.create({
            userId,
            name: name.trim(),
            targetBooks,
            startDate: start,
            endDate: end,
        });

        return res.status(201).json({
            success: true,
            message: "Reading challenge created successfully",
            data: challenge,
        });
    } catch (error) {
        console.error("Error in createChallenge:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

// Get user's challenges
exports.getUserChallenges = async (req, res) => {
    try {
        const userId = req.user._id;
        const { status } = req.query; // active, completed, all

        let query = { userId };

        if (status === "active") {
            query.isActive = true;
        } else if (status === "completed") {
            query.isCompleted = true;
        }

        const challenges = await ReadingChallenge.find(query).sort({
            createdAt: -1,
        });

        return res.status(200).json({
            success: true,
            message: "Challenges fetched successfully",
            data: challenges,
        });
    } catch (error) {
        console.error("Error in getUserChallenges:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

// Mark book as completed in challenge
exports.completeBookInChallenge = async (req, res) => {
    try {
        const { challengeId, bookId } = req.body;
        const userId = req.user._id;

        // Validate book exists
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({
                success: false,
                message: "Book not found",
            });
        }

        // Validate challenge exists and belongs to user
        const challenge = await ReadingChallenge.findOne({
            _id: challengeId,
            userId,
            isActive: true,
        });

        if (!challenge) {
            return res.status(404).json({
                success: false,
                message: "Active challenge not found",
            });
        }

        // Check if book is already completed in this challenge
        const alreadyCompleted = challenge.booksCompleted.some((entry) =>
            entry.bookId.equals(bookId)
        );

        if (alreadyCompleted) {
            return res.status(400).json({
                success: false,
                message: "Book already marked as completed in this challenge",
            });
        }

        // Add book to completed list
        challenge.booksCompleted.push({
            bookId,
            completedAt: new Date(),
        });

        // Check if challenge is completed
        if (challenge.booksCompleted.length >= challenge.targetBooks) {
            challenge.isActive = false;
            challenge.isCompleted = true;

            // Award badge for completing challenge
            await awardBadge(userId, "Challenge Master");
        }

        await challenge.save();

        // Check for other badges
        await checkAndAwardReadingBadges(userId);

        return res.status(200).json({
            success: true,
            message: "Book marked as completed",
            data: {
                challenge,
                isChallengeCompleted: challenge.isCompleted,
            },
        });
    } catch (error) {
        console.error("Error in completeBookInChallenge:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

// Cancel a challenge
exports.cancelChallenge = async (req, res) => {
    try {
        const { challengeId } = req.params;
        const userId = req.user._id;

        // Validate challenge exists and belongs to user
        const challenge = await ReadingChallenge.findOne({
            _id: challengeId,
            userId,
            isActive: true,
        });

        if (!challenge) {
            return res.status(404).json({
                success: false,
                message: "Active challenge not found",
            });
        }

        challenge.isActive = false;
        await challenge.save();

        return res.status(200).json({
            success: true,
            message: "Challenge cancelled successfully",
        });
    } catch (error) {
        console.error("Error in cancelChallenge:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

// Helper function to award badges
async function awardBadge(userId, badgeName) {
    try {
        const badge = await Badge.findOne({ name: badgeName });
        if (!badge) return;

        // Check if user already has this badge
        const existingBadge = await UserBadge.findOne({
            userId,
            badgeId: badge._id,
        });

        if (!existingBadge) {
            await UserBadge.create({
                userId,
                badgeId: badge._id,
            });
        }
    } catch (error) {
        console.error("Error awarding badge:", error);
    }
}

// Helper function to check and award reading badges
async function checkAndAwardReadingBadges(userId) {
    try {
        // Count total completed books across all challenges
        const challenges = await ReadingChallenge.find({
            userId,
            isCompleted: true
        });

        const totalBooksRead = challenges.reduce(
            (total, challenge) => total + challenge.booksCompleted.length,
            0
        );

        // Award badges based on reading milestones
        if (totalBooksRead >= 10) {
            await awardBadge(userId, "Bookworm");
        } else if (totalBooksRead >= 1) {
            await awardBadge(userId, "First Book");
        }
    } catch (error) {
        console.error("Error checking reading badges:", error);
    }
}