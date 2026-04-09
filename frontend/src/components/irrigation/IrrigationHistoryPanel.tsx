"use client";

import { useEffect, useState } from "react";
import api from "@/app/lib/api";

interface IrrigationLog {
    id: number;
    date: string;
    method: string;
    gallons_applied: number | null;
    soil_moisture_pct_before: number | null;
    soil_moisture_pct_after: number | null;
}

export default function IrrigationHistoryPanel({
    blockId,
    refreshToken,
}: {
    blockId: number | null;
    refreshToken: number;
}) {
    const [logs, setLogs] = useState<IrrigationLog[]>([]);

    useEffect(() => {
        const fetchLogs = async () => {
            if (!blockId) {
                setLogs([]);
                return;
            }
            try {
                const response = await api.get("/agriculture/irrigation-logs/", {
                    params: { block_id: blockId },
                });
                setLogs(response.data);
            } catch (error) {
                console.error("Error loading irrigation history:", error);
                setLogs([]);
            }
        };

        fetchLogs();
    }, [blockId, refreshToken]);

    if (!blockId) {
        return <p className="text-sm" style={{ color: "#6b7280" }}>Select a block to view recent irrigation history.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr style={{ backgroundColor: "#fafafa" }}>
                        <th className="text-left p-3" style={{ color: "#6b7280" }}>Date</th>
                        <th className="text-left p-3" style={{ color: "#6b7280" }}>Method</th>
                        <th className="text-right p-3" style={{ color: "#6b7280" }}>Gallons</th>
                        <th className="text-right p-3" style={{ color: "#6b7280" }}>Before</th>
                        <th className="text-right p-3" style={{ color: "#6b7280" }}>After</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.slice(0, 8).map((log) => (
                        <tr key={log.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                            <td className="p-3" style={{ color: "#171717" }}>{new Date(log.date).toLocaleDateString()}</td>
                            <td className="p-3 capitalize" style={{ color: "#374151" }}>{log.method}</td>
                            <td className="p-3 text-right" style={{ color: "#171717" }}>{log.gallons_applied ?? "--"}</td>
                            <td className="p-3 text-right" style={{ color: "#374151" }}>
                                {log.soil_moisture_pct_before !== null ? `${log.soil_moisture_pct_before}%` : "--"}
                            </td>
                            <td className="p-3 text-right" style={{ color: "#374151" }}>
                                {log.soil_moisture_pct_after !== null ? `${log.soil_moisture_pct_after}%` : "--"}
                            </td>
                        </tr>
                    ))}
                    {logs.length === 0 && (
                        <tr>
                            <td className="p-4 text-sm" style={{ color: "#6b7280" }} colSpan={5}>
                                No irrigation history found for this block.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
