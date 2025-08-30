const axios = require("axios");
const Book = require("../models/book.model");

// Search books using Google Books API
exports.searchGoogleBooks = async (req, res) => {
    try {
        const { query, maxResults = 20 } = req.query;

        if (!query || !query.trim()) {
            return res.status(400).json({
                success: false,
                message: "Search query is required",
            });
        }

        const response = await axios.get(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
                query
            )}&maxResults=${maxResults}&printType=books`
        );

        const books = response.data.items || [];

        // Transform Google Books API response to our format
        const transformedBooks = books.map((item) => {
            const volumeInfo = item.volumeInfo;
            return {
                id: item.id,
                title: volumeInfo.title || "Unknown Title",
                description: volumeInfo.description || "No description available",
                authors: volumeInfo.authors || ["Unknown Author"],
                genres: volumeInfo.categories || ["General"],
                language: volumeInfo.language || "en",
                publishedDate: volumeInfo.publishedDate || "Unknown",
                pageCount: volumeInfo.pageCount || 0,
                publisher: volumeInfo.publisher || "Unknown Publisher",
                coverImage: {
                    imageUrl: volumeInfo.imageLinks
                        ? volumeInfo.imageLinks.thumbnail ||
                        volumeInfo.imageLinks.smallThumbnail
                        : "https://via.placeholder.com/300x400?text=No+Image",
                },
                previewLink: volumeInfo.previewLink || null,
                infoLink: volumeInfo.infoLink || null,
            };
        });

        return res.status(200).json({
            success: true,
            message: "Books fetched successfully",
            data: transformedBooks,
            totalItems: response.data.totalItems || 0,
        });
    } catch (error) {
        console.error("Error in searchGoogleBooks:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to search books",
        });
    }
};

// Search books using Open Library API
exports.searchOpenLibrary = async (req, res) => {
    try {
        const { query, limit = 20 } = req.query;

        if (!query || !query.trim()) {
            return res.status(400).json({
                success: false,
                message: "Search query is required",
            });
        }

        const response = await axios.get(
            `https://openlibrary.org/search.json?q=${encodeURIComponent(
                query
            )}&limit=${limit}`
        );

        const books = response.data.docs || [];

        // Transform Open Library API response to our format
        const transformedBooks = books.map((item) => {
            return {
                id: item.key,
                title: item.title || "Unknown Title",
                description: item.description || "No description available",
                authors: item.author_name || ["Unknown Author"],
                genres: item.subject || ["General"],
                language: item.language ? item.language[0] : "en",
                firstPublishYear: item.first_publish_year || "Unknown",
                publisher: item.publisher ? item.publisher[0] : "Unknown Publisher",
                isbn: item.isbn ? item.isbn[0] : null,
                coverImage: {
                    imageUrl: item.cover_i
                        ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg`
                        : "https://via.placeholder.com/300x400?text=No+Image",
                },
                openLibraryLink: `https://openlibrary.org${item.key}`,
            };
        });

        return res.status(200).json({
            success: true,
            message: "Books fetched successfully",
            data: transformedBooks,
            totalItems: response.data.numFound || 0,
        });
    } catch (error) {
        console.error("Error in searchOpenLibrary:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to search books",
        });
    }
};

