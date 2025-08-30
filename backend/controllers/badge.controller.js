const Badge = require("../models/badge.model");
const UserBadge = require("../models/userBadge.model");

// Get all predefined badges
exports.getBadges = async (req, res) => {
    try {
        // Get predefined badges
        const predefinedBadges = Badge.getPredefinedBadges();

        // Get custom badges from database
        const customBadges = await Badge.find({});

        const allBadges = [...predefinedBadges, ...customBadges];

        return res.status(200).json({
            success: true,
            message: "Badges fetched successfully",
            data: allBadges,
        });
    } catch (error) {
        console.error("Error in getBadges:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

// Get user's badges
exports.getUserBadges = async (req, res) => {
    try {
        const userId = req.user._id;

        const userBadges = await UserBadge.find({ userId })
            .populate({
                path: "badgeId",
                select: "name description icon criteria category",
            })
            .sort({ earnedAt: -1 });

        return res.status(200).json({
            success: true,
            message: "User badges fetched successfully",
            data: userBadges,
        });
    } catch (error) {
        console.error("Error in getUserBadges:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

// Initialize predefined badges (to be called once during setup)
exports.initializeBadges = async (req, res) => {
    try {
        const predefinedBadges = Badge.getPredefinedBadges();

        // Check if badges already exist
        const existingBadges = await Badge.countDocuments();

        if (existingBadges === 0) {
            // Create predefined badges
            for (const badgeData of predefinedBadges) {
                await Badge.create(badgeData);
            }

            return res.status(200).json({
                success: true,
                message: "Badges initialized successfully",
            });
        } else {
            return res.status(200).json({
                success: true,
                message: "Badges already initialized",
            });
        }
    } catch (error) {
        console.error("Error in initializeBadges:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};