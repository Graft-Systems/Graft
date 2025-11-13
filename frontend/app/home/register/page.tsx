"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function RegisterPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("retailer");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

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
        <main className="flex min-h-screen items-center justify-center bg-gray-50">
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm border border-gray-200"
            >
                <h2 className="text-2xl font-bold text-rose-800 mb-6 text-center">
                    Register
                </h2>

                {error && <p className="text-center text-sm text-red-600 mb-4">{error}</p>}
                {message && <p className="text-center text-sm text-green-600 mb-4">{message}</p>}

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

                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full p-3 mb-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
                >
                    <option value="retailer">Retailer</option>
                    <option value="producer">Producer</option>
                </select>

                <button
                    type="submit"
                    className="w-full bg-rose-800 text-white py-3 rounded-lg hover:bg-rose-700 transition"
                >
                    Register
                </button>
            </form>
        </main>
    );
}
