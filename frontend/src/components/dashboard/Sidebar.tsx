"use client";

import { useState } from "react";
import { Menu, Map, Target, LineChart, Phone, Store, WandSparkles, ClipboardList } from "lucide-react";

export default function Sidebar() {
    const [open, setOpen] = useState(true);

    return (
        <div
            className={`h-screen border-r bg-white transition-all duration-300 shadow-sm
      ${open ? "w-64" : "w-16"} flex flex-col`}
        >
            <div className="flex items-center justify-between p-4 border-b">
                {open && <h1 className="font-semibold text-lg">Producer Dashboard</h1>}
                <button onClick={() => setOpen(!open)}>
                    <Menu size={20} />
                </button>
            </div>

            <div className="flex-1 p-2 space-y-1">
                <SidebarItem icon={<Map size={18} />} label="Distribution" open={open} />
                <SidebarItem icon={<Target size={18} />} label="Targeting" open={open} />
                <SidebarItem icon={<ClipboardList size={18} />} label="Predictions" open={open} />
                <SidebarItem icon={<LineChart size={18} />} label="Pricing" open={open} />
                <SidebarItem icon={<Store size={18} />} label="Purchasing" open={open} />
                <SidebarItem icon={<Map size={18} />} label="Location Requests" open={open} />
                <SidebarItem icon={<Phone size={18} />} label="Contacts" open={open} />
                <SidebarItem icon={<WandSparkles size={18} />} label="Marketing" open={open} />
            </div>
        </div>
    );
}

function SidebarItem({ icon, label, open }: { icon: any; label: string; open: boolean }) {
    return (
        <div
            className="flex items-center gap-3 px-3 py-2 text-sm 
      hover:bg-rose-50 rounded-lg cursor-pointer transition"
        >
            {icon}
            {open && <span>{label}</span>}
        </div>
    );
}
