const axios = require('axios');
const Book = require('../models/book.model');

class DBookApiService {
    constructor() {
        this.baseUrl = 'https://www.dbooks.org/api';
        this.rateLimitDelay = 1000; // 1 second delay between requests
    }

    // Helper to add delay between API calls to respect rate limits
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Fetch books from different endpoints
    async fetchRecentBooks() {
        try {
            const response = await axios.get(`${this.baseUrl}/recent`);
            return response.data;
        } catch (error) {
            console.error('Error fetching recent books:', error.message);
            throw error;
        }
    }

    async searchBooks(query) {
        try {
            const response = await axios.get(`${this.baseUrl}/search/${encodeURIComponent(query)}`);
            return response.data;
        } catch (error) {
            console.error(`Error searching books for "${query}":`, error.message);
            throw error;
        }
    }

    // Convert dbooks API data to our Book model format
    convertToBookModel(dbookData) {
        // Extract authors (split by comma and clean up)
        const authors = dbookData.authors ?
            dbookData.authors.split(',').map(author => author.trim()).filter(author => author.length > 0) :
            ['Unknown Author'];

        // Generate genres based on title/subtitle keywords
        const genres = this.extractGenresFromContent(dbookData.title, dbookData.subtitle);

        // Generate keywords from title and subtitle
        const keywords = this.extractKeywords(dbookData.title, dbookData.subtitle);

        // Determine language (default to English)
        const language = 'English';

        // Default quantity for imported books
        const quantity = Math.floor(Math.random() * 5) + 1; // Random between 1-5

        return {
            title: dbookData.title || 'Untitled',
            description: dbookData.subtitle || 'No description available',
            quantity: quantity,
            availableQuantity: quantity,
            authors: authors,
            genres: genres,
            keywords: keywords,
            language: language,
            rating: Math.floor(Math.random() * 3) + 3, // Random rating between 3-5
            coverImage: {
                publicId: `dbooks_${dbookData.id}`,
                imageUrl: dbookData.image || 'https://via.placeholder.com/300x400?text=No+Image'
            },
            externalId: dbookData.id,
            externalSource: 'dbooks.org',
            externalUrl: dbookData.url
        };
    }

    // Extract genres based on content analysis
    extractGenresFromContent(title, subtitle) {
        const content = `${title} ${subtitle}`.toLowerCase();
        const genreKeywords = {
            'Computer Science': ['programming', 'computer', 'software', 'algorithm', 'coding', 'javascript', 'python', 'java', 'c++', 'web', 'api', 'database', 'security', 'ai', 'machine learning', 'data'],
            'Science & Mathematics': ['mathematics', 'math', 'physics', 'chemistry', 'biology', 'science', 'engineering', 'calculus', 'algebra', 'statistics'],
            'Business & Management': ['business', 'management', 'marketing', 'finance', 'entrepreneurship', 'leadership', 'strategy'],
            'History': ['history', 'historical', 'ancient', 'modern', 'civilization', 'war', 'culture'],
            'Philosophy': ['philosophy', 'philosophical', 'ethics', 'logic', 'metaphysics'],
            'Education': ['education', 'teaching', 'learning', 'school', 'university', 'student'],
            'Technology': ['technology', 'tech', 'digital', 'innovation', 'automation', 'robotics'],
            'Fiction': ['novel', 'story', 'fiction', 'adventure', 'mystery', 'romance'],
            'Non-Fiction': ['guide', 'handbook', 'manual', 'reference', 'tutorial', 'introduction']
        };

        const matchedGenres = [];
        for (const [genre, keywords] of Object.entries(genreKeywords)) {
            if (keywords.some(keyword => content.includes(keyword))) {
                matchedGenres.push(genre);
            }
        }

        // Default to Non-Fiction if no specific genre found
        return matchedGenres.length > 0 ? matchedGenres : ['Non-Fiction'];
    }

    // Extract keywords from title and subtitle
    extractKeywords(title, subtitle) {
        const text = `${title} ${subtitle}`.toLowerCase();
        const words = text.split(/\s+/);

        // Filter out common words and keep meaningful terms
        const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'];

        const keywords = words
            .filter(word => word.length > 2 && !stopWords.includes(word))
            .filter(word => /^[a-zA-Z]+$/.test(word)) // Only alphabetic words
            .slice(0, 10); // Limit to 10 keywords

        return keywords.length > 0 ? keywords : ['general', 'book', 'reading'];
    }

