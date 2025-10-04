const mongoose = require("mongoose");

const readingChallengeSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        targetBooks: {
            type: Number,
            required: true,
            min: 1,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        booksCompleted: [
            {
                bookId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Book",
                },
                completedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        isActive: {
            type: Boolean,
            default: true,
        },
        isCompleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Index for better query performance
readingChallengeSchema.index({ userId: 1, isActive: 1 });
readingChallengeSchema.index({ userId: 1, isCompleted: 1 });

module.exports = mongoose.model("ReadingChallenge", readingChallengeSchema);