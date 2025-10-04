import StatCard from "@/components/common/StatCard";
import axios from "axios";
import { IndianRupee, TrendingUp, TrendingDown } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

const FinesStats = () => {
    const [loading, setLoading] = useState(false);
    const [finesStats, setFinesStats] = useState(null);

    useEffect(() => {
        const fetchFinesStats = async () => {
            setLoading(true);
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/fine/stats`,
                    {
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                        },
                    }
                );

                if (response?.data?.success) {
                    setFinesStats(response.data.data);
                }
            } catch (error) {
                console.error("Error fetching fines stats:", error);
                toast.error(error?.response?.data?.message || "Failed to fetch fines statistics");
            } finally {
                setLoading(false);
            }
        };
        fetchFinesStats();
    }, []);

    return (
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 -mt-2 mb-8">
            <StatCard
                icon={TrendingUp}
                title="Total Fines Collected"
                value={loading ? null : `₹${finesStats?.totalFinesCollected || 0}`}
                color="green"
            />
            <StatCard
                icon={IndianRupee}
                title="Outstanding Fines"
                value={loading ? null : `₹${finesStats?.totalOutstandingFines || 0}`}
                color="orange"
            />
            <StatCard
                icon={TrendingDown}
                title="Total Fines Charged"
                value={loading ? null : `₹${finesStats?.totalFinesCharged || 0}`}
                color="blue"
            />
        </div>
    );
};

export default FinesStats;