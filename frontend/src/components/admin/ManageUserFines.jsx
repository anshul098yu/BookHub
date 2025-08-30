import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IndianRupee, Search, PlusCircle, XCircle, AlertCircle, Check, History } from "lucide-react";
import Loader from "@/components/common/Loader";
import axios from "axios";
import { toast } from "sonner";

const ManageUserFines = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddFineDialog, setShowAddFineDialog] = useState(false);
    const [showUserFineHistory, setShowUserFineHistory] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [fineHistory, setFineHistory] = useState([]);
    const [fineAmount, setFineAmount] = useState('');
    const [fineReason, setFineReason] = useState('');
    const [addFineLoading, setAddFineLoading] = useState(false);
    const [clearFineLoading, setClearFineLoading] = useState(false);

    // Fetch all users
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/user/users`,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                }
            );

            if (response.data.success) {
                setUsers(response.data.data);
                setFilteredUsers(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error(
                error?.response?.data?.message || "Failed to fetch users"
            );
        } finally {
            setLoading(false);
        }
    };

    // Fetch all users with fines
    const fetchUsersWithFines = async () => {
        setLoading(true);
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/fine/users-with-fines`,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                }
            );

            if (response.data.success) {
                // We're setting both users and filteredUsers to be only users with fines
                setUsers(response.data.data);
                setFilteredUsers(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching users with fines:", error);
            toast.error(
                error?.response?.data?.message || "Failed to fetch users with fines"
            );
        } finally {
            setLoading(false);
        }
    };

    // Fetch user's fine history
    const fetchUserFineHistory = async (userId) => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/fine/history/${userId}`,
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                }
            );

            if (response.data.success) {
                setFineHistory(response.data.data.fineHistory);
            }
        } catch (error) {
            console.error("Error fetching fine history:", error);
            toast.error(
                error?.response?.data?.message || "Failed to fetch fine history"
            );
        }
    };

    // Handle search
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredUsers(users);
        } else {
            const filtered = users.filter(user =>
                user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredUsers(filtered);
        }
    }, [searchQuery, users]);

    // Add fine to user
    const handleAddFine = async (e) => {
        e.preventDefault();
        if (!selectedUser) return;

        if (!fineAmount || parseFloat(fineAmount) <= 0) {
            toast.error("Please enter a valid fine amount");
            return;
        }

        setAddFineLoading(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/fine/add-fine`,
                {
                    userId: selectedUser._id,
                    amount: parseFloat(fineAmount),
                    reason: fineReason || "Not specified"
                },
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                }
            );

            if (response.data.success) {
                toast.success("Fine added successfully");

                // Update user in the list
                const updatedUsers = users.map(user => {
                    if (user._id === selectedUser._id) {
                        return {
                            ...user,
                            fineAmount: response.data.data.currentFineAmount
                        };
                    }
                    return user;
                });

                setUsers(updatedUsers);

                // Reset form
                setFineAmount('');
                setFineReason('');
                setShowAddFineDialog(false);

                // Refresh the list to include new users with fines
                fetchUsersWithFines();
            }
        } catch (error) {
            console.error("Error adding fine:", error);
            toast.error(
                error?.response?.data?.message || "Failed to add fine"
            );
        } finally {
            setAddFineLoading(false);
        }
    };

    // Clear user's fine
    const handleClearFine = async (userId) => {
        setClearFineLoading(true);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/fine/clear-fine`,
                {
                    userId
                },
                {
                    withCredentials: true,
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                }
            );

            if (response.data.success) {
                toast.success("Fine cleared successfully");

                // Update users list
                const updatedUsers = users.filter(user => user._id !== userId);
                setUsers(updatedUsers);
                setFilteredUsers(updatedUsers);

                // Close dialogs if open
                if (showUserFineHistory && selectedUser && selectedUser._id === userId) {
                    setShowUserFineHistory(false);
                }
            }
        } catch (error) {
            console.error("Error clearing fine:", error);
            toast.error(
                error?.response?.data?.message || "Failed to clear fine"
            );
        } finally {
            setClearFineLoading(false);
        }
    };

    // Initialize
    useEffect(() => {
        fetchUsersWithFines();
    }, []);

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold">Manage User Fines</h1>
                    <p className="text-muted-foreground mt-1">Charge fines to users or clear existing fines</p>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                    <Button
                        onClick={() => {
                            setSearchQuery('');
                            fetchUsers();
                        }}
                        variant="outline"
                        className="flex-1 sm:flex-none"
                    >
                        Show All Users
                    </Button>
                    <Button
                        onClick={fetchUsersWithFines}
                        variant="outline"
                        className="flex-1 sm:flex-none"
                    >
                        Show Users with Fines
                    </Button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto w-full">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search users by name or email..."
                    className="pl-10 py-6 shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Users List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader />
                </div>
            ) : filteredUsers.length === 0 ? (
                <Card className="bg-muted/40 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mb-5" />
                        <h3 className="text-xl font-semibold mb-2">No Users Found</h3>
                        <p className="text-muted-foreground text-center max-w-md">
                            {users.length > 0
                                ? "No users match your search criteria. Try a different search term."
                                : "There are no users with outstanding fines."}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {filteredUsers.map((user) => (
                        <Card key={user._id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 bg-muted/30">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg font-medium">
                                        {user.fullName}
                                    </CardTitle>
                                    <div className="text-xs text-muted-foreground">
                                        {user.email}
                                    </div>
                                </div>
                                <div className="flex gap-1 items-center bg-white dark:bg-zinc-900 p-2 rounded-md shadow-sm">
                                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                                    <span className={`font-semibold ${user.fineAmount > 0 ? 'text-destructive' : ''}`}>
                                        {user.fineAmount || 0}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="grid grid-cols-2 gap-3 mt-2">
                                    <Button
                                        onClick={() => {
                                            setSelectedUser(user);
                                            setShowAddFineDialog(true);
                                        }}
                                        variant="outline"
                                        className="w-full"
                                        size="sm"
                                    >
                                        <PlusCircle className="h-4 w-4 mr-2" />
                                        Add Fine
                                    </Button>

                                    {user.fineAmount > 0 ? (
                                        <Button
                                            onClick={() => handleClearFine(user._id)}
                                            variant="outline"
                                            className="w-full"
                                            size="sm"
                                            disabled={clearFineLoading}
                                        >
                                            {clearFineLoading ? (
                                                <Loader className="h-4 w-4" />
                                            ) : (
                                                <>
                                                    <XCircle className="h-4 w-4 mr-2" />
                                                    Clear Fine
                                                </>
                                            )}
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            size="sm"
                                            disabled
                                        >
                                            <Check className="h-4 w-4 mr-2" />
                                            No Fines
                                        </Button>
                                    )}
                                </div>

                                {user.fineAmount > 0 && (
                                    <Button
                                        onClick={() => {
                                            setSelectedUser(user);
                                            fetchUserFineHistory(user._id);
                                            setShowUserFineHistory(true);
                                        }}
                                        variant="link"
                                        className="w-full mt-3 text-xs flex items-center justify-center gap-1"
                                        size="sm"
                                    >
                                        <History className="h-3 w-3" />
                                        View Fine History
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add Fine Dialog */}
            <Dialog open={showAddFineDialog} onOpenChange={setShowAddFineDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Add Fine</DialogTitle>
                        <DialogDescription className="text-sm pt-2">
                            {selectedUser && (
                                <span>Adding fine for user: <strong className="text-foreground">{selectedUser.fullName}</strong></span>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAddFine} className="space-y-5 py-3">
                        <div className="space-y-3">
                            <Label htmlFor="amount" className="text-sm font-medium">Fine Amount (₹)</Label>
                            <Input
                                id="amount"
                                type="number"
                                min="1"
                                step="1"
                                placeholder="Enter amount"
                                value={fineAmount}
                                onChange={(e) => setFineAmount(e.target.value)}
                                className="p-5"
                                required
                            />
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="reason" className="text-sm font-medium">Reason (Optional)</Label>
                            <Textarea
                                id="reason"
                                placeholder="Enter reason for the fine"
                                value={fineReason}
                                onChange={(e) => setFineReason(e.target.value)}
                                rows={3}
                                className="resize-none"
                            />
                        </div>

                        <DialogFooter className="pt-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowAddFineDialog(false)}
                                className="w-full sm:w-auto"
                            >
                                Cancel
                            </Button>

                            <Button
                                type="submit"
                                disabled={addFineLoading || !fineAmount}
                                className="w-full sm:w-auto"
                            >
                                {addFineLoading ? (
                                    <Loader className="h-4 w-4 mr-2" />
                                ) : (
                                    'Add Fine'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Fine History Dialog */}
            <Dialog open={showUserFineHistory} onOpenChange={setShowUserFineHistory}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Fine History</DialogTitle>
                        <DialogDescription className="text-sm pt-2">
                            {selectedUser && (
                                <span>Fine history for user: <strong className="text-foreground">{selectedUser.fullName}</strong></span>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-3">
                        {fineHistory.length === 0 ? (
                            <div className="text-center py-8 bg-muted/30 rounded-lg border border-dashed">
                                <p className="text-muted-foreground">No fine history found</p>
                            </div>
                        ) : (
                            <div className="border rounded-lg overflow-hidden shadow-sm">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-5 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                                            <th className="px-5 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                                            <th className="px-5 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                                            <th className="px-5 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-popover divide-y divide-border">
                                        {fineHistory.map((item) => (
                                            <tr key={item._id} className="hover:bg-muted/20 transition-colors">
                                                <td className="px-5 py-4 whitespace-nowrap text-sm">
                                                    {formatDate(item.createdAt)}
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap text-sm">
                                                    <Badge variant={item.type === 'charged' ? 'destructive' : 'default'} className="font-normal">
                                                        {item.type === 'charged' ? 'Charged' : 'Paid'}
                                                    </Badge>
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap text-sm font-medium">
                                                    ₹{item.amount}
                                                </td>
                                                <td className="px-5 py-4 text-sm">
                                                    {item.reason}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ManageUserFines;