import React from "react";
import ManageUserFines from "@/components/admin/ManageUserFines";
import FinesStats from "@/components/admin/fines/FinesStats";

const AdminFinesPage = () => {
    return (
        <div className="px-6 py-8 flex flex-col gap-6 bg-zinc-100 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 min-h-[calc(100vh-4rem)]">
            <FinesStats />
            <ManageUserFines />
        </div>
    );
};

export default AdminFinesPage;