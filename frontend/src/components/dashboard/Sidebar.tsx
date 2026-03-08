"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu, LayoutDashboard, Eye } from "lucide-react";

const NAV_ITEMS = [
    {
        label: "Producer Overview",
        icon: LayoutDashboard,
        href: "/ProducerDashboard",
    },
    {
        label: "VIGIL",
        subtitle: "Vine Intelligence for Grape Identification & Load-estimation",
        icon: Eye,
        href: "/ProducerDashboard/vigil",
    },
];

export default function Sidebar() {
    const [open, setOpen] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    return (
        <div
            className={`h-screen border-r transition-all duration-300 shadow-sm
      ${open ? "w-64" : "w-16"} flex flex-col sticky top-0`}
            style={{ backgroundColor: "#ffffff" }}
        >
            <div className="flex items-center justify-between p-4 border-b">
                {open && <h1 className="font-semibold text-lg" style={{ color: "#171717" }}>Graft</h1>}
                <button onClick={() => setOpen(!open)} style={{ color: "#374151" }}>
                    <Menu size={20} />
                </button>
            </div>

            <div className="flex-1 p-2 space-y-1">
                {NAV_ITEMS.map((item) => (
                    <SidebarItem
                        key={item.href}
                        icon={<item.icon size={18} />}
                        label={item.label}
                        subtitle={item.subtitle}
                        open={open}
                        active={
                            item.href === "/ProducerDashboard"
                                ? pathname === "/ProducerDashboard"
                                : pathname.startsWith(item.href)
                        }
                        onClick={() => router.push(item.href)}
                    />
                ))}
            </div>
        </div>
    );
}

function SidebarItem({
    icon,
    label,
    subtitle,
    open,
    active,
    onClick,
}: {
    icon: any;
    label: string;
    subtitle?: string;
    open: boolean;
    active: boolean;
    onClick: () => void;
}) {
    const [hovered, setHovered] = useState(false);

    const isHighlighted = active || hovered;

    return (
        <div
            className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg cursor-pointer transition"
            style={{
                backgroundColor: active ? "#fff1f2" : hovered ? "#fef2f2" : "transparent",
                color: isHighlighted ? "#9f1239" : "#374151",
                fontWeight: active ? 600 : 400,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={onClick}
        >
            {icon}
            {open && (
                <div className="flex flex-col min-w-0">
                    <span className="truncate">{label}</span>
                    {subtitle && (
                        <span className="text-[10px] truncate" style={{ color: "#6b7280" }}>
                            {subtitle}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
