const mongoose = require("mongoose");

const badgeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        icon: {
            type: String, // URL to badge icon
            default: "",
        },
        criteria: {
            type: String, // Description of how to earn this badge
            required: true,
        },
        category: {
            type: String,
            enum: ["reading", "community", "achievement", "special"],
            required: true,
        },
    },
    { timestamps: true }
);

// Predefined badges
badgeSchema.statics.getPredefinedBadges = function () {
    return [
        {
            name: "First Book",
            description: "Read your first book",
            criteria: "Complete reading one book",
            category: "achievement",
        },
        {
            name: "Bookworm",
            description: "Read 10 books",
            criteria: "Complete reading 10 books",
            category: "achievement",
        },
        {
            name: "Reviewer",
            description: "Write your first review",
            criteria: "Write one book review",
            category: "community",
        },
        {
            name: "Discussions Starter",
            description: "Start your first discussion",
            criteria: "Create one discussion thread",
            category: "community",
        },
        {
            name: "Challenge Master",
            description: "Complete your first reading challenge",
            criteria: "Complete one reading challenge",
            category: "achievement",
        },
    ];
};

module.exports = mongoose.model("Badge", badgeSchema);