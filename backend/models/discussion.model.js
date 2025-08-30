const mongoose = require("mongoose");

const discussionSchema = new mongoose.Schema(
    {
        bookId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book",
            default: null,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            trim: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
        },
        parentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Discussion",
            default: null,
        },
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        upvotes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        downvotes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Index for better query performance
discussionSchema.index({ bookId: 1, createdAt: -1 });
discussionSchema.index({ userId: 1 });

module.exports = mongoose.model("Discussion", discussionSchema);
