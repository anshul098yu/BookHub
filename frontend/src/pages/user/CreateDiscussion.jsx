import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    ArrowLeft,
    Book,
    Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios from "axios";
import { toast } from "sonner";
import Loader from "@/components/common/Loader";

const CreateDiscussion = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const bookIdFromQuery = queryParams.get('bookId');

    const [loading, setLoading] = useState(false);
    const [loadingBooks, setLoadingBooks] = useState(false);
    const [books, setBooks] = useState([]);
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        bookId: bookIdFromQuery || "",
    });

    // Fetch books for selection
    const fetchBooks = async () => {
        if (!bookIdFromQuery) {
            setLoadingBooks(true);
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/book/books`,
                    {
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                        },
                    }
                );
                if (response?.data?.success) {
                    setBooks(response.data.data || []);
                }
            } catch (error) {
                console.error("Error fetching books:", error);
            } finally {
                setLoadingBooks(false);
            }
        }
    };

    // Create discussion
    const handleCreateDiscussion = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            toast.error("Title is required");
            return;
        }

        if (!formData.content.trim()) {
            toast.error("Content is required");
            return;
        }

        setLoading(true);
        try {
            const requestData = {
                title: formData.title,
                content: formData.content,
            };

            // Only include bookId if it's selected
            if (formData.bookId && formData.bookId !== "none") {
                requestData.bookId = formData.bookId;
            }

            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/discussion/create`,
                requestData,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                }
            );

            if (response?.data?.success) {
                toast.success("Discussion created successfully");

                // Navigate to the new discussion thread if available
                if (response.data.data?._id) {
                    navigate(`/discussions/${response.data.data._id}`);
                } else {
                    navigate("/discussions");
                }
            }
        } catch (error) {
            console.error("Error creating discussion:", error);
            toast.error(error?.response?.data?.message || "Failed to create discussion");
        } finally {
            setLoading(false);
        }
    };

    // Handle form changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Handle book selection
    const handleBookChange = (value) => {
        setFormData((prev) => ({
            ...prev,
            bookId: value === "none" ? "" : value,
        }));
    };

    useEffect(() => {
        fetchBooks();

        // If bookId is provided in query, fetch the book details
        if (bookIdFromQuery) {
            const fetchBook = async () => {
                try {
                    const response = await axios.get(
                        `${import.meta.env.VITE_BACKEND_URL}/book/${bookIdFromQuery}`,
                        {
                            withCredentials: true,
                            headers: {
                                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                            },
                        }
                    );
                    if (response?.data?.success) {
                        setFormData(prev => ({
                            ...prev,
                            bookId: bookIdFromQuery,
                        }));
                    }
                } catch (error) {
                    console.error("Error fetching book:", error);
                    toast.error("Invalid book selected");
                    setFormData(prev => ({
                        ...prev,
                        bookId: "",
                    }));
                }
            };

            fetchBook();
        }
    }, [bookIdFromQuery]);

    return (
        <div className="w-full px-4 py-6 bg-gray-50 dark:bg-transparent">
            <div className="max-w-3xl mx-auto">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    className="mb-4 flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft size={18} />
                    Back
                </Button>

                <Card className="dark:bg-zinc-900">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-white">
                            Create Discussion
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateDiscussion}>
                            <div className="space-y-4">
                                {/* Title */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
                                        Title
                                    </label>
                                    <Input
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        placeholder="Discussion title"
                                        className="w-full"
                                        required
                                    />
                                </div>

                                {/* Book Selection (only if not pre-selected) */}
                                {!bookIdFromQuery && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
                                            Related Book (Optional)
                                        </label>
                                        <Select
                                            value={formData.bookId || "none"}
                                            onValueChange={handleBookChange}
                                            disabled={loadingBooks}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select a book (optional)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">
                                                    General Discussion (No Book)
                                                </SelectItem>
                                                {books.map((book) => (
                                                    <SelectItem key={book._id} value={book._id}>
                                                        {book.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {loadingBooks && <p className="text-sm text-zinc-500">Loading books...</p>}
                                    </div>
                                )}

                                {/* Content */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
                                        Content
                                    </label>
                                    <textarea
                                        name="content"
                                        value={formData.content}
                                        onChange={handleChange}
                                        placeholder="What would you like to discuss?"
                                        className="w-full min-h-[200px] p-3 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                                        required
                                    />
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => navigate(-1)}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex items-center gap-1"
                                        disabled={loading}
                                    >
                                        {loading ? "Creating..." : (
                                            <>
                                                <Send size={16} />
                                                Create Discussion
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default CreateDiscussion;