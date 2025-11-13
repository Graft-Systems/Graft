"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const res = await api.post("login/", { username, password });
            const { access, refresh, is_staff, role } = res.data;

            // Save tokens to localStorage or cookies
            localStorage.setItem("access", access);
            localStorage.setItem("refresh", refresh);
            localStorage.setItem("role", role);
            localStorage.setItem("is_staff", is_staff);

            // Determine dashboard route inside Next.js app
            let dashboardPath = "";
            if (is_staff) dashboardPath = "/AdminDashboard";
            else if (role === "producer") dashboardPath = "/ProducerDashboard";
            else if (role === "retailer") dashboardPath = "/RetailerDashboard";
            else {
                setError("Invalid user role");
                return;
            }

            // Navigate internally (no popup)
            router.push(dashboardPath);

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
