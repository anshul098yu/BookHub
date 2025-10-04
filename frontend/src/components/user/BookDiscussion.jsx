import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    MessageSquare,
    ChevronUp,
    ChevronDown,
    Heart,
    MessageCircle,
    MoreHorizontal,
    ArrowUpRight,
    ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { toast } from "sonner";
import Loader from "@/components/common/Loader";
import { formatDateTime } from "@/constants/Helper";

const BookDiscussion = ({ bookId }) => {
    const [discussions, setDiscussions] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Fetch discussions for this book
    const fetchDiscussions = async () => {
        setLoading(true);
        try {
            // Only fetch discussions if bookId is valid
            if (!bookId || bookId === 'null' || bookId === 'undefined') {
                console.log("No valid bookId provided for discussions");
                setLoading(false);
                return;
            }

            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/discussion/book/${bookId}`,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                }
            );
            if (response?.data?.success) {
                console.log("Fetched book discussions:", response.data.data);
                setDiscussions(response.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching book discussions:", error);
            toast.error(error?.response?.data?.message || "Failed to fetch discussions");
        } finally {
            setLoading(false);
        }
    };

    // Handle voting (like/dislike)
    const handleVote = async (discussionId, voteType, e) => {
        e.stopPropagation(); // Prevent navigation
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/discussion/vote`,
                { discussionId, voteType },
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                }
            );
            if (response?.data?.success) {
                // Update UI with new vote counts
                setDiscussions(prev => prev.map(discussion =>
                    discussion._id === discussionId
                        ? {
                            ...discussion,
                            upvotes: response.data.data.upvotes,
                            downvotes: response.data.data.downvotes,
                            userVote: voteType
                        }
                        : discussion
                ));
                toast.success(response.data.message);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to vote");
        }
    };

    // Handle like
    const handleLike = async (discussionId, e) => {
        e.stopPropagation(); // Prevent navigation
        try {
            const response = await axios.patch(
                `${import.meta.env.VITE_BACKEND_URL}/discussion/like/${discussionId}`,
                {},
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                }
            );
            if (response?.data?.success) {
                // Update UI with new like count
                setDiscussions(prev => prev.map(discussion =>
                    discussion._id === discussionId
                        ? {
                            ...discussion,
                            likesCount: response.data.data.likesCount,
                            isLiked: response.data.data.isLiked
                        }
                        : discussion
                ));
                toast.success(response.data.message);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to like comment");
        }
    };

    // Navigate to a discussion thread
    const navigateToThread = (discussionId) => {
        navigate(`/discussions/${discussionId}`);
    };

    // Create new discussion button handler
    const handleCreateDiscussion = () => {
        navigate(`/discussions/create?bookId=${bookId}`);
    };

    useEffect(() => {
        if (bookId && bookId !== 'null' && bookId !== 'undefined') {
            fetchDiscussions();
        }
    }, [bookId]);

    return (
        <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                    Discussions
                </h2>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-500">
                        {discussions.length} thread{discussions.length !== 1 ? 's' : ''}
                    </span>
                    <Button
                        size="sm"
                        onClick={handleCreateDiscussion}
                    >
                        Start Discussion
                    </Button>
                </div>
            </div>

            {/* Discussions List */}
            {loading ? (
                <div className="flex justify-center my-6">
                    <Loader width={9} height={40} />
                </div>
            ) : discussions.length === 0 ? (
                <Card className="dark:bg-zinc-900">
                    <CardContent className="p-8 text-center">
                        <MessageSquare className="mx-auto h-10 w-10 text-zinc-400 mb-3" />
                        <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-1">
                            No discussions yet
                        </h3>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-4">
                            Be the first to start a conversation about this book!
                        </p>
                        <Button onClick={handleCreateDiscussion}>
                            Start Discussion
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {discussions.map((discussion) => (
                        <Card
                            key={discussion._id}
                            className="dark:bg-zinc-900 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => navigateToThread(discussion._id)}
                        >
                            <CardContent className="p-4">
                                <div className="flex gap-3">
                                    {/* Voting */}
                                    <div className="flex flex-col items-center gap-1">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className={`p-1 ${discussion.userVote === 'up' ? 'text-green-500' : 'text-zinc-400'}`}
                                            onClick={(e) => handleVote(discussion._id, 'up', e)}
                                        >
                                            <ChevronUp size={18} />
                                        </Button>
                                        <span className="text-xs font-medium">
                                            {(discussion.upvotes || 0) - (discussion.downvotes || 0)}
                                        </span>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className={`p-1 ${discussion.userVote === 'down' ? 'text-red-500' : 'text-zinc-400'}`}
                                            onClick={(e) => handleVote(discussion._id, 'down', e)}
                                        >
                                            <ChevronDown size={18} />
                                        </Button>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-md font-semibold text-zinc-900 dark:text-white">
                                                    {discussion.title || 'No title'}
                                                </h3>
                                                <p className="text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">
                                                    {discussion.content || 'No content'}
                                                </p>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="p-1"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <MoreHorizontal size={16} />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenuItem>
                                                        Report
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        {/* Meta */}
                                        <div className="flex items-center gap-2 mt-3">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-5 w-5">
                                                    <AvatarImage src={discussion.userId?.profilePic?.imageUrl} />
                                                    <AvatarFallback>
                                                        {discussion.userId?.fullName?.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                                                    {discussion.userId?.fullName}
                                                </span>
                                            </div>
                                            <span className="text-xs text-zinc-500">
                                                {discussion.createdAt ? formatDateTime(discussion.createdAt).date : 'No date'}
                                            </span>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                                            <button
                                                className={`flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-300 ${discussion.isLiked ? 'text-red-500' : ''}`}
                                                onClick={(e) => handleLike(discussion._id, e)}
                                            >
                                                <ThumbsUp size={14} />
                                                {discussion.likesCount || 0}
                                            </button>
                                            <div className="flex items-center gap-1">
                                                <MessageCircle size={14} />
                                                {discussion.replyCount || 0}
                                            </div>
                                            <div className="flex items-center gap-1 ml-auto text-blue-500 text-xs">
                                                <span>View Thread</span>
                                                <ArrowUpRight size={12} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BookDiscussion;