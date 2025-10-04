import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import Loader from '../../../components/common/Loader';
import { toast } from 'sonner';

const BookImport = () => {
    const [isImporting, setIsImporting] = useState(false);
    const [importStats, setImportStats] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchImporting, setSearchImporting] = useState(false);
    const [lastImportResult, setLastImportResult] = useState(null);

    // Fetch import statistics
    const fetchImportStats = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/import/stats`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            if (data.success) {
                setImportStats(data.data);
            }
        } catch (error) {
            console.error('Error fetching import stats:', error);
        }
    };

    useEffect(() => {
        fetchImportStats();
    }, []);

    // Import books from API
    const handleImportBooks = async () => {
        setIsImporting(true);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/import/importBooks`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    includeRecent: true,
                    searchTerms: ['programming', 'javascript', 'python', 'science', 'mathematics', 'business', 'technology', 'computer', 'engineering'],
                    maxBooksPerSearch: 30
                }),
            });

            const data = await response.json();
            if (data.success) {
                setLastImportResult(data.data);
                toast.success(`Successfully imported ${data.data.totalImported} books!`);
                fetchImportStats(); // Refresh stats
            } else {
                toast.error(data.message || 'Failed to import books');
            }
        } catch (error) {
            console.error('Error importing books:', error);
            toast.error('An error occurred while importing books');
        } finally {
            setIsImporting(false);
        }
    };

    // Import books by search term
    const handleSearchImport = async () => {
        if (!searchTerm.trim()) {
            toast.error('Please enter a search term');
            return;
        }

        setSearchImporting(true);
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/import/importBySearch`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    searchTerm: searchTerm.trim(),
                    maxBooks: 20
                }),
            });

            const data = await response.json();
            if (data.success) {
                toast.success(`Successfully imported ${data.data.totalImported} books for "${searchTerm}"!`);
                fetchImportStats(); // Refresh stats
                setSearchTerm(''); // Clear input
            } else {
                toast.error(data.message || 'Failed to import books');
            }
        } catch (error) {
            console.error('Error importing books by search:', error);
            toast.error('An error occurred while importing books');
        } finally {
            setSearchImporting(false);
        }
    };

    // Clear external books
    const handleClearExternalBooks = async () => {
        if (!confirm('Are you sure you want to clear all imported books? This action cannot be undone.')) {
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/import/clearExternal`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            if (data.success) {
                toast.success(`Successfully removed ${data.deletedCount} imported books`);
                fetchImportStats(); // Refresh stats
                setLastImportResult(null);
            } else {
                toast.error(data.message || 'Failed to clear imported books');
            }
        } catch (error) {
            console.error('Error clearing imported books:', error);
            toast.error('An error occurred while clearing imported books');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Book Import Manager</h1>
            </div>

            {/* Import Statistics */}
            {importStats && (
                <Card>
                    <CardHeader>
                        <CardTitle>Import Statistics</CardTitle>
                        <CardDescription>Overview of books in your library</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{importStats.totalBooks}</div>
                                <div className="text-sm text-gray-600">Total Books</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{importStats.externalBooks}</div>
                                <div className="text-sm text-gray-600">Imported Books</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">{importStats.manualBooks}</div>
                                <div className="text-sm text-gray-600">Manual Books</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">{importStats.externalPercentage}%</div>
                                <div className="text-sm text-gray-600">Imported %</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Bulk Import */}
            <Card>
                <CardHeader>
                    <CardTitle>Bulk Import from DBooks.org</CardTitle>
                    <CardDescription>
                        Import a large collection of books from various categories including programming, science, mathematics, and more.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        onClick={handleImportBooks}
                        disabled={isImporting}
                        className="w-full md:w-auto"
                    >
                        {isImporting ? (
                            <>
                                <Loader className="mr-2 h-4 w-4" />
                                Importing Books...
                            </>
                        ) : (
                            'Import Books Collection'
                        )}
                    </Button>

                    {lastImportResult && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold text-sm mb-2">Last Import Results:</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                <div>Fetched: <span className="font-semibold">{lastImportResult.totalFetched}</span></div>
                                <div>Imported: <span className="font-semibold text-green-600">{lastImportResult.totalImported}</span></div>
                                <div>Skipped: <span className="font-semibold text-yellow-600">{lastImportResult.totalSkipped}</span></div>
                                <div>Failed: <span className="font-semibold text-red-600">{lastImportResult.totalFailed}</span></div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Search Import */}
            <Card>
                <CardHeader>
                    <CardTitle>Import by Search Term</CardTitle>
                    <CardDescription>
                        Import books by searching for specific topics or keywords.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Enter search term (e.g., artificial intelligence, web development)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearchImport()}
                        />
                        <Button
                            onClick={handleSearchImport}
                            disabled={searchImporting || !searchTerm.trim()}
                        >
                            {searchImporting ? (
                                <>
                                    <Loader className="mr-2 h-4 w-4" />
                                    Importing...
                                </>
                            ) : (
                                'Import'
                            )}
                        </Button>
                    </div>
                    <p className="text-sm text-gray-600">
                        Popular search terms: react, nodejs, machine learning, data science, cybersecurity, blockchain
                    </p>
                </CardContent>
            </Card>

            {/* Management Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Management Actions</CardTitle>
                    <CardDescription>
                        Manage your imported book collection.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        variant="destructive"
                        onClick={handleClearExternalBooks}
                        disabled={!importStats || importStats.externalBooks === 0}
                    >
                        Clear All Imported Books
                    </Button>
                    <p className="text-sm text-gray-600">
                        This will remove all books imported from external sources but keep manually added books.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default BookImport;