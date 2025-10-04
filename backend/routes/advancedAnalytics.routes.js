const express = require("express");
const router = express.Router();

const {
    getBookDemandPredictions,
    exportAnalyticsAsCSV,
    getRealTimeAnalytics,
} = require("../controllers/advancedAnalytics.controller");

const { isLoggedIn, isAdmin } = require("../middlewares/verifyToken");

// Get book demand predictions
router.get("/demand-predictions", isLoggedIn, isAdmin, getBookDemandPredictions);

// Export analytics data as CSV
router.get("/export/:type", isLoggedIn, isAdmin, exportAnalyticsAsCSV);

// Get real-time analytics
router.get("/realtime", isLoggedIn, isAdmin, getRealTimeAnalytics);

module.exports = router;