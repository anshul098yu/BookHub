import React from "react";
import { Badge } from "@/components/ui/badge";
import { IndianRupee } from "lucide-react";

const FineHistoryCard = ({ fineData }) => {
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
        <div className="border rounded-lg p-4 bg-white dark:bg-zinc-800 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">₹{fineData.amount}</span>
                    </div>
                    <Badge variant={fineData.type === 'charged' ? 'destructive' : 'default'}>
                        {fineData.type === 'charged' ? 'Charged' : 'Paid'}
                    </Badge>
                </div>
                <div className="text-xs text-muted-foreground text-right">
                    {formatDate(fineData.createdAt)}
                </div>
            </div>

            <div className="mt-3 text-sm">
                <p className="text-muted-foreground">{fineData.reason}</p>
            </div>

            {fineData.adminId && (
                <div className="mt-2 text-xs text-muted-foreground">
                    By: {fineData.adminId.fullName}
                </div>
            )}
        </div>
    );
};

export default FineHistoryCard;