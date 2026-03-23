"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu, LayoutDashboard, Eye, Scale, Cpu } from "lucide-react";

interface NavItem {
    label: string;
    subtitle?: string;
    icon: typeof LayoutDashboard;
    href: string;
    children?: Array<{
        label: string;
        href: string;
        icon?: typeof LayoutDashboard;
    }>;
}

const NAV_ITEMS: NavItem[] = [
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
        children: [
            {
                label: "Workbench",
                href: "/ProducerDashboard/vigil/ml",
                icon: Cpu,
            },
        ],
    },
    {
        label: "Legal Insight Provider",
        subtitle: "State Profile → Logic Tree",
        icon: Scale,
        href: "/ProducerDashboard/legal",
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
                    <div key={item.href} className="space-y-1">
                        <SidebarItem
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

                        {open && item.children?.length ? (
                            <div className="ml-5 space-y-1">
                                {item.children.map((child) => {
                                    const isChildActive = pathname === child.href || pathname.startsWith(`${child.href}/`);
                                    return (
                                        <SidebarItem
                                            key={child.href}
                                            icon={child.icon ? <child.icon size={15} /> : <span className="inline-block w-[15px]" />}
                                            label={child.label}
                                            open={open}
                                            active={isChildActive}
                                            onClick={() => router.push(child.href)}
                                        />
                                    );
                                })}
                            </div>
                        ) : null}
                    </div>
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
    icon: ReactNode;
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
