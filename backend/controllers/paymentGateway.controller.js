const Razorpay = require("razorpay");
const dotenv = require("dotenv");
const crypto = require("crypto");
const FineHistory = require("../models/fineHistory.model");
const User = require("../models/user.model");

dotenv.config();

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create a payment order for fine payment
exports.createFinePaymentOrder = async (req, res) => {
    try {
        const { fineId } = req.body;
        const userId = req.user._id;

        // Validate fine exists and belongs to user
        const fine = await FineHistory.findById(fineId);
        if (!fine) {
            return res.status(404).json({
                success: false,
                message: "Fine record not found",
            });
        }

        if (!fine.userId.equals(userId)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to pay this fine",
            });
        }

        if (fine.isPaid) {
            return res.status(400).json({
                success: false,
                message: "Fine is already paid",
            });
        }

        // Create Razorpay order
        const options = {
            amount: fine.amount * 100, // Amount in paise
            currency: "INR",
            receipt: `fine_receipt_${fineId}`,
            payment_capture: 1,
        };

        const order = await razorpay.orders.create(options);

        return res.status(200).json({
            success: true,
            message: "Payment order created successfully",
            data: {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                fineId: fine._id,
            },
        });
    } catch (error) {
        console.error("Error in createFinePaymentOrder:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to create payment order",
        });
    }
};

// Verify payment and update fine status
exports.verifyFinePayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, fineId } =
            req.body;
        const userId = req.user._id;

        // Validate fine exists and belongs to user
        const fine = await FineHistory.findById(fineId);
        if (!fine) {
            return res.status(404).json({
                success: false,
                message: "Fine record not found",
            });
        }

        if (!fine.userId.equals(userId)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to pay this fine",
            });
        }

        if (fine.isPaid) {
            return res.status(400).json({
                success: false,
                message: "Fine is already paid",
            });
        }

        // Verify payment signature
        const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generated_signature = hmac.digest("hex");

        if (generated_signature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed",
            });
        }

        // Update fine status
        fine.isPaid = true;
        fine.paymentId = razorpay_payment_id;
        fine.paidAt = new Date();
        await fine.save();

        // Update user's total fines
        const user = await User.findById(userId);
        user.totalFines -= fine.amount;
        if (user.totalFines < 0) user.totalFines = 0;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            data: {
                fineId: fine._id,
                paymentId: razorpay_payment_id,
                amount: fine.amount,
            },
        });
    } catch (error) {
        console.error("Error in verifyFinePayment:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to verify payment",
        });
    }
};

// Get user's payment history
exports.getPaymentHistory = async (req, res) => {
    try {
        const userId = req.user._id;

        const payments = await FineHistory.find({
            userId,
            isPaid: true,
        })
            .select("amount paidAt paymentId")
            .sort({ paidAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Payment history fetched successfully",
            data: payments,
        });
    } catch (error) {
        console.error("Error in getPaymentHistory:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch payment history",
        });
    }
};

// Get payment statistics
exports.getPaymentStats = async (req, res) => {
    try {
        const userId = req.user._id;

        // Total amount paid
        const totalPaid = await FineHistory.aggregate([
            {
                $match: {
                    userId: userId,
                    isPaid: true,
                },
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$amount" },
                    count: { $sum: 1 },
                },
            },
        ]);

        // Pending fines
        const pendingFines = await FineHistory.aggregate([
            {
                $match: {
                    userId: userId,
                    isPaid: false,
                },
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$amount" },
                    count: { $sum: 1 },
                },
            },
        ]);

        return res.status(200).json({
            success: true,
            message: "Payment statistics fetched successfully",
            data: {
                totalPaid: totalPaid.length > 0 ? totalPaid[0].totalAmount : 0,
                totalPaidCount: totalPaid.length > 0 ? totalPaid[0].count : 0,
                pendingAmount: pendingFines.length > 0 ? pendingFines[0].totalAmount : 0,
                pendingCount: pendingFines.length > 0 ? pendingFines[0].count : 0,
            },
        });
    } catch (error) {
        console.error("Error in getPaymentStats:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch payment statistics",
        });
    }
};