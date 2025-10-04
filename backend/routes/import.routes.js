const express = require("express");
const router = express.Router();

const {
    importBooksFromAPI,
    getImportStats,
    importBooksBySearch,
    getExternalBooks,
    clearExternalBooks
} = require("../controllers/import.controller");

const { isLoggedIn, isAdmin } = require("../middlewares/verifyToken");

// Import routes - Admin only
router.post("/importBooks", isLoggedIn, isAdmin, importBooksFromAPI);

router.post("/importBySearch", isLoggedIn, isAdmin, importBooksBySearch);

router.get("/stats", isLoggedIn, isAdmin, getImportStats);

router.get("/external", isLoggedIn, isAdmin, getExternalBooks);

router.delete("/clearExternal", isLoggedIn, isAdmin, clearExternalBooks);

module.exports = router;