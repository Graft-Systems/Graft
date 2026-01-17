"use client";

import Link from "next/link";

export default function Navbar() {
    return (
        <nav className="w-full flex justify-between items-center px-10 py-4 fixed z-50" style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e5e7eb" }}>

            <h1 className="text-2xl font-bold" style={{ color: "#9f1239" }}>Graft Systems</h1>

            {/* Nav Options */}
            <div className="hidden md:flex space-x-6 font-medium" style={{ color: "#374151" }}>
                <Link href="/">Home</Link>
                <Link href="/about">About</Link>
                <Link href="/producers">Producers</Link>
                <Link href="/retailers">Retailers</Link>
                <Link href="/pricing">Pricing</Link>
                <Link href="/contact">Contact</Link>
            </div>

            {/* Login / Register */}
            <div className="flex space-x-4">
                <Link
                    href="/home/login"
                    className="px-4 py-2 rounded-lg transition"
                    style={{ border: "1px solid #9f1239", color: "#9f1239" }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#9f1239"; e.currentTarget.style.color = "#ffffff"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#9f1239"; }}
                >
                    Login
                </Link>
                <Link
                    href="/home/register"
                    className="px-4 py-2 rounded-lg transition"
                    style={{ backgroundColor: "#9f1239", color: "#ffffff" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#be123c"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#9f1239"}
                >
                    Register
                </Link>
            </div>
        </nav>
    );
}
