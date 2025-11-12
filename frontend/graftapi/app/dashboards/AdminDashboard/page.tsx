"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

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
            // optionally clear URL params
            window.history.replaceState({}, "", "/AdminDashboard");
        }

        const token = localStorage.getItem("access");
        const isStaff = localStorage.getItem("is_staff");

        if (!token || isStaff !== "true") {
            window.location.href = "http://localhost:3000/login";
        }
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <h1 className="text-2xl font-semibold">
                Welcome to the Graft Systems Admin Dashboard
            </h1>
        </div>
    );
}
