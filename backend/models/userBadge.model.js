const mongoose = require("mongoose");

const userBadgeSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        badgeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Badge",
            required: true,
        },
        earnedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// Index for better query performance
userBadgeSchema.index({ userId: 1 });
userBadgeSchema.index({ badgeId: 1 });
userBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

module.exports = mongoose.model("UserBadge", userBadgeSchema);