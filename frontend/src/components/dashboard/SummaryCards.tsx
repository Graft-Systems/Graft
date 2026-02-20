"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import api from "@/app/lib/api";

interface StatCard {
    label: string;
    value: string;
    color: string;
}

export default function SummaryCards() {
    const [stats, setStats] = useState<StatCard[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSummary();
    }, []);

    const fetchSummary = async () => {
        try {
            const response = await api.get("/producer-summary/");
            setStats(response.data);
        } catch (error) {
            console.error("Error fetching summary:", error);
            setStats([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="animate-spin" style={{ color: "#9f1239" }} />
            </div>
        );
    }

    if (stats.length === 0) {
        return (
            <div className="p-8 text-center rounded-xl" style={{ backgroundColor: "#fafafa", border: "1px solid #ffe4e6" }}>
                <p style={{ color: "#374151" }}>No summary data yet. Add wines and store placements to see your metrics.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-5 rounded-xl shadow-sm"
                    style={{ backgroundColor: "#ffffff", borderLeft: "4px solid #9f1239" }}
                >
                    <p className="text-sm font-medium uppercase tracking-wider" style={{ color: "#374151" }}>
                        {stat.label}
                    </p>
                    <div className="flex items-end justify-between mt-2">
                        <h3 className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</h3>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
