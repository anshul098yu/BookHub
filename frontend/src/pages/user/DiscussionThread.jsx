import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    MessageSquare,
    ChevronUp,
    ChevronDown,
    Heart,
    MessageCircle,
    Share,
    MoreHorizontal,
    Send,
    ArrowLeft,
    ThumbsUp,
    Calendar,
    Book,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import axios from "axios";
import { toast } from "sonner";
import Loader from "@/components/common/Loader";
import { formatDateTime } from "@/constants/Helper";

const DiscussionThread = () => {
    const { discussionId } = useParams();
    const navigate = useNavigate();
    const [discussion, setDiscussion] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [commentContent, setCommentContent] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Fetch discussion thread and comments
    const fetchDiscussionThread = async () => {
        setLoading(true);
        try {
            // Fetch the discussion
            const discussionResponse = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/discussion/${discussionId}`,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                }
            );

            if (discussionResponse?.data?.success) {
                setDiscussion(discussionResponse.data.data);
            }

            // Fetch the comments (replies)
            const commentsResponse = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/discussion/replies/${discussionId}`,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                }
            );

            if (commentsResponse?.data?.success) {
                setComments(commentsResponse.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching discussion thread:", error);
            toast.error(error?.response?.data?.message || "Failed to load discussion thread");
        } finally {
            setLoading(false);
        }
    };

    // Add a comment to the discussion
    const handleAddComment = async () => {
        if (!commentContent.trim()) {
            toast.error("Comment cannot be empty");
            return;
        }

        setSubmitting(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/discussion/create`,
                {
                    content: commentContent,
                    parentId: discussionId,
                    bookId: discussion.bookId?._id, // Optional, include only if the discussion is associated with a book
                },
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                }
            );

            if (response?.data?.success) {
                toast.success("Comment added successfully");
                setCommentContent("");
                fetchDiscussionThread(); // Refresh the comments

                // Update discussion's reply count
                if (discussion) {
                    setDiscussion({
                        ...discussion,
                        replyCount: (discussion.replyCount || 0) + 1,
                    });
                }
            }
        } catch (error) {
            console.error("Error adding comment:", error);
            toast.error(error?.response?.data?.message || "Failed to add comment");
        } finally {
            setSubmitting(false);
        }
    };

    // Handle voting on the main discussion
    const handleVote = async (voteType) => {
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
                setDiscussion(prev => ({
                    ...prev,
                    upvotes: response.data.data.upvotes,
                    downvotes: response.data.data.downvotes,
                    userVote: voteType
                }));
                toast.success(response.data.message);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to vote");
        }
    };

    // Handle voting on comments
    const handleCommentVote = async (commentId, voteType) => {
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/discussion/vote`,
                { discussionId: commentId, voteType },
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                }
            );

            if (response?.data?.success) {
                // Update UI with new vote counts for the comment
                setComments(prev => prev.map(comment =>
                    comment._id === commentId
                        ? {
                            ...comment,
                            upvotes: response.data.data.upvotes,
                            downvotes: response.data.data.downvotes,
                            userVote: voteType
                        }
                        : comment
                ));
                toast.success(response.data.message);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to vote on comment");
        }
    };

    // Handle liking the main discussion
    const handleLike = async () => {
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
                setDiscussion(prev => ({
                    ...prev,
                    likesCount: response.data.data.likesCount,
                    isLiked: response.data.data.isLiked
                }));
                toast.success(response.data.message);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to like discussion");
        }
    };

    // Handle liking a comment
    const handleCommentLike = async (commentId) => {
        try {
            const response = await axios.patch(
                `${import.meta.env.VITE_BACKEND_URL}/discussion/like/${commentId}`,
                {},
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                }
            );

            if (response?.data?.success) {
                // Update UI with new like count for the comment
                setComments(prev => prev.map(comment =>
                    comment._id === commentId
                        ? {
                            ...comment,
                            likesCount: response.data.data.likesCount,
                            isLiked: response.data.data.isLiked
                        }
                        : comment
                ));
                toast.success(response.data.message);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to like comment");
        }
    };

    useEffect(() => {
        if (discussionId) {
            fetchDiscussionThread();
        }
    }, [discussionId]);

    if (loading) {
        return (
            <div className="flex justify-center my-10">
                <Loader width={9} height={40} />
            </div>
        );
    }

    if (!discussion) {
        return (
            <div className="w-full px-4 py-6">
                <div className="max-w-4xl mx-auto">
                    <Card className="dark:bg-zinc-900">
                        <CardContent className="p-12 text-center">
                            <MessageSquare className="mx-auto h-12 w-12 text-zinc-400 mb-4" />
                            <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-1">
                                Discussion not found
                            </h3>
                            <p className="text-zinc-500 dark:text-zinc-400 mb-4">
                                The discussion you're looking for might have been removed or doesn't exist.
                            </p>
                            <Button onClick={() => navigate("/discussions")}>
                                Back to Discussions
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full px-4 py-6 bg-gray-50 dark:bg-transparent">
            <div className="max-w-4xl mx-auto">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    className="mb-4 flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                    onClick={() => navigate("/discussions")}
                >
                    <ArrowLeft size={18} />
                    Back to Discussions
                </Button>

                {/* Main Discussion Card */}
                <Card className="mb-6 dark:bg-zinc-900">
                    <CardHeader className="pb-0">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-white">
                                {discussion.title || "Untitled Discussion"}
                            </CardTitle>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="ghost" className="p-1">
                                        <MoreHorizontal size={16} />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem>
                                        <Share className="mr-2 h-4 w-4" />
                                        Share
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="flex gap-4">
                            {/* Voting */}
                            <div className="flex flex-col items-center gap-1">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className={`p-1 ${discussion.userVote === 'up' ? 'text-green-500' : 'text-zinc-400'}`}
                                    onClick={() => handleVote('up')}
                                >
                                    <ChevronUp size={20} />
                                </Button>
                                <span className="text-sm font-medium">
                                    {(discussion.upvotes || 0) - (discussion.downvotes || 0)}
                                </span>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className={`p-1 ${discussion.userVote === 'down' ? 'text-red-500' : 'text-zinc-400'}`}
                                    onClick={() => handleVote('down')}
                                >
                                    <ChevronDown size={20} />
                                </Button>
                            </div>

                            {/* Content */}
                            <div className="flex-1">
                                <p className="text-zinc-700 dark:text-zinc-300 mb-6 whitespace-pre-line">
                                    {discussion.content}
                                </p>

                                {/* Meta & Stats */}
                                <div className="flex flex-wrap items-center gap-4 mt-6">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={discussion.userId?.profilePic?.imageUrl} />
                                            <AvatarFallback>
                                                {discussion.userId?.fullName?.charAt(0) || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                            {discussion.userId?.fullName || 'Anonymous'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1 text-sm text-zinc-500">
                                        <Calendar size={14} />
                                        <span>
                                            {discussion.createdAt ? formatDateTime(discussion.createdAt).date : 'No date'}
                                        </span>
                                        <span>•</span>
                                        <span>
                                            {discussion.createdAt ? formatDateTime(discussion.createdAt).time : ''}
                                        </span>
                                    </div>

                                    {discussion.bookId?.title && (
                                        <Badge className="flex items-center gap-1">
                                            <Book size={12} />
                                            {discussion.bookId.title}
                                        </Badge>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-4 mt-4 pb-2 border-b border-zinc-200 dark:border-zinc-700">
                                    <button
                                        className={`flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-300 ${discussion.isLiked ? 'text-red-500' : 'text-zinc-500'}`}
                                        onClick={handleLike}
                                    >
                                        <ThumbsUp size={16} />
                                        <span>{discussion.likesCount || 0} Likes</span>
                                    </button>
                                    <div className="flex items-center gap-1 text-zinc-500">
                                        <MessageCircle size={16} />
                                        <span>{discussion.replyCount || comments.length || 0} Comments</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Add Comment Form */}
                <Card className="mb-6 dark:bg-zinc-900">
                    <CardContent className="p-4">
                        <div className="flex gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={localStorage.getItem("userProfilePic")} />
                                <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <textarea
                                    placeholder="Add a comment to this discussion..."
                                    value={commentContent}
                                    onChange={(e) => setCommentContent(e.target.value)}
                                    className="w-full min-h-[80px] p-3 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                                    disabled={submitting}
                                />
                                <div className="flex justify-end mt-2">
                                    <Button
                                        onClick={handleAddComment}
                                        size="sm"
                                        className="flex items-center gap-1"
                                        disabled={submitting}
                                    >
                                        {submitting ? "Posting..." : (
                                            <>
                                                <Send size={16} />
                                                Post Comment
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Comments Section */}
                <div className="mb-6">
                    <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
                        Comments ({comments.length})
                    </h3>

                    {comments.length === 0 ? (
                        <Card className="dark:bg-zinc-900">
                            <CardContent className="p-8 text-center">
                                <MessageCircle className="mx-auto h-10 w-10 text-zinc-400 mb-3" />
                                <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-1">
                                    No comments yet
                                </h3>
                                <p className="text-zinc-500 dark:text-zinc-400">
                                    Be the first to comment on this discussion!
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {comments.map((comment) => (
                                <Card key={comment._id} className="dark:bg-zinc-900">
                                    <CardContent className="p-4">
                                        <div className="flex gap-3">
                                            {/* Voting */}
                                            <div className="flex flex-col items-center gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className={`p-1 ${comment.userVote === 'up' ? 'text-green-500' : 'text-zinc-400'}`}
                                                    onClick={() => handleCommentVote(comment._id, 'up')}
                                                >
                                                    <ChevronUp size={18} />
                                                </Button>
                                                <span className="text-xs font-medium">
                                                    {(comment.upvotes || 0) - (comment.downvotes || 0)}
                                                </span>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className={`p-1 ${comment.userVote === 'down' ? 'text-red-500' : 'text-zinc-400'}`}
                                                    onClick={() => handleCommentVote(comment._id, 'down')}
                                                >
                                                    <ChevronDown size={18} />
                                                </Button>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarImage src={comment.userId?.profilePic?.imageUrl} />
                                                            <AvatarFallback>
                                                                {comment.userId?.fullName?.charAt(0) || 'U'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <span className="text-sm font-medium text-zinc-900 dark:text-white">
                                                                {comment.userId?.fullName || 'Anonymous'}
                                                            </span>
                                                            <span className="text-xs text-zinc-500 ml-2">
                                                                {comment.createdAt ? `${formatDateTime(comment.createdAt).date} • ${formatDateTime(comment.createdAt).time}` : 'No date'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button size="sm" variant="ghost" className="p-1">
                                                                <MoreHorizontal size={16} />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenuItem>
                                                                Report
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>

                                                <p className="text-zinc-700 dark:text-zinc-300 mb-3 whitespace-pre-line">
                                                    {comment.content}
                                                </p>

                                                {/* Actions */}
                                                <div className="flex items-center gap-4 text-sm text-zinc-500">
                                                    <button
                                                        className={`flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-300 ${comment.isLiked ? 'text-red-500' : ''}`}
                                                        onClick={() => handleCommentLike(comment._id)}
                                                    >
                                                        <ThumbsUp size={14} />
                                                        {comment.likesCount || 0} Likes
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DiscussionThread;