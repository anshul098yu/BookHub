const User = require("../models/user.model");
const FineHistory = require("../models/fineHistory.model");

// Add or update fine amount for a user
exports.addUserFine = async (req, res) => {
    try {
        const { userId, amount, reason } = req.body;

        if (!userId || !amount) {
            return res.status(400).json({
                success: false,
                message: "User ID and amount are required",
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Fine amount must be greater than 0",
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Add to existing fine amount
        const currentFine = user.fineAmount || 0;
        user.fineAmount = currentFine + parseFloat(amount);

        // Create fine history record
        await FineHistory.create({
            userId: user._id,
            amount: parseFloat(amount),
            reason: reason || "Not specified",
            type: "charged",
            adminId: req.user._id,
        });

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Fine added successfully",
            data: {
                userId: user._id,
                fullName: user.fullName,
                email: user.email,
                currentFineAmount: user.fineAmount,
            },
        });
    } catch (error) {
        console.error("Error adding fine:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Clear user fine
exports.clearUserFine = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Clear fine amount
        const previousFineAmount = user.fineAmount;
        user.fineAmount = 0;

        // Record the clearing in history if there was a fine
        if (previousFineAmount > 0) {
            await FineHistory.create({
                userId: user._id,
                amount: previousFineAmount,
                reason: "Admin cleared fine",
                type: "paid",
                adminId: req.user._id,
            });
        }
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Fine cleared successfully",
            data: {
                userId: user._id,
                fullName: user.fullName,
                email: user.email,
                currentFineAmount: user.fineAmount,
            },
        });
    } catch (error) {
        console.error("Error clearing fine:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Get all users with fines
exports.getUsersWithFines = async (req, res) => {
    try {
        const users = await User.find({ fineAmount: { $gt: 0 } })
            .select("fullName email fineAmount profilePic")
            .sort({ fineAmount: -1 });

        return res.status(200).json({
            success: true,
            message: "Users with fines retrieved successfully",
            data: users,
        });
    } catch (error) {
        console.error("Error fetching users with fines:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Get fine history for a user
exports.getUserFineHistory = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        const user = await User.findById(userId).select("fullName email fineAmount");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const fineHistory = await FineHistory.find({ userId })
            .sort({ createdAt: -1 })
            .populate("adminId", "fullName email");

        return res.status(200).json({
            success: true,
            message: "Fine history retrieved successfully",
            data: {
                user,
                fineHistory,
            },
        });
    } catch (error) {
        console.error("Error fetching fine history:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

// Get total fines collected statistics
exports.getFinesStats = async (req, res) => {
    try {
        // Get total amount of fines paid (type: "paid")
        const totalFinesPaid = await FineHistory.aggregate([
            { $match: { type: "paid" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        // Get total amount of fines currently outstanding (from users with fineAmount > 0)
        const totalOutstandingFines = await User.aggregate([
            { $match: { fineAmount: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: "$fineAmount" } } }
        ]);

        // Get total fines charged (type: "charged")
        const totalFinesCharged = await FineHistory.aggregate([
            { $match: { type: "charged" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        return res.status(200).json({
            success: true,
            message: "Fines statistics retrieved successfully",
            data: {
                totalFinesCollected: totalFinesPaid[0]?.total || 0,
                totalOutstandingFines: totalOutstandingFines[0]?.total || 0,
                totalFinesCharged: totalFinesCharged[0]?.total || 0
            }
        });
    } catch (error) {
        console.error("Error fetching fines statistics:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};