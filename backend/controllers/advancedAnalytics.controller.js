const Book = require("../models/book.model");
const User = require("../models/user.model");
const BorrowRecord = require("../models/borrowRecord.model");
const { Parser } = require("json2csv");

// Get predictive analytics for book demand
exports.getBookDemandPredictions = async (req, res) => {
    try {
        // Get books with high borrow frequency in recent months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const demandData = await BorrowRecord.aggregate([
            {
                $match: {
                    issueDate: { $gte: sixMonthsAgo },
                    status: { $in: ["issued", "overdue", "returned"] },
                },
            },
            {
                $group: {
                    _id: "$bookId",
                    borrowCount: { $sum: 1 },
                    lastBorrowed: { $max: "$issueDate" },
                },
            },
            {
                $lookup: {
                    from: "books",
                    localField: "_id",
                    foreignField: "_id",
                    as: "book",
                },
            },
            {
                $unwind: "$book",
            },
            {
                $match: {
                    "book.isDeleted": false,
                },
            },
            {
                $project: {
                    bookId: "$book._id",
                    title: "$book.title",
                    borrowCount: 1,
                    lastBorrowed: 1,
                    demandScore: {
                        $add: [
                            "$borrowCount",
                            {
                                $multiply: [
                                    0.5,
                                    {
                                        $divide: [
                                            {
                                                $subtract: [new Date(), "$lastBorrowed"],
                                            },
                                            1000 * 60 * 60 * 24, // Convert to days
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                },
            },
            {
                $sort: { borrowCount: -1, lastBorrowed: -1 },
            },
            {
                $limit: 20,
            },
        ]);

        // Categorize demand levels
        const predictions = demandData.map((book) => {
            let demandLevel = "Low";
            if (book.borrowCount >= 10) {
                demandLevel = "High";
            } else if (book.borrowCount >= 5) {
                demandLevel = "Medium";
            }

            return {
                ...book,
                demandLevel,
            };
        });

        return res.status(200).json({
            success: true,
            message: "Book demand predictions fetched successfully",
            data: predictions,
        });
    } catch (error) {
        console.error("Error in getBookDemandPredictions:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

// Export analytics data as CSV
exports.exportAnalyticsAsCSV = async (req, res) => {
    try {
        const { type } = req.params; // books, users, borrowing
        const { startDate, endDate } = req.query;

        let data = [];
        let filename = "analytics-export";

        const start = startDate ? new Date(startDate) : new Date("2000-01-01");
        const end = endDate ? new Date(endDate) : new Date();

        switch (type) {
            case "books":
                filename = "books-report";
                data = await Book.find({
                    createdAt: { $gte: start, $lte: end },
                    isDeleted: false,
                }).select(
                    "title description quantity availableQuantity authors genres language rating createdAt"
                );
                break;

            case "users":
                filename = "users-report";
                data = await User.find({
                    createdAt: { $gte: start, $lte: end },
                }).select("fullName email gender isVerified createdAt");
                break;

            case "borrowing":
                filename = "borrowing-report";
                data = await BorrowRecord.find({
                    createdAt: { $gte: start, $lte: end },
                })
                    .populate("userId", "fullName email")
                    .populate("bookId", "title");
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: "Invalid export type",
                });
        }

        if (data.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No data found for the specified period",
            });
        }

        // Convert to CSV
        const json2csvParser = new Parser();
        const csv = json2csvParser.parse(data);

        // Set headers for CSV download
        res.header("Content-Type", "text/csv");
        res.attachment(`${filename}.csv`);
        return res.status(200).send(csv);
    } catch (error) {
        console.error("Error in exportAnalyticsAsCSV:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

// Get real-time analytics (placeholder for WebSocket implementation)
exports.getRealTimeAnalytics = async (req, res) => {
    try {
        // This would be replaced with actual real-time data in a WebSocket implementation
        const now = new Date();

        // Get active users (users with recent activity)
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const activeUsers = await User.countDocuments({
            lastActive: { $gte: oneHourAgo },
        });

        // Get recently borrowed books
        const recentBorrows = await BorrowRecord.countDocuments({
            issueDate: { $gte: oneHourAgo },
        });

        // Get pending requests
        const pendingRequests = await BorrowRecord.countDocuments({
            status: "pending",
        });

        return res.status(200).json({
            success: true,
            message: "Real-time analytics fetched successfully",
            data: {
                activeUsers,
                recentBorrows,
                pendingRequests,
                timestamp: now,
            },
        });
    } catch (error) {
        console.error("Error in getRealTimeAnalytics:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