// Get book details by ISBN (for barcode scanning)
exports.getBookByISBN = async (req, res) => {
    try {
        const { isbn } = req.params;

        if (!isbn) {
            return res.status(400).json({
                success: false,
                message: "ISBN is required",
            });
        }

        // Try Google Books API first
        try {
            const googleResponse = await axios.get(
                `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
            );

            if (
                googleResponse.data.items &&
                googleResponse.data.items.length > 0
            ) {
                const item = googleResponse.data.items[0];
                const volumeInfo = item.volumeInfo;

                const book = {
                    id: item.id,
                    title: volumeInfo.title || "Unknown Title",
                    description: volumeInfo.description || "No description available",
                    authors: volumeInfo.authors || ["Unknown Author"],
                    genres: volumeInfo.categories || ["General"],
                    language: volumeInfo.language || "en",
                    publishedDate: volumeInfo.publishedDate || "Unknown",
                    pageCount: volumeInfo.pageCount || 0,
                    publisher: volumeInfo.publisher || "Unknown Publisher",
                    isbn: isbn,
                    coverImage: {
                        imageUrl: volumeInfo.imageLinks
                            ? volumeInfo.imageLinks.thumbnail ||
                            volumeInfo.imageLinks.smallThumbnail
                            : "https://via.placeholder.com/300x400?text=No+Image",
                    },
                    previewLink: volumeInfo.previewLink || null,
                    infoLink: volumeInfo.infoLink || null,
                };

                return res.status(200).json({
                    success: true,
                    message: "Book found",
                    data: book,
                });
            }
        } catch (googleError) {
            console.log("Google Books API failed, trying Open Library");
        }

        // Fallback to Open Library
        try {
            const openLibraryResponse = await axios.get(
                `https://openlibrary.org/isbn/${isbn}.json`
            );

            const bookData = openLibraryResponse.data;

            // Get cover image
            const coverResponse = await axios.get(
                `https://openlibrary.org/isbn/${isbn}-M.jpg`,
                { validateStatus: false }
            );

            const book = {
                id: bookData.key,
                title: bookData.title || "Unknown Title",
                description: bookData.description || "No description available",
                authors: bookData.authors
                    ? bookData.authors.map((a) => a.name || "Unknown Author")
                    : ["Unknown Author"],
                genres: bookData.subjects || ["General"],
                language: bookData.languages
                    ? bookData.languages.map((l) => l.key.replace("/languages/", ""))
                    : ["en"],
                firstPublishYear: bookData.first_publish_year || "Unknown",
                publisher: bookData.publishers || ["Unknown Publisher"],
                isbn: isbn,
                coverImage: {
                    imageUrl:
                        coverResponse.status === 200
                            ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`
                            : "https://via.placeholder.com/300x400?text=No+Image",
                },
                openLibraryLink: `https://openlibrary.org${bookData.key}`,
            };

            return res.status(200).json({
                success: true,
                message: "Book found",
                data: book,
            });
        } catch (openLibraryError) {
            return res.status(404).json({
                success: false,
                message: "Book not found with this ISBN",
            });
        }
    } catch (error) {
        console.error("Error in getBookByISBN:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch book details",
        });
    }
};

// Add external book to library
exports.addExternalBook = async (req, res) => {
    try {
        const {
            title,
            description,
            authors,
            genres,
            language,
            isbn,
            coverImage,
            externalId,
            externalSource,
        } = req.body;

        // Validate required fields
        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Title is required",
            });
        }

        if (!authors || authors.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one author is required",
            });
        }

        // Check if book already exists
        const existingBook = await Book.findOne({
            $or: [
                { externalId: externalId },
                { "externalSource.isbn": isbn },
                { title: title, authors: { $in: authors } },
            ],
        });

        if (existingBook) {
            return res.status(400).json({
                success: false,
                message: "Book already exists in the library",
            });
        }

        // Create new book
        const quantity = 1; // Default quantity for external books
        const newBook = await Book.create({
            title: title.trim(),
            description: description ? description.trim() : "No description available",
            quantity: quantity,
            availableQuantity: quantity,
            authors: authors,
            genres: genres || ["General"],
            keywords: title.toLowerCase().split(" "),
            language: language || "English",
            rating: 5, // Default rating
            coverImage: coverImage || {
                imageUrl: "https://via.placeholder.com/300x400?text=No+Image",
            },
            externalId: externalId || null,
            externalSource: externalSource || "external",
            externalUrl: null,
        });

        return res.status(201).json({
            success: true,
            message: "Book added successfully",
            data: newBook,
        });
    } catch (error) {
        console.error("Error in addExternalBook:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to add book",
        });
    }
};