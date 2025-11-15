"use client";

import Link from "next/link";

export default function Navbar() {
    return (
        <nav className="w-full flex justify-between items-center px-10 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-md fixed z-50">
            <h1 className="text-2xl font-bold text-rose-800">Graft Systems</h1>

            {/* Nav Options */}
            <div className="hidden md:flex space-x-6 font-medium text-gray-700">
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
                    className="px-4 py-2 rounded-lg border border-rose-800 text-rose-800 hover:bg-rose-800 hover:text-white transition"
                >
                    Login
                </Link>
                <Link
                    href="/home/register"
                    className="px-4 py-2 rounded-lg bg-rose-800 text-white hover:bg-rose-700 transition"
                >
                    Register
                </Link>
            </div>
        </nav>
    );
}