    // Check if book already exists in our database
    async bookExists(externalId) {
        const existingBook = await Book.findOne({
            externalId: externalId,
            externalSource: 'dbooks.org'
        });
        return !!existingBook;
    }

    // Import a single book to our database
    async importBook(dbookData) {
        try {
            // Check if book already exists
            if (await this.bookExists(dbookData.id)) {
                console.log(`Book "${dbookData.title}" already exists, skipping...`);
                return { success: true, skipped: true, reason: 'Already exists' };
            }

            const bookData = this.convertToBookModel(dbookData);
            const newBook = await Book.create(bookData);

            console.log(`Successfully imported: "${newBook.title}"`);
            return { success: true, book: newBook };
        } catch (error) {
            console.error(`Error importing book "${dbookData.title}":`, error.message);
            return { success: false, error: error.message };
        }
    }

    // Import multiple books with rate limiting
    async importBooksInBatch(dbooks, batchSize = 5) {
        const results = {
            total: dbooks.length,
            imported: 0,
            skipped: 0,
            failed: 0,
            errors: []
        };

        for (let i = 0; i < dbooks.length; i += batchSize) {
            const batch = dbooks.slice(i, i + batchSize);

            console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(dbooks.length / batchSize)}...`);

            for (const dbookData of batch) {
                const result = await this.importBook(dbookData);

                if (result.success) {
                    if (result.skipped) {
                        results.skipped++;
                    } else {
                        results.imported++;
                    }
                } else {
                    results.failed++;
                    results.errors.push({
                        title: dbookData.title,
                        error: result.error
                    });
                }

                // Add delay between imports
                await this.delay(this.rateLimitDelay);
            }
        }

        return results;
    }

    // Main method to populate database with books from various sources
    async populateDatabase(options = {}) {
        const {
            includeRecent = true,
            searchTerms = ['programming', 'javascript', 'python', 'science', 'mathematics', 'business'],
            maxBooksPerSearch = 50
        } = options;

        let allBooks = [];
        const results = {
            totalFetched: 0,
            totalImported: 0,
            totalSkipped: 0,
            totalFailed: 0,
            errors: []
        };

        try {
            // Fetch recent books
            if (includeRecent) {
                console.log('Fetching recent books...');
                const recentData = await this.fetchRecentBooks();
                if (recentData.status === 'ok' && recentData.books) {
                    allBooks.push(...recentData.books);
                    console.log(`Fetched ${recentData.books.length} recent books`);
                }
                await this.delay(this.rateLimitDelay);
            }

            // Search for books by different terms
            for (const searchTerm of searchTerms) {
                console.log(`Searching for "${searchTerm}" books...`);
                try {
                    const searchData = await this.searchBooks(searchTerm);
                    if (searchData.status === 'ok' && searchData.books) {
                        const booksToAdd = searchData.books.slice(0, maxBooksPerSearch);
                        allBooks.push(...booksToAdd);
                        console.log(`Fetched ${booksToAdd.length} books for "${searchTerm}"`);
                    }
                    await this.delay(this.rateLimitDelay);
                } catch (error) {
                    console.error(`Failed to search for "${searchTerm}":`, error.message);
                    results.errors.push({
                        searchTerm,
                        error: error.message
                    });
                }
            }

            // Remove duplicates based on ID
            const uniqueBooks = allBooks.filter((book, index, self) =>
                index === self.findIndex(b => b.id === book.id)
            );

            results.totalFetched = uniqueBooks.length;
            console.log(`Total unique books fetched: ${uniqueBooks.length}`);

            // Import books in batches
            if (uniqueBooks.length > 0) {
                const importResults = await this.importBooksInBatch(uniqueBooks);
                results.totalImported = importResults.imported;
                results.totalSkipped = importResults.skipped;
                results.totalFailed = importResults.failed;
                results.errors.push(...importResults.errors);
            }

            console.log('Database population completed!');
            console.log(`Imported: ${results.totalImported}, Skipped: ${results.totalSkipped}, Failed: ${results.totalFailed}`);

            return results;

        } catch (error) {
            console.error('Error in populateDatabase:', error.message);
            throw error;
        }
    }
}

module.exports = new DBookApiService();