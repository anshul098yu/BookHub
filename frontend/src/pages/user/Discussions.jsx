import React, { useState, useEffect } from "react";
import {
    MessageSquare,
    Plus,
    Search,
    Filter,
    ChevronUp,
    ChevronDown,
    Heart,
    MessageCircle,
    Share,
    MoreHorizontal,
    ArrowUpRight,
    ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import Loader from "@/components/common/Loader";
import { formatDateTime } from "@/constants/Helper";

const Discussions = () => {
    const [discussions, setDiscussions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("new");
    const [newDiscussion, setNewDiscussion] = useState({
        title: "",
        content: "",
    });
    const [showCreateForm, setShowCreateForm] = useState(false);
    const navigate = useNavigate();

    // Fetch discussions
    const fetchDiscussions = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/discussion/all`,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                }
            );
            if (response?.data?.success) {
                console.log("Fetched discussions:", response.data.data);
                setDiscussions(response.data.data || []);
            }
        } catch (error) {
            console.error("Error fetching discussions:", error);
            toast.error(error?.response?.data?.message || "Failed to fetch discussions");
        } finally {
            setLoading(false);
        }
    };

    // Create new discussion
    const handleCreateDiscussion = async (e) => {
        e.preventDefault();
        if (!newDiscussion.title.trim() || !newDiscussion.content.trim()) {
            toast.error("Title and content are required");
            return;
        }

        try {
            // For general discussions, we don't include a bookId
            const requestData = {
                title: newDiscussion.title,
                content: newDiscussion.content
            };

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
                setNewDiscussion({ title: "", content: "" });
                setShowCreateForm(false);
                fetchDiscussions(); // Refresh discussions
            }
        } catch (error) {
            console.error("Error creating discussion:", error);
            toast.error(error?.response?.data?.message || "Failed to create discussion");
        }
    };

    // Navigate to discussion thread
    const navigateToThread = (discussionId) => {
        navigate(`/discussions/${discussionId}`);
    };

    useEffect(() => {
        fetchDiscussions();
    }, []);

    // Handle voting (like/dislike)
    const handleVote = async (discussionId, voteType, e) => {
        e.stopPropagation(); // Prevent navigating to thread when voting
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
        e.stopPropagation(); // Prevent navigating to thread when liking
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
            toast.error(error?.response?.data?.message || "Failed to like discussion");
        }
    };

    // Filter and sort discussions
    const filteredDiscussions = discussions
        .filter(discussion => {
            try {
                return (
                    (discussion.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (discussion.content || '').toLowerCase().includes(searchTerm.toLowerCase())
                );
            } catch (error) {
                console.error("Error filtering discussion:", error, discussion);
                return false;
            }
        })
        .sort((a, b) => {
            try {
                if (sortBy === "new") {
                    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                } else if (sortBy === "popular") {
                    return ((b.upvotes || 0) - (b.downvotes || 0)) - ((a.upvotes || 0) - (a.downvotes || 0));
                }
                return 0;
            } catch (error) {
                console.error("Error sorting discussions:", error);
                return 0;
            }
        });

    return (
        <div className="w-full px-4 py-6 bg-gray-50 dark:bg-transparent">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Discussions</h1>
                        <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                            Join the conversation with other book lovers
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Create Discussion
                    </Button>
                </div>

                {/* Create Discussion Form */}
                {showCreateForm && (
                    <Card className="mb-6 dark:bg-zinc-900">
                        <CardContent className="p-6">
                            <form onSubmit={handleCreateDiscussion}>
                                <div className="mb-4">
                                    <Input
                                        type="text"
                                        placeholder="Discussion title"
                                        value={newDiscussion.title}
                                        onChange={(e) => setNewDiscussion({ ...newDiscussion, title: e.target.value })}
                                        className="mb-3"
                                    />
                                    <textarea
                                        placeholder="What would you like to discuss?"
                                        value={newDiscussion.content}
                                        onChange={(e) => setNewDiscussion({ ...newDiscussion, content: e.target.value })}
                                        className="w-full min-h-[120px] p-3 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                                    />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowCreateForm(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit">Post Discussion</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" size={18} />
                        <Input
                            type="text"
                            placeholder="Search discussions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2">
                                <Filter size={18} />
                                Sort by: {sortBy === "new" ? "New" : "Popular"}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => setSortBy("new")}>
                                New
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortBy("popular")}>
                                Popular
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Discussions List */}
                {loading ? (
                    <div className="flex justify-center my-10">
                        <Loader width={9} height={40} />
                    </div>
                ) : filteredDiscussions.length === 0 ? (
                    <Card className="dark:bg-zinc-900">
                        <CardContent className="p-12 text-center">
                            <MessageSquare className="mx-auto h-12 w-12 text-zinc-400 mb-4" />
                            <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-1">
                                No discussions yet
                            </h3>
                            <p className="text-zinc-500 dark:text-zinc-400 mb-4">
                                Be the first to start a conversation!
                            </p>
                            <Button onClick={() => setShowCreateForm(true)}>
                                Create Discussion
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {filteredDiscussions.map((discussion) => (
                            <Card
                                key={discussion._id}
                                className="dark:bg-zinc-900 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => navigateToThread(discussion._id)}
                            >
                                <CardContent className="p-6">
                                    <div className="flex gap-4">
                                        {/* Voting */}
                                        <div className="flex flex-col items-center gap-1">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className={`p-1 ${discussion.userVote === 'up' ? 'text-green-500' : 'text-zinc-400'}`}
                                                onClick={(e) => handleVote(discussion._id, 'up', e)}
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
                                                onClick={(e) => handleVote(discussion._id, 'down', e)}
                                            >
                                                <ChevronDown size={20} />
                                            </Button>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
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
                                                            <Share className="mr-2 h-4 w-4" />
                                                            Share
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            {/* Meta */}
                                            <div className="flex items-center gap-4 mt-4">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src={(discussion.userId || discussion.author)?.profilePic?.imageUrl} />
                                                        <AvatarFallback>
                                                            {(discussion.userId || discussion.author)?.fullName?.charAt(0) || 'U'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                                        {(discussion.userId || discussion.author)?.fullName || 'Anonymous'}
                                                    </span>
                                                </div>
                                                <span className="text-sm text-zinc-500">
                                                    {discussion.createdAt ? `${formatDateTime(discussion.createdAt).date} • ${formatDateTime(discussion.createdAt).time}` : 'No date'}
                                                </span>
                                                {discussion.bookId?.title && (
                                                    <Badge variant="secondary" className="flex items-center gap-1">
                                                        <MessageSquare size={12} />
                                                        {discussion.bookId.title}
                                                    </Badge>
                                                )}
                                                {!discussion.bookId?.title && (
                                                    <Badge variant="secondary">
                                                        General
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Stats */}
                                            <div className="flex items-center gap-4 mt-3 text-sm text-zinc-500">
                                                <button
                                                    className={`flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-300 ${discussion.isLiked ? 'text-red-500' : ''}`}
                                                    onClick={(e) => handleLike(discussion._id, e)}
                                                >
                                                    <ThumbsUp size={16} />
                                                    {discussion.likesCount || 0}
                                                </button>
                                                <div className="flex items-center gap-1">
                                                    <MessageCircle size={16} />
                                                    {discussion.replyCount || 0} comments
                                                </div>
                                                <div className="flex items-center gap-1 ml-auto text-blue-500">
                                                    <span>View Thread</span>
                                                    <ArrowUpRight size={14} />
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
        </div>
    );
};

export default Discussions;