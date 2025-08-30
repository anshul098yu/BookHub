const BorrowRecord = require("../models/borrowRecord.model");
const Book = require("../models/book.model");
const BookQueue = require("../models/bookQueue.model");
const User = require("../models/user.model");
const Notification = require("../models/notification.model");
const mailSender = require("../utils/mailSender");
const { commonEmailTemplate } = require("../templates/commonEmailTemplate");

// Create a reservation for a book
exports.createReservation = async (req, res) => {
    try {
        const userId = req.user._id;
        const { bookId } = req.body;

        // Validate book exists and is not deleted
        const book = await Book.findById(bookId);
        if (!book || book.isDeleted) {
            return res.status(404).json({
                success: false,
                message: "Book not found",
            });
        }

        // Check if user already has the book issued
        const existingIssued = await BorrowRecord.findOne({
            userId,
            bookId,
            status: "issued",
        });

        if (existingIssued) {
            return res.status(400).json({
                success: false,
                message: "You already have this book issued",
            });
        }

        // Check if user is already in the queue
        const existingQueue = await BookQueue.findOne({
            book: bookId,
            "queue.user": userId,
        });

        if (existingQueue) {
            return res.status(400).json({
                success: false,
                message: "You are already in the queue for this book",
            });
        }

        // Get or create queue
        let queue = await BookQueue.findOne({ book: bookId });
        if (!queue) {
            queue = new BookQueue({ book: bookId, queue: [] });
        }

        // Add user to queue
        const position = queue.queue.length + 1;
        queue.queue.push({
            user: userId,
            position: position,
        });

        await queue.save();

        // Create a reservation record
        const reservation = await BorrowRecord.create({
            userId,
            bookId,
            status: "reserved",
        });

        // Create notification
        await Notification.create({
            user: userId,
            type: "reservation_created",
            title: "Reservation Created",
            message: `You have been added to the queue for '${book.title}'. Your position is #${position}.`,
        });

        return res.status(201).json({
            success: true,
            message: "Reservation created successfully",
            data: {
                reservation,
                position,
            },
        });
    } catch (error) {
        console.error("Error in createReservation:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

// Get user's reservations and queue positions
exports.getUserReservations = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get user's reservations
        const reservations = await BorrowRecord.find({
            userId,
            status: "reserved",
        }).populate({
            path: "bookId",
            select: "title coverImage",
        });

        // Get user's queue positions
        const queues = await BookQueue.find({
            "queue.user": userId,
        }).populate({
            path: "book",
            select: "title coverImage",
        });

        // Format queue data
        const queueData = queues.map((queue) => {
            const userEntry = queue.queue.find((entry) =>
                entry.user.equals(userId)
            );
            return {
                book: queue.book,
                position: userEntry.position,
                queueLength: queue.queue.length,
                joinedAt: userEntry.joinedAt,
            };
        });

        return res.status(200).json({
            success: true,
            message: "Reservations fetched successfully",
            data: {
                reservations,
                queues: queueData,
            },
        });
    } catch (error) {
        console.error("Error in getUserReservations:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

// Cancel a reservation
exports.cancelReservation = async (req, res) => {
    try {
        const userId = req.user._id;
        const { reservationId } = req.params;

        // Validate reservation exists and belongs to user
        const reservation = await BorrowRecord.findOne({
            _id: reservationId,
            userId,
            status: "reserved",
        });

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: "Reservation not found",
            });
        }

        // Remove user from queue if they're in one
        const queue = await BookQueue.findOne({
            book: reservation.bookId,
            "queue.user": userId,
        });

        if (queue) {
            // Remove user from queue
            queue.queue = queue.queue.filter(
                (entry) => !entry.user.equals(userId)
            );

            // Update positions of remaining users
            queue.queue.forEach((entry, index) => {
                entry.position = index + 1;
            });

            await queue.save();
        }

        // Delete reservation
        await BorrowRecord.findByIdAndDelete(reservationId);

        // Create notification
        const book = await Book.findById(reservation.bookId);
        await Notification.create({
            user: userId,
            type: "reservation_cancelled",
            title: "Reservation Cancelled",
            message: `Your reservation for '${book.title}' has been cancelled.`,
        });

        return res.status(200).json({
            success: true,
            message: "Reservation cancelled successfully",
        });
    } catch (error) {
        console.error("Error in cancelReservation:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

// Automatic renewal system
exports.autoRenewBooks = async (req, res) => {
    try {
        const userId = req.user._id;
        const { requestId } = req.body;

        // Validate borrow record exists and belongs to user
        const record = await BorrowRecord.findOne({
            _id: requestId,
            userId,
            status: "issued",
        });

        if (!record) {
            return res.status(404).json({
                success: false,
                message: "Borrow record not found",
            });
        }

        // Check if book can be renewed (not overdue and renew count < 2)
        if (record.renewCount >= 2) {
            return res.status(400).json({
                success: false,
                message: "Maximum renewal limit reached",
            });
        }

        const now = new Date();
        if (record.dueDate < now) {
            return res.status(400).json({
                success: false,
                message: "Cannot renew overdue books",
            });
        }

        // Calculate new due date (extend by 7 days)
        const newDueDate = new Date(record.dueDate);
        newDueDate.setDate(newDueDate.getDate() + 7);

        // Update record
        record.renewCount += 1;
        record.dueDate = newDueDate;
        record.lastRenewedAt = now;

        await record.save();

        // Get book details for notification
        const book = await Book.findById(record.bookId);

        // Create notification
        await Notification.create({
            user: userId,
            type: "book_renewed",
            title: "Book Renewed",
            message: `Your book '${book.title}' has been renewed. New due date is ${newDueDate.toDateString()}.`,
        });

        return res.status(200).json({
            success: true,
            message: "Book renewed successfully",
            data: {
                newDueDate,
                renewCount: record.renewCount,
            },
        });
    } catch (error) {
        console.error("Error in autoRenewBooks:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

// Get reservation statistics
exports.getReservationStats = async (req, res) => {
    try {
        const userId = req.user._id;

        // Count active reservations
        const reservationCount = await BorrowRecord.countDocuments({
            userId,
            status: "reserved",
        });

        // Count queue positions
        const queueEntries = await BookQueue.aggregate([
            {
                $match: {
                    "queue.user": userId,
                },
            },
            {
                $project: {
                    queue: {
                        $filter: {
                            input: "$queue",
                            cond: { $eq: ["$$this.user", userId] },
                        },
                    },
                },
            },
            {
                $unwind: "$queue",
            },
            {
                $project: {
                    position: "$queue.position",
                },
            },
        ]);

        const queueCount = queueEntries.length;
        const averagePosition = queueCount > 0
            ? queueEntries.reduce((sum, entry) => sum + entry.position, 0) / queueCount
            : 0;

        return res.status(200).json({
            success: true,
            message: "Reservation statistics fetched successfully",
            data: {
                reservationCount,
                queueCount,
                averagePosition: Math.round(averagePosition),
            },
        });
    } catch (error) {
        console.error("Error in getReservationStats:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};