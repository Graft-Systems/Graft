"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Ignore messages not from login page
            if (event.origin !== "http://localhost:3000") return;

            const { access, refresh, role, is_staff } = event.data || {};
            if (access && refresh) {
                localStorage.setItem("access", access);
                localStorage.setItem("refresh", refresh);
                localStorage.setItem("role", role);
                localStorage.setItem("is_staff", is_staff ? "true" : "false");
                setLoading(false);
            }
        };

        window.addEventListener("message", handleMessage);

        // Ask opener for tokens
        if (window.opener) {
            window.opener.postMessage("requestTokens", "http://localhost:3000");
        }

        // Fallback: if tokens not received, go back to login
        const timeout = setTimeout(() => {
            if (!localStorage.getItem("access")) {
                window.close(); // Close the dashboard window
                alert("Login failed or timed out. Please login again.");
            }
        }, 2000);

        return () => {
            clearTimeout(timeout);
            window.removeEventListener("message", handleMessage);
        };
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <p className="text-gray-600">Loading dashboard...</p>
            </div>
        );
    }

    const role = localStorage.getItem("role");

    return (
        <div className="flex min-h-screen">
            <aside className="w-64 bg-gray-900 text-white p-6">
                <h2 className="text-xl font-bold mb-8">
                    {role === "admin" ? "Graft Admin" :
                        role === "producer" ? "Graft Producer" : "Graft Retailer"}
                </h2>
            </aside>

            <main className="flex-1 bg-gray-100 p-10">
                {children}
            </main>
        </div>
    );
}
