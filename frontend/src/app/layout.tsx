import type { Metadata } from "next";
import { Geist, Geist_Mono, Titillium_Web } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const titillium = Titillium_Web({
  subsets: ["latin"],
  variable: "--font-titillium",
  weight: ["200", "300", "400", "600", "700"], // choose the weights you need
});

export const metadata: Metadata = {
  title: "Graft Systems",
  description: "Intelligent Wine Insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${titillium.variable} antialiased`}>
        <Navbar />
        <div className="pt-20"> {/* Push content below fixed navbar */}
          {children}
        </div>
      </body>
    </html>
  );
}