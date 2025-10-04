const Discussion = require("../models/discussion.model");
const Book = require("../models/book.model");
const User = require("../models/user.model");

// Create a new discussion post
exports.createDiscussion = async (req, res) => {
    try {
        const { bookId, title, content, parentId } = req.body;
        const userId = req.user._id;

        // Validate content
        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: "Content is required",
            });
        }

        // Validate book exists (only if bookId is provided and not null)
        let book = null;
        if (bookId && bookId !== 'null' && bookId !== 'undefined') {
            book = await Book.findById(bookId);
            if (!book) {
                return res.status(404).json({
                    success: false,
                    message: "Book not found",
                });
            }
        }

        // Validate parent discussion exists if parentId is provided
        if (parentId) {
            const parentDiscussion = await Discussion.findById(parentId);
            if (!parentDiscussion) {
                return res.status(404).json({
                    success: false,
                    message: "Parent discussion not found",
                });
            }
        }

        const discussionData = {
            userId,
            content: content.trim(),
            parentId: parentId || null,
        };

        // Add bookId only if it's valid
        if (book) {
            discussionData.bookId = bookId;
        }

        // Add title only if it exists
        if (title && title.trim()) {
            discussionData.title = title.trim();
        }

        const discussion = await Discussion.create(discussionData);

        // Populate user info for response
        await discussion.populate({
            path: "userId",
            select: "fullName profilePic",
        });

        // Populate book info if it exists
        if (discussion.bookId) {
            await discussion.populate({
                path: "bookId",
                select: "title coverImage",
            });
        }

        return res.status(201).json({
            success: true,
            message: "Discussion created successfully",
            data: discussion,
        });
    } catch (error) {
        console.error("Error in createDiscussion:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

// Get discussions for a book
exports.getDiscussionsByBook = async (req, res) => {
    try {
        const { bookId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Validate book exists
        const book = await Book.findById(bookId);
        if (!book) {
            return res.status(404).json({
                success: false,
                message: "Book not found",
            });
        }

        // Get discussions with pagination
        const [totalDiscussions, discussions] = await Promise.all([
            Discussion.countDocuments({
                bookId,
                isDeleted: false,
                parentId: null, // Only top-level discussions
            }),
            Discussion.find({
                bookId,
                isDeleted: false,
                parentId: null, // Only top-level discussions
            })
                .populate({
                    path: "userId",
                    select: "fullName profilePic",
                })
                .populate({
                    path: "parentId",
                    select: "content userId",
                    populate: {
                        path: "userId",
                        select: "fullName",
                    },
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
        ]);

        // For each discussion, get the count of replies and voting information
        const discussionsWithStats = await Promise.all(
            discussions.map(async (discussion) => {
                const replyCount = await Discussion.countDocuments({
                    parentId: discussion._id,
                    isDeleted: false,
                });

                const likesCount = discussion.likes.length;

                // Check if current user has liked this discussion
                const userId = req.user._id;
                const isLiked = discussion.likes.includes(userId);

                // Check if current user has voted on this discussion
                const userUpvoteIndex = discussion.upvotes.indexOf(userId);
                const userDownvoteIndex = discussion.downvotes.indexOf(userId);
                const userVote = userUpvoteIndex !== -1 ? 'up' : (userDownvoteIndex !== -1 ? 'down' : null);

                return {
                    ...discussion.toObject(),
                    replyCount,
                    likesCount,
                    isLiked,
                    upvotes: discussion.upvotes.length,
                    downvotes: discussion.downvotes.length,
                    userVote,
                };
            })
        );

        return res.status(200).json({
            success: true,
            message: "Discussions fetched successfully",
            pagination: {
                totalDiscussions,
                currentPage: page,
                totalPages: Math.ceil(totalDiscussions / limit),
                pageSize: limit,
            },
            data: discussionsWithStats,
        });
    } catch (error) {
        console.error("Error in getDiscussionsByBook:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

// Get a single discussion by ID
exports.getDiscussionById = async (req, res) => {
    try {
        const { discussionId } = req.params;
        const userId = req.user._id;

        // Find the discussion
        const discussion = await Discussion.findOne({
            _id: discussionId,
            isDeleted: false,
        })
            .populate({
                path: "userId",
                select: "fullName profilePic",
            })
            .populate({
                path: "bookId",
                select: "title coverImage",
            });

        if (!discussion) {
            return res.status(404).json({
                success: false,
                message: "Discussion not found",
            });
        }

        // Get reply count
        const replyCount = await Discussion.countDocuments({
            parentId: discussionId,
            isDeleted: false,
        });

        // Add additional stats
        const likesCount = discussion.likes.length;
        const isLiked = discussion.likes.includes(userId);

        // Check if user has voted
        const userUpvoteIndex = discussion.upvotes.indexOf(userId);
        const userDownvoteIndex = discussion.downvotes.indexOf(userId);
        const userVote = userUpvoteIndex !== -1 ? 'up' : (userDownvoteIndex !== -1 ? 'down' : null);

        const discussionWithStats = {
            ...discussion.toObject(),
            replyCount,
            likesCount,
            isLiked,
            upvotes: discussion.upvotes.length,
            downvotes: discussion.downvotes.length,
            userVote,
        };

        return res.status(200).json({
            success: true,
            message: "Discussion fetched successfully",
            data: discussionWithStats,
        });
    } catch (error) {
        console.error("Error in getDiscussionById:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

// Get all discussions
exports.getAllDiscussions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Get discussions with pagination
        const [totalDiscussions, discussions] = await Promise.all([
            Discussion.countDocuments({
                isDeleted: false,
                parentId: null, // Only top-level discussions
            }),
            Discussion.find({
                isDeleted: false,
                parentId: null, // Only top-level discussions
            })
                .populate({
                    path: "userId",
                    select: "fullName profilePic",
                })
                .populate({
                    path: "bookId",
                    select: "title coverImage",
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
        ]);

        // For each discussion, get the count of replies and likes
        const discussionsWithStats = await Promise.all(
            discussions.map(async (discussion) => {
                const replyCount = await Discussion.countDocuments({
                    parentId: discussion._id,
                    isDeleted: false,
                });

                const likesCount = discussion.likes.length;

                // Check if current user has liked this discussion
                const userId = req.user._id;
                const isLiked = discussion.likes.includes(userId);

                // Check if current user has voted on this discussion
                const userUpvoteIndex = discussion.upvotes.indexOf(userId);
                const userDownvoteIndex = discussion.downvotes.indexOf(userId);
                const userVote = userUpvoteIndex !== -1 ? 'up' : (userDownvoteIndex !== -1 ? 'down' : null);

                return {
                    ...discussion.toObject(),
                    replyCount,
                    likesCount,
                    isLiked,
                    upvotes: discussion.upvotes.length,
                    downvotes: discussion.downvotes.length,
                    userVote,
                };
            })
        );

        return res.status(200).json({
            success: true,
            message: "Discussions fetched successfully",
            pagination: {
                totalDiscussions,
                currentPage: page,
                totalPages: Math.ceil(totalDiscussions / limit),
                pageSize: limit,
            },
            data: discussionsWithStats,
        });
    } catch (error) {
        console.error("Error in getAllDiscussions:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

// Get replies for a discussion
exports.getReplies = async (req, res) => {
    try {
        const { discussionId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const userId = req.user._id;

        // Validate discussion exists
        const discussion = await Discussion.findById(discussionId);
        if (!discussion) {
            return res.status(404).json({
                success: false,
                message: "Discussion not found",
            });
        }

        // Get replies with pagination
        const [totalReplies, replies] = await Promise.all([
            Discussion.countDocuments({
                parentId: discussionId,
                isDeleted: false,
            }),
            Discussion.find({
                parentId: discussionId,
                isDeleted: false,
            })
                .populate({
                    path: "userId",
                    select: "fullName profilePic",
                })
                .sort({ createdAt: 1 }) // Oldest first for replies
                .skip(skip)
                .limit(limit),
        ]);

        // Add voting information to each reply
        const repliesWithVoting = await Promise.all(
            replies.map(async (reply) => {
                const likesCount = reply.likes.length;
                const isLiked = reply.likes.includes(userId);

                // Check if current user has voted on this reply
                const userUpvoteIndex = reply.upvotes.indexOf(userId);
                const userDownvoteIndex = reply.downvotes.indexOf(userId);
                const userVote = userUpvoteIndex !== -1 ? 'up' : (userDownvoteIndex !== -1 ? 'down' : null);

                return {
                    ...reply.toObject(),
                    likesCount,
                    isLiked,
                    upvotes: reply.upvotes.length,
                    downvotes: reply.downvotes.length,
                    userVote,
                };
            })
        );

        return res.status(200).json({
            success: true,
            message: "Replies fetched successfully",
            pagination: {
                totalReplies,
                currentPage: page,
                totalPages: Math.ceil(totalReplies / limit),
                pageSize: limit,
            },
            data: repliesWithVoting,
        });
    } catch (error) {
        console.error("Error in getReplies:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

// Vote on a discussion (upvote/downvote)
exports.voteDiscussion = async (req, res) => {
    try {
        const { discussionId, voteType } = req.body; // voteType: 'up' or 'down'
        const userId = req.user._id;

        // Validate discussion exists
        const discussion = await Discussion.findById(discussionId);
        if (!discussion) {
            return res.status(404).json({
                success: false,
                message: "Discussion not found",
            });
        }

        // Check if user already voted
        const userUpvoteIndex = discussion.upvotes.indexOf(userId);
        const userDownvoteIndex = discussion.downvotes.indexOf(userId);

        // Remove any existing votes
        if (userUpvoteIndex !== -1) {
            discussion.upvotes.splice(userUpvoteIndex, 1);
        }
        if (userDownvoteIndex !== -1) {
            discussion.downvotes.splice(userDownvoteIndex, 1);
        }

        // Add new vote based on voteType
        if (voteType === 'up') {
            discussion.upvotes.push(userId);
        } else if (voteType === 'down') {
            discussion.downvotes.push(userId);
        }

        await discussion.save();

        return res.status(200).json({
            success: true,
            message: voteType === 'up' ? "Upvoted successfully" : "Downvoted successfully",
            data: {
                upvotes: discussion.upvotes.length,
                downvotes: discussion.downvotes.length,
            },
        });
    } catch (error) {
        console.error("Error in voteDiscussion:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

// Like a discussion
exports.likeDiscussion = async (req, res) => {
    try {
        const { discussionId } = req.params;
        const userId = req.user._id;

        // Validate discussion exists
        const discussion = await Discussion.findById(discussionId);
        if (!discussion) {
            return res.status(404).json({
                success: false,
                message: "Discussion not found",
            });
        }

        // Check if user already liked
        const alreadyLiked = discussion.likes.includes(userId);

        if (alreadyLiked) {
            // Unlike
            discussion.likes = discussion.likes.filter(
                (id) => id.toString() !== userId.toString()
            );
        } else {
            // Like
            discussion.likes.push(userId);
        }

        await discussion.save();

        return res.status(200).json({
            success: true,
            message: alreadyLiked
                ? "Discussion unliked successfully"
                : "Discussion liked successfully",
            data: {
                likesCount: discussion.likes.length,
                isLiked: !alreadyLiked,
            },
        });
    } catch (error) {
        console.error("Error in likeDiscussion:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

// Delete a discussion (soft delete)
exports.deleteDiscussion = async (req, res) => {
    try {
        const { discussionId } = req.params;
        const userId = req.user._id;

        // Validate discussion exists
        const discussion = await Discussion.findById(discussionId);
        if (!discussion) {
            return res.status(404).json({
                success: false,
                message: "Discussion not found",
            });
        }

        // Check if user is owner or admin
        if (
            !discussion.userId.equals(userId) &&
            req.user.accountType !== "admin"
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this discussion",
            });
        }

        discussion.isDeleted = true;
        await discussion.save();

        return res.status(200).json({
            success: true,
            message: "Discussion deleted successfully",
        });
    } catch (error) {
        console.error("Error in deleteDiscussion:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};








