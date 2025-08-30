const Book = require("../models/book.model");
const User = require("../models/user.model");
const BorrowRecord = require("../models/borrowRecord.model");
const { getTimeAgo } = require("../utils/time");
const Discussion = require("../models/discussion.model");
const ReadingChallenge = require("../models/readingChallenge.model");

// Summary Analytics
exports.getSummaryAnalytics = async (req, res) => {
  try {
    // Total Books
    const totalBooks = await Book.countDocuments({ isDeleted: false });
    // Books added last month
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999
    );
    const booksLastMonth = await Book.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      isDeleted: false,
    });
    const booksThisMonth = await Book.countDocuments({
      createdAt: { $gte: startOfThisMonth },
      isDeleted: false,
    });
    const booksPercentIncrease =
      booksLastMonth === 0
        ? booksThisMonth > 0 ? 100 : 0 // If no books last month but books this month, show 100% increase
        : Math.round(((booksThisMonth - booksLastMonth) / booksLastMonth) * 100);

    // Total Users
    const totalUsers = await User.countDocuments();
    const usersLastMonth = await User.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });
    const usersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfThisMonth },
    });
    const usersPercentIncrease =
      usersLastMonth === 0
        ? usersThisMonth > 0 ? 100 : 0 // If no users last month but users this month, show 100% increase
        : Math.round(((usersThisMonth - usersLastMonth) / usersLastMonth) * 100);

    // Currently Issued Books
    const currentlyIssuedBooks = await BorrowRecord.countDocuments({
      status: { $in: ["issued", "overdue"] },
    });

    return res.status(200).json({
      success: true,
      data: {
        totalBooks,
        booksPercentIncrease,
        totalUsers,
        usersPercentIncrease,
        currentlyIssuedBooks,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Issued Books per Month (last 6 months)
exports.getIssuedBooksPerMonth = async (req, res) => {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const data = await BorrowRecord.aggregate([
      {
        $match: {
          issueDate: { $gte: sixMonthsAgo },
          status: { $in: ["issued", "overdue", "returned"] },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$issueDate" },
            month: { $month: "$issueDate" },
          },
          books: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);
    // Format for frontend
    const result = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const found = data.find(
        (d) => d._id.year === year && d._id.month === month
      );
      result.push({
        year,
        month,
        books: found ? found.books : 0,
      });
    }
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Users Registered per Month (last 6 months)
exports.getUsersPerMonth = async (req, res) => {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const data = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          users: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);
    // Format for frontend
    const result = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const found = data.find(
        (d) => d._id.year === year && d._id.month === month
      );
      result.push({
        year,
        month,
        users: found ? found.users : 0,
      });
    }
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Top 5 Most Borrowed Books Overall
exports.getTopBorrowedBooks = async (req, res) => {
  try {
    const data = await BorrowRecord.aggregate([
      {
        $group: {
          _id: "$bookId",
          borrowCount: { $sum: 1 },
        },
      },
      { $sort: { borrowCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "books",
          localField: "_id",
          foreignField: "_id",
          as: "book",
        },
      },
      { $unwind: "$book" },
      {
        $project: {
          _id: 0,
          bookId: "$book._id",
          title: "$book.title",
          authors: "$book.authors",
          genres: "$book.genres",
          borrowCount: 1,
        },
      },
    ]);
    return res.status(200).json({
      success: true,
      data: data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Recent User Activity (last 7 days)
exports.getRecentUserActivity = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activities = await BorrowRecord.find({
      $or: [
        { issueDate: { $gte: sevenDaysAgo } },
        { returnDate: { $gte: sevenDaysAgo } },
      ],
    })
      .populate("userId", "fullName email profilePic")
      .populate("bookId", "title authors")
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();

    const getTimeAgo = (date) => {
      const now = new Date();
      const diff = now - new Date(date);

      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (seconds < 60) return `${seconds} sec ago`;
      if (minutes < 60) return `${minutes} min ago`;
      if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
      return `${days} day${days > 1 ? "s" : ""} ago`;
    };

    const result = activities.map((a) => ({
      user: a.userId,
      book: a.bookId,
      status: a.status,
      issueDate: a.issueDate,
      dueDate: a.dueDate,
      returnDate: a.returnDate,
      timeAgo: getTimeAgo(a.updatedAt),
    }));

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Community Engagement Analytics
exports.getCommunityAnalytics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get total discussions
    const totalDiscussions = await Discussion.countDocuments({
      isDeleted: false,
    });

    // Get active discussions (last 30 days)
    const activeDiscussions = await Discussion.countDocuments({
      isDeleted: false,
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Get total replies
    const totalReplies = await Discussion.countDocuments({
      isDeleted: false,
      parentId: { $ne: null },
    });

    // Get most active users
    const activeUsers = await Discussion.aggregate([
      {
        $match: {
          isDeleted: false,
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: "$userId",
          discussionCount: { $sum: 1 },
        },
      },
      {
        $sort: { discussionCount: -1 },
      },
      {
        $limit: 5,
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          _id: 0,
          userId: "$user._id",
          fullName: "$user.fullName",
          profilePic: "$user.profilePic",
          discussionCount: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalDiscussions,
        activeDiscussions,
        totalReplies,
        activeUsers,
      },
    });
  } catch (err) {
    console.error("Error in getCommunityAnalytics:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Reading Challenge Analytics
exports.getChallengeAnalytics = async (req, res) => {
  try {
    // Total challenges created
    const totalChallenges = await ReadingChallenge.countDocuments();

    // Active challenges
    const activeChallenges = await ReadingChallenge.countDocuments({
      isActive: true,
    });

    // Completed challenges
    const completedChallenges = await ReadingChallenge.countDocuments({
      isCompleted: true,
    });

    // Average books per completed challenge
    const completedChallengeStats = await ReadingChallenge.aggregate([
      {
        $match: {
          isCompleted: true,
        },
      },
      {
        $group: {
          _id: null,
          avgBooks: { $avg: { $size: "$booksCompleted" } },
          totalBooks: { $sum: { $size: "$booksCompleted" } },
        },
      },
    ]);

    const avgBooksPerChallenge =
      completedChallengeStats.length > 0
        ? completedChallengeStats[0].avgBooks
        : 0;

    const totalBooksRead =
      completedChallengeStats.length > 0
        ? completedChallengeStats[0].totalBooks
        : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalChallenges,
        activeChallenges,
        completedChallenges,
        avgBooksPerChallenge: Math.round(avgBooksPerChallenge),
        totalBooksRead,
      },
    });
  } catch (err) {
    console.error("Error in getChallengeAnalytics:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
