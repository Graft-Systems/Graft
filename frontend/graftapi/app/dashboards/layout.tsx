"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("access");
        if (!token) {
            router.push("/login");
        }
    }, [router]);

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 text-white p-6">
                <h2 className="text-xl font-bold mb-8">Graft Admin</h2>
                <nav className="space-y-4">
                    <button onClick={() => router.push("/dashboards/admin")} className="block hover:text-gray-300">Admin Dashboard</button>
                    <button onClick={() => router.push("/dashboards/producer")} className="block hover:text-gray-300">Producer Dashboard</button>
                    <button onClick={() => router.push("/dashboards/retailer")} className="block hover:text-gray-300">Retailer Dashboard</button>
                </nav>
            </aside>

            {/* Main content area */}
            <main className="flex-1 bg-gray-100 p-10">
                {children}
            </main>
        </div>
    );
}
