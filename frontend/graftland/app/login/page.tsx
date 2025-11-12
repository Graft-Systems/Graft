"use client";
import { useState } from "react";
import api from "@/lib/api";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            // Call API to login
            const res = await api.post("login/", { username, password });
            const { access, refresh, is_staff, role } = res.data;

            // Determine dashboard URL based on role
            let dashboardUrl = "";
            if (is_staff) dashboardUrl = "http://localhost:3001/dashboards/AdminDashboard";
            else if (role === "producer") dashboardUrl = "http://localhost:3001/dashboards/ProducerDashboard";
            else if (role === "retailer") dashboardUrl = "http://localhost:3001/dashboards/RetailerDashboard";
            else {
                setError("Invalid user role");
                return;
            }

            // Open dashboard in a new window
            const dashboardWindow = window.open(dashboardUrl, "_blank");
            if (!dashboardWindow) {
                setError("Please allow popups for this site.");
                return;
            }

            // Listen for token request from the dashboard window
            const handleMessage = (event: MessageEvent) => {
                if (event.origin !== "http://localhost:3001") return;

                if (event.data === "requestTokens") {
                    dashboardWindow.postMessage({ access, refresh, role, is_staff }, "http://localhost:3001");
                }
            };

            window.addEventListener("message", handleMessage);

            // Clean up listener after a few seconds
            setTimeout(() => {
                window.removeEventListener("message", handleMessage);
            }, 5000);

        } catch (err: any) {
            console.error(err.response?.data || err.message);
            setError(err.response?.data?.error || "Login failed. Please try again.");
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-50">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm border border-gray-200"
            >
                <h2 className="text-2xl font-bold text-rose-800 mb-6 text-center">
                    Login
                </h2>

                {error && <p className="text-center text-sm text-red-600 mb-4">{error}</p>}

                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 mb-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
                />

                <button
                    type="submit"
                    className="w-full bg-rose-800 text-white py-3 rounded-lg hover:bg-rose-700 transition"
                >
                    Login
                </button>
            </form>
        </main>
    );
}
