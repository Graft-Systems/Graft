"use client";

import { motion } from "framer-motion";

const stats = [
    { label: "Active Store Placements", value: "142", change: "+12%", color: "#9f1239" },
    { label: "Estimated Bottles on Shelf", value: "1,240", change: "-5%", color: "#9f1239" },
    { label: "Reorders Predicted (7 Days)", value: "18", change: "Action Needed", color: "#d97706" },
    { label: "Avg. Days on Shelf", value: "24", change: "-2 days", color: "#9f1239" },
];

export default function SummaryCards() {
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
                    <p className="text-sm font-medium uppercase tracking-wider" style={{ color: "#737373" }}>
                        {stat.label}
                    </p>
                    <div className="flex items-end justify-between mt-2">
                        <h3 className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</h3>
                        <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: "#f5f5f5", color: "#525252" }}>
                            {stat.change}
                        </span>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}