"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AIWindow from "@/components/dashboard/AIWindow";

export default function AdminDashboard() {
    const router = useRouter();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const access = params.get("access");
        const refresh = params.get("refresh");

        if (access && refresh) {
            localStorage.setItem("access", access);
            localStorage.setItem("refresh", refresh);
            localStorage.setItem("is_staff", "true");
            // Clean up URL
            window.history.replaceState({}, "", "/AdminDashboard");
        }

        const token = localStorage.getItem("access");
        const isStaff = localStorage.getItem("is_staff");

        if (!token || isStaff !== "true") {
            const baseUrl =
                process.env.NEXT_PUBLIC_FRONTEND_URL ||
                window.location.origin; // fallback to current origin
            window.location.href = `${baseUrl}/login`;
        }
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    Welcome to the Graft Systems Admin Dashboard
                </h1>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main AI Window - Takes up 2 columns */}
                    <div className="lg:col-span-2">
                        <div className="h-96 lg:h-[600px]">
                            <AIWindow />
                        </div>
                    </div>
                    {/* Sidebar - Can be used for alerts, stats, etc. */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Dashboard Stats
                            </h2>
                            <div className="space-y-3">
                                <div className="border-b pb-3">
                                    <p className="text-gray-600 text-sm">Total Users</p>
                                    <p className="text-2xl font-bold text-gray-900">--</p>
                                </div>
                                <div className="border-b pb-3">
                                    <p className="text-gray-600 text-sm">Active Sessions</p>
                                    <p className="text-2xl font-bold text-gray-900">--</p>
                                </div>
                                <div>
                                    <p className="text-gray-600 text-sm">System Status</p>
                                    <p className="text-2xl font-bold text-green-600">Online</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
