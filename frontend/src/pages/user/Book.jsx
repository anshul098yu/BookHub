import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import Loader from "@/components/common/Loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  BookOpen,
  Star,
  Languages,
  Calendar,
  User,
  Hash,
  BookCheck,
  Heart,
  Loader2
} from "lucide-react";
import { starGenerator } from "@/constants/Helper";
import BookDiscussion from "@/components/user/BookDiscussion";

const Book = () => {
  const { bookId } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [borrowingBook, setBorrowingBook] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [hasBorrowed, setHasBorrowed] = useState(false);

  // Fetch book details
  useEffect(() => {
    const fetchBookDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/book/${bookId}`,
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );

        if (response?.data?.success) {
          setBook(response.data.data);
        } else {
          setError("Failed to fetch book details");
        }
      } catch (err) {
        console.error("Error fetching book details:", err);
        setError("Failed to fetch book details");
        toast.error(err?.response?.data?.message || "Failed to fetch book details");
      } finally {
        setLoading(false);
      }
    };

    if (bookId) {
      fetchBookDetails();
    }
  }, [bookId]);

  // Check if book is in wishlist
  useEffect(() => {
    const checkWishlistStatus = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/wishlist/check/${bookId}`,
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );

        if (response?.data?.success) {
          setInWishlist(response.data.isInWishlist);
        }
      } catch (error) {
        console.error("Error checking wishlist status:", error);
      }
    };

    if (bookId) {
      checkWishlistStatus();
    }
  }, [bookId]);

  // Handle borrow book request
  const handleBorrowBook = async () => {
    if (!book || book.availableQuantity <= 0) {
      toast.error("This book is not available for borrowing");
      return;
    }

    try {
      setBorrowingBook(true);
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/borrow/send/borrowRequest/${bookId}`,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (response?.data?.success) {
        toast.success(response.data.message || "Borrow request sent successfully");
        setHasBorrowed(true);
      } else {
        toast.error(response.data.message || "Failed to send borrow request");
      }
    } catch (error) {
      console.error("Error borrowing book:", error);
      toast.error(
        error?.response?.data?.message ||
        "Failed to send borrow request. You may have already borrowed or requested this book."
      );
    } finally {
      setBorrowingBook(false);
    }
  };

  // Handle add to wishlist
  const handleAddToWishlist = async () => {
    try {
      setAddingToWishlist(true);

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/wishlist/add`,
        { bookId },
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (response?.data?.success) {
        toast.success("Book added to wishlist");
        setInWishlist(true);
      } else {
        toast.error("Failed to add book to wishlist");
      }
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      toast.error(error?.response?.data?.message || "Failed to add book to wishlist");
    } finally {
      setAddingToWishlist(false);
    }
  };

  // Handle remove from wishlist
  const handleRemoveFromWishlist = async () => {
    try {
      setAddingToWishlist(true);

      const response = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/wishlist/remove/${bookId}`,
        {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (response?.data?.success) {
        toast.success("Book removed from wishlist");
        setInWishlist(false);
      } else {
        toast.error("Failed to remove book from wishlist");
      }
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast.error(error?.response?.data?.message || "Failed to remove book from wishlist");
    } finally {
      setAddingToWishlist(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader width={9} height={40} />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-red-500 text-xl font-semibold">Error loading book details</div>
        <Button
          onClick={() => window.history.back()}
          className="mt-4"
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 bg-gray-50 dark:bg-transparent">
      <div className="max-w-6xl mx-auto">
        {/* Book Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          {/* Book Cover */}
          <div className="md:w-1/3 flex justify-center">
            <Card className="w-full max-w-sm dark:bg-zinc-900">
              <CardContent className="p-6">
                <img
                  src={book?.coverImage?.imageUrl}
                  alt={book?.title}
                  className="w-full h-80 object-cover rounded-lg shadow-lg"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/300x400?text=No+Image";
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Book Details */}
          <div className="md:w-2/3">
            <Card className="dark:bg-zinc-900">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-zinc-900 dark:text-white">
                  {book?.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Authors */}
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-zinc-500" />
                  <span className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
                    by {book?.authors?.join(", ")}
                  </span>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {starGenerator(book?.rating, "0", 20)}
                  </div>
                  <span className="text-lg font-bold text-zinc-900 dark:text-white">
                    {book?.rating?.toFixed(1)}
                  </span>
                  <span className="text-zinc-500">/ 5</span>
                </div>

                {/* Genres */}
                <div className="flex flex-wrap gap-2">
                  {book?.genres?.map((genre, index) => (
                    <Badge key={index} variant="secondary">
                      {genre}
                    </Badge>
                  ))}
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">
                    Description
                  </h3>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {book?.description || "No description available."}
                  </p>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center gap-2">
                    <Languages className="w-5 h-5 text-zinc-500" />
                    <span className="text-zinc-700 dark:text-zinc-300">
                      <span className="font-medium">Language:</span> {book?.language}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-zinc-500" />
                    <span className="text-zinc-700 dark:text-zinc-300">
                      <span className="font-medium">Published:</span> {new Date(book?.createdAt).getFullYear()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Hash className="w-5 h-5 text-zinc-500" />
                    <span className="text-zinc-700 dark:text-zinc-300">
                      <span className="font-medium">ISBN:</span> Not available
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <BookCheck className="w-5 h-5 text-zinc-500" />
                    <span className="text-zinc-700 dark:text-zinc-300">
                      <span className="font-medium">Availability:</span>{" "}
                      <span className={book?.availableQuantity > 0 ? "text-green-600" : "text-red-600"}>
                        {book?.availableQuantity > 0 ? `${book?.availableQuantity} copies available` : "Not available"}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4">
                  <Button
                    className="flex-1 min-w-[120px]"
                    onClick={handleBorrowBook}
                    disabled={borrowingBook || hasBorrowed || book.availableQuantity <= 0}
                  >
                    {borrowingBook ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Borrowing...
                      </>
                    ) : hasBorrowed ? (
                      "Request Sent"
                    ) : (
                      "Borrow Book"
                    )}
                  </Button>
                  <Button
                    variant={inWishlist ? "secondary" : "outline"}
                    className="flex-1 min-w-[120px] flex items-center justify-center gap-2"
                    onClick={inWishlist ? handleRemoveFromWishlist : handleAddToWishlist}
                    disabled={addingToWishlist}
                  >
                    {addingToWishlist ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {inWishlist ? "Removing..." : "Adding..."}
                      </>
                    ) : (
                      <>
                        <Heart className={`h-4 w-4 ${inWishlist ? "fill-current text-red-500" : ""}`} />
                        {inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Book Discussion Section */}
        <BookDiscussion bookId={bookId} />
      </div>
    </div>
  );
};

export default Book;