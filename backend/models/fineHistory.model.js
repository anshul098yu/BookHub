const mongoose = require("mongoose");

const fineHistorySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        reason: {
            type: String,
            default: "Not specified",
        },
        type: {
            type: String,
            enum: ["charged", "paid"],
            required: true,
        },
        paymentId: {
            type: String,
            default: null,
        },
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("FineHistory", fineHistorySchema);