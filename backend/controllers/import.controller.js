const dbooksApiService = require('../services/dbooksApiService');
const Book = require('../models/book.model');

// Import books from dbooks.org API
exports.importBooksFromAPI = async (req, res) => {
    try {
        const {
            includeRecent = true,
            searchTerms = ['programming', 'javascript', 'python', 'science', 'mathematics', 'business', 'technology', 'computer'],
            maxBooksPerSearch = 30
        } = req.body;

        console.log('Starting book import from dbooks.org API...');

        const results = await dbooksApiService.populateDatabase({
            includeRecent,
            searchTerms,
            maxBooksPerSearch
        });

        return res.status(200).json({
            success: true,
            message: 'Book import completed successfully',
            data: results
        });

    } catch (error) {
        console.error('Error importing books from API:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to import books from API',
            error: error.message
        });
    }
};

// Get import statistics
exports.getImportStats = async (req, res) => {
    try {
        const totalBooks = await Book.countDocuments();
        const externalBooks = await Book.countDocuments({ externalSource: 'dbooks.org' });
        const manualBooks = await Book.countDocuments({ externalSource: 'manual' });

        const stats = {
            totalBooks,
            externalBooks,
            manualBooks,
            externalPercentage: totalBooks > 0 ? Math.round((externalBooks / totalBooks) * 100) : 0
        };

        return res.status(200).json({
            success: true,
            message: 'Import statistics retrieved successfully',
            data: stats
        });

    } catch (error) {
        console.error('Error getting import stats:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get import statistics',
            error: error.message
        });
    }
};

// Import specific books by search term
exports.importBooksBySearch = async (req, res) => {
    try {
        const { searchTerm, maxBooks = 20 } = req.body;

        if (!searchTerm || !searchTerm.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Search term is required'
            });
        }

        console.log(`Importing books for search term: "${searchTerm}"`);

        const results = await dbooksApiService.populateDatabase({
            includeRecent: false,
            searchTerms: [searchTerm.trim()],
            maxBooksPerSearch: maxBooks
        });

        return res.status(200).json({
            success: true,
            message: `Books imported for search term "${searchTerm}"`,
            data: results
        });

    } catch (error) {
        console.error('Error importing books by search:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to import books by search term',
            error: error.message
        });
    }
};

// Get external books with pagination
exports.getExternalBooks = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [totalBooks, books] = await Promise.all([
            Book.countDocuments({ externalSource: 'dbooks.org' }),
            Book.find({ externalSource: 'dbooks.org' })
                .select('title description authors genres externalUrl coverImage createdAt')
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
        ]);

        res.status(200).json({
            success: true,
            message: 'External books retrieved successfully',
            pagination: {
                totalBooks,
                currentPage: page,
                totalPages: Math.ceil(totalBooks / limit),
                pageSize: limit,
            },
            data: books,
        });

    } catch (error) {
        console.error('Error getting external books:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve external books',
            error: error.message
        });
    }
};

// Clear all external books (for testing purposes)
exports.clearExternalBooks = async (req, res) => {
    try {
        const result = await Book.deleteMany({ externalSource: 'dbooks.org' });

        return res.status(200).json({
            success: true,
            message: `Successfully removed ${result.deletedCount} external books`,
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error('Error clearing external books:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to clear external books',
            error: error.message
        });
    }
};