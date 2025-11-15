"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function RegisterPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("retailer");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");

        try {
            const res = await api.post("register/", { username, password, role });
            if (res.status === 201) {
                setMessage("Registration successful! Redirecting to login...");
                setTimeout(() => router.push("/home/login"), 1500);
            }
        } catch (err: any) {
            console.error(err.response?.data || err.message);
            setError("Registration failed. Username may already exist.");
        }
    };

    return (
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
                        {message && (
                            <p className="text-center text-sm text-green-600 mb-4">
                                {message}
                            </p>
                        )}

                        <div className="space-y-5">
                            <input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
                            />

                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
                            />

                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
                            >
                                <option value="retailer">Retailer</option>
                                <option value="producer">Producer</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="
                                w-full mt-8 bg-rose-800 text-white py-3 rounded-lg
                                hover:bg-rose-700 transition-all duration-200
                                shadow-md hover:shadow-lg
                            "
                        >
                            Register
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
    );
}
