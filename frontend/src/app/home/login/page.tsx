"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/lib/api";
import Navbar from "@/components/Navbar";

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

            localStorage.setItem("access", access);
            localStorage.setItem("refresh", refresh);
            localStorage.setItem("role", role);
            localStorage.setItem("is_staff", is_staff);

            let dashboardPath = "";
            if (is_staff) dashboardPath = "/AdminDashboard";
            else if (role === "producer") dashboardPath = "/ProducerDashboard";
            else if (role === "retailer") dashboardPath = "/RetailerDashboard";
            else {
                setError("Invalid user role");
                return;
            }

            router.push(dashboardPath);
        } catch (err: any) {
            console.error(err.response?.data || err.message);
            setError(err.response?.data?.error || "Login failed. Please try again.");
        }
    };

    return (
        <>
            <Navbar />
            <main className="flex min-h-screen items-center justify-center bg-[#f7f5f3]">
            <div
                className="
                    flex w-[90%] max-w-5xl min-h-[70vh]
                    bg-white rounded-3xl shadow-xl overflow-hidden
                    animate-fadeIn
                "
            >
                {/* LEFT PANEL */}
                <div className="hidden md:flex flex-col justify-center w-1/2 p-14 bg-[#faf7f5] border-r border-gray-200 animate-slideInLeft">
                    <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
                        Welcome Back to <br />
                        <span className="text-rose-800">Graft Systems</span>
                    </h1>

                    <p className="text-gray-600 text-lg max-w-sm">
                        Modern distribution, AI-guided dashboards, and door-level visibility —
                        helping wine brands grow with precision and confidence.
                    </p>
                </div>

                {/* RIGHT PANEL */}
                <div className="flex w-full md:w-1/2 items-center justify-center p-10 animate-slideInRight">
                    <form
                        onSubmit={handleSubmit}
                        className="w-full max-w-sm"
                    >
                        <h2 className="text-3xl font-semibold text-rose-900 mb-6 text-center">
                            Sign In
                        </h2>

                        {error && (
                            <p className="text-center text-sm text-red-600 mb-4">
                                {error}
                            </p>
                        )}

                        <div className="space-y-5">
                            <input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600 text-gray-900 placeholder:text-gray-600"
                            />

                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600 text-gray-900 placeholder:text-gray-600"
                            />
                        </div>

                        <button
                            type="submit"
                            className="
                                w-full mt-8 bg-rose-800 text-white py-3 rounded-lg
                                hover:bg-rose-700 transition-all duration-200
                                shadow-md hover:shadow-lg
                            "
                        >
                            Login
                        </button>
                    </form>
                </div>
            </div>
        </main>
        </>
    );
}
