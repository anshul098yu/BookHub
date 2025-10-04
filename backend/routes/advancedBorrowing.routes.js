const express = require("express");
const router = express.Router();

const {
    createReservation,
    getUserReservations,
    cancelReservation,
    autoRenewBooks,
    getReservationStats,
} = require("../controllers/advancedBorrowing.controller");

const { isLoggedIn } = require("../middlewares/verifyToken");

// Create a reservation
router.post("/reserve", isLoggedIn, createReservation);

// Get user's reservations
router.get("/reservations", isLoggedIn, getUserReservations);

// Cancel a reservation
router.delete("/reserve/:reservationId", isLoggedIn, cancelReservation);

// Auto-renew a book
router.post("/renew", isLoggedIn, autoRenewBooks);

// Get reservation statistics
router.get("/reservation-stats", isLoggedIn, getReservationStats);

module.exports = router;