const express = require("express");
const router = express.Router();

const {
    createFinePaymentOrder,
    verifyFinePayment,
    getPaymentHistory,
    getPaymentStats,
} = require("../controllers/paymentGateway.controller");

const { isLoggedIn } = require("../middlewares/verifyToken");

// Create payment order for fine
router.post("/create-order", isLoggedIn, createFinePaymentOrder);

// Verify payment
router.post("/verify-payment", isLoggedIn, verifyFinePayment);

// Get payment history
router.get("/history", isLoggedIn, getPaymentHistory);

// Get payment statistics
router.get("/stats", isLoggedIn, getPaymentStats);

module.exports = router;