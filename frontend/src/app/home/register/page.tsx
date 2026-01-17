"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/lib/api";
import Navbar from "@/components/Navbar";

export default function RegisterPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("retailer");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);

        try {
            const res = await api.post("register/", { username, password, role });
            setMessage("Registration successful! Logging in...");

            // Now login the user
            const loginRes = await api.post("login/", { username, password });
            const { access, refresh, is_staff, role: userRole } = loginRes.data;

            localStorage.setItem("access", access);
            localStorage.setItem("refresh", refresh);
            localStorage.setItem("role", userRole);
            localStorage.setItem("is_staff", is_staff);

            setTimeout(() => {
                if (role === "producer") {
                    router.push("/home/register/finish-producer");
                } else {
                    router.push("/home/register/finish-retailer");
                }
            }, 1000);
        } catch (err: any) {
            console.error(err.response?.data || err.message);
            setError(err.response?.data?.error || "Registration failed. Please try again.");
        } finally {
            setLoading(false);
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
                        Create Your Account <br />
                        <span className="text-rose-800">Join Graft Systems</span>
                    </h1>

                    <p className="text-gray-600 text-lg max-w-sm">
                        Whether you're a producer or retailer, your personalized dashboard
                        gives you complete clarity into distribution insights, inventory,
                        and performance metrics — all powered by modern AI tooling.
                    </p>
                </div>

                {/* RIGHT PANEL */}
                <div className="flex w-full md:w-1/2 items-center justify-center p-10 animate-slideInRight">
                    <form onSubmit={handleSubmit} className="w-full max-w-sm">
                        <h2 className="text-3xl font-semibold text-rose-900 mb-6 text-center">
                            Register
                        </h2>

                        {error && (
                            <p className="text-center text-sm text-red-600 mb-4">
                                {error}
                            </p>
                        )}
                        {loading && (
                            <div className="text-center text-sm text-rose-600 mb-4 flex items-center justify-center">
                                <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Loading...
                            </div>
                        )}

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input
                                    type="text"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={loading}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600 text-gray-900 placeholder:text-gray-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600 text-gray-900 placeholder:text-gray-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                                <div className="flex flex-row space-x-6">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name="role"
                                            value="retailer"
                                            checked={role === "retailer"}
                                            onChange={(e) => setRole(e.target.value)}
                                            disabled={loading}
                                            className="hidden"
                                        />
                                        <span className={`w-4 h-4 rounded-full border-2 ${role === "retailer" ? "bg-rose-600 border-rose-600" : "border-gray-300"} mr-3`}></span>
                                        <span className="text-gray-700 font-medium">Retailer</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="radio"
                                            name="role"
                                            value="producer"
                                            checked={role === "producer"}
                                            onChange={(e) => setRole(e.target.value)}
                                            disabled={loading}
                                            className="hidden"
                                        />
                                        <span className={`w-4 h-4 rounded-full border-2 ${role === "producer" ? "bg-rose-600 border-rose-600" : "border-gray-300"} mr-3`}></span>
                                        <span className="text-gray-700 font-medium">Producer</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="
                                w-full mt-8 bg-rose-800 text-white py-3 rounded-lg
                                hover:bg-rose-700 transition-all duration-200
                                shadow-md hover:shadow-lg
                                disabled:bg-gray-400 disabled:cursor-not-allowed
                            "
                        >
                            {loading ? "Registering..." : "Register"}
                        </button>

                        <p className="text-center text-sm text-gray-600 mt-6">
                            Already have an account?{" "}
                            <span
                                onClick={() => router.push("/home/login")}
                                className="text-rose-700 font-medium hover:underline cursor-pointer"
                            >
                                Login
                            </span>
                        </p>
                    </form>
                </div>
            </div>
        </main>
        </>
    );
}
