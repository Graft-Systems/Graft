"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    // State for loading and for holding the user's role
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        // When the layout mounts, check localStorage for auth tokens
        const accessToken = localStorage.getItem("access");
        const userRole = localStorage.getItem("role");
        const isStaffRaw = localStorage.getItem("is_staff");
        const isStaff = isStaffRaw === "true" || isStaffRaw === "True" || isStaffRaw === "1";

        if (accessToken && (isStaff || !!userRole)) {
            // If token exists and either role exists or user is staff, treat as authenticated.
            // Role is optional for admin/staff users.
            setRole(isStaff ? "admin" : userRole);
            setLoading(false);
        } else {
            // If no tokens, the user is not authenticated.
            // Redirect them to the login page.
            router.push("/home/login");
        }

        // This effect should run once when the component mounts.
        // We add `router` to the dependency array because it's used inside.
    }, [router]);

    // Show loading spinner while checking auth
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen" style={{ backgroundColor: "#f3f4f6" }}>
                <p style={{ color: "#4b5563" }}>Loading dashboard...</p>
            </div>
        );
    }

    // If not loading, we are authenticated, so render the real layout
    return (
        <div className="flex min-h-screen">
            <main className="flex-1" style={{ backgroundColor: "#f3f4f6" }}>
                {children}
            </main>
        </div>
    );
}