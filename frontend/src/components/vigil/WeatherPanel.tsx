"use client";

import React, { useEffect, useState } from "react";
import { Plus, Loader2, CloudRain, Sun, Thermometer } from "lucide-react";
import api from "@/app/lib/api";

interface WeatherRecord {
    id: number;
    vineyard: number;
    date: string;
    source: string;
    temp_high_f: number | null;
    temp_low_f: number | null;
    precipitation_in: number | null;
    humidity_pct: number | null;
    wind_speed_mph: number | null;
    gdd_base50: number | null;
    uv_index: number | null;
}

interface WeatherPanelProps {
    vineyardId: number | null;
}

const emptyForm = {
    source: "observation",
    date: "",
    temp_high_f: "",
    temp_low_f: "",
    precipitation_in: "",
    humidity_pct: "",
    wind_speed_mph: "",
    gdd_base50: "",
    uv_index: "",
};

export default function WeatherPanel({ vineyardId }: WeatherPanelProps) {
    const [records, setRecords] = useState<WeatherRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newRecord, setNewRecord] = useState({ ...emptyForm });

    useEffect(() => {
        if (vineyardId) {
            fetchWeather();
        } else {
            setRecords([]);
            setLoading(false);
        }
    }, [vineyardId]);

    const fetchWeather = async () => {
        setLoading(true);
        try {
            const response = await api.get("/vigil/weather/", { params: { vineyard_id: vineyardId } });
            setRecords(response.data);
        } catch (error) {
            console.error("Error fetching weather:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddRecord = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                vineyard: vineyardId,
                source: newRecord.source,
                date: newRecord.date,
                temp_high_f: newRecord.temp_high_f ? parseFloat(newRecord.temp_high_f) : null,
                temp_low_f: newRecord.temp_low_f ? parseFloat(newRecord.temp_low_f) : null,
                precipitation_in: newRecord.precipitation_in ? parseFloat(newRecord.precipitation_in) : null,
                humidity_pct: newRecord.humidity_pct ? parseFloat(newRecord.humidity_pct) : null,
                wind_speed_mph: newRecord.wind_speed_mph ? parseFloat(newRecord.wind_speed_mph) : null,
                gdd_base50: newRecord.gdd_base50 ? parseFloat(newRecord.gdd_base50) : null,
                uv_index: newRecord.uv_index ? parseFloat(newRecord.uv_index) : null,
            };

            const response = await api.post("/vigil/weather/", payload);
            setRecords([...records, response.data]);
            setShowAddForm(false);
            setNewRecord({ ...emptyForm });
        } catch (error) {
            console.error("Post Error:", error);
            alert("Error adding weather record. Check the console for details.");
        }
    };

    if (!vineyardId) {
        return (
            <div className="flex items-center justify-center p-12 rounded-xl" style={{ backgroundColor: "#fafafa", border: "1px solid #f5f5f5" }}>
                <p style={{ color: "#6b7280" }}>Select a vineyard to view weather data</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin" style={{ color: "#9f1239" }} /></div>
        );
    }

    const today = new Date().toISOString().split("T")[0];
    const forecastData = records
        .filter((r) => r.source === "forecast" && r.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 10);

    const formatDayOfWeek = (dateStr: string) => {
        const date = new Date(dateStr + "T00:00:00");
        return date.toLocaleDateString("en-US", { weekday: "short" });
    };

    const formatShortDate = (dateStr: string) => {
        const date = new Date(dateStr + "T00:00:00");
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold" style={{ color: "#262626" }}>Weather Data</h3>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition shadow-sm"
                    style={{ backgroundColor: "#9f1239", color: "#ffffff" }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#be123c"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#9f1239"}
                >
                    <Plus size={18} /> Add Weather Data
                </button>
            </div>

            {/* 10-Day Forecast Strip */}
            <div className="mb-6">
                <h4 className="text-sm font-semibold mb-3" style={{ color: "#374151" }}>10-Day Forecast</h4>
                {forecastData.length === 0 ? (
                    <div className="p-6 rounded-xl text-center" style={{ backgroundColor: "#fafafa", border: "1px solid #f5f5f5" }}>
                        <p className="text-sm" style={{ color: "#6b7280" }}>No forecast data available. Add weather forecast data below.</p>
                    </div>
                ) : (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {forecastData.map((day) => {
                            const heavyRain = (day.precipitation_in ?? 0) > 0.5;
                            return (
                                <div
                                    key={day.id}
                                    className="flex-shrink-0 p-3 rounded-xl text-center min-w-[100px]"
                                    style={{
                                        backgroundColor: heavyRain ? "#eff6ff" : "#ffffff",
                                        border: heavyRain ? "1px solid #bfdbfe" : "1px solid #f5f5f5",
                                    }}
                                >
                                    <p className="text-xs font-semibold" style={{ color: "#374151" }}>{formatDayOfWeek(day.date)}</p>
                                    <p className="text-xs" style={{ color: "#6b7280" }}>{formatShortDate(day.date)}</p>
                                    <div className="flex items-center justify-center gap-1 mt-2">
                                        <Thermometer size={14} style={{ color: "#9f1239" }} />
                                        <span className="text-sm font-bold" style={{ color: "#171717" }}>
                                            {day.temp_high_f ?? "--"}
                                        </span>
                                        <span className="text-xs" style={{ color: "#6b7280" }}>
                                            / {day.temp_low_f ?? "--"}
                                        </span>
                                    </div>
                                    {(day.precipitation_in ?? 0) > 0 && (
                                        <div className="flex items-center justify-center gap-1 mt-1">
                                            <CloudRain size={12} style={{ color: "#2563eb" }} />
                                            <span className="text-xs" style={{ color: "#2563eb" }}>{day.precipitation_in}&quot;</span>
                                        </div>
                                    )}
                                    {day.humidity_pct != null && (
                                        <p className="text-xs mt-1" style={{ color: "#6b7280" }}>{day.humidity_pct}% hum</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Add Weather Form */}
            {showAddForm && (
                <form onSubmit={handleAddRecord} className="p-4 rounded-xl grid grid-cols-3 gap-4 mb-6" style={{ backgroundColor: "#fafafa", border: "1px solid #ffe4e6" }}>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold" style={{ color: "#374151" }}>Source</label>
                        <select
                            className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                            value={newRecord.source}
                            onChange={(e) => setNewRecord({ ...newRecord, source: e.target.value })}
                            required
                        >
                            <option value="observation">Observation</option>
                            <option value="forecast">Forecast</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold" style={{ color: "#374151" }}>Date</label>
                        <input
                            className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                            type="date"
                            value={newRecord.date}
                            onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold" style={{ color: "#374151" }}>High Temp (F)</label>
                        <input
                            className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                            type="number"
                            step="0.1"
                            placeholder="High F"
                            value={newRecord.temp_high_f}
                            onChange={(e) => setNewRecord({ ...newRecord, temp_high_f: e.target.value })}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold" style={{ color: "#374151" }}>Low Temp (F)</label>
                        <input
                            className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                            type="number"
                            step="0.1"
                            placeholder="Low F"
                            value={newRecord.temp_low_f}
                            onChange={(e) => setNewRecord({ ...newRecord, temp_low_f: e.target.value })}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold" style={{ color: "#374151" }}>Precipitation (in)</label>
                        <input
                            className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                            type="number"
                            step="0.01"
                            placeholder="Precip in"
                            value={newRecord.precipitation_in}
                            onChange={(e) => setNewRecord({ ...newRecord, precipitation_in: e.target.value })}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold" style={{ color: "#374151" }}>Humidity (%)</label>
                        <input
                            className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                            type="number"
                            step="0.1"
                            placeholder="Humidity %"
                            value={newRecord.humidity_pct}
                            onChange={(e) => setNewRecord({ ...newRecord, humidity_pct: e.target.value })}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold" style={{ color: "#374151" }}>Wind Speed (mph)</label>
                        <input
                            className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                            type="number"
                            step="0.1"
                            placeholder="Wind mph"
                            value={newRecord.wind_speed_mph}
                            onChange={(e) => setNewRecord({ ...newRecord, wind_speed_mph: e.target.value })}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold" style={{ color: "#374151" }}>GDD Base 50</label>
                        <input
                            className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                            type="number"
                            step="0.1"
                            placeholder="GDD"
                            value={newRecord.gdd_base50}
                            onChange={(e) => setNewRecord({ ...newRecord, gdd_base50: e.target.value })}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold" style={{ color: "#374151" }}>UV Index</label>
                        <input
                            className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                            type="number"
                            step="0.1"
                            placeholder="UV Index"
                            value={newRecord.uv_index}
                            onChange={(e) => setNewRecord({ ...newRecord, uv_index: e.target.value })}
                        />
                    </div>
                    <div className="col-span-3 flex gap-2">
                        <button type="submit" className="px-4 py-2 rounded-md" style={{ backgroundColor: "#9f1239", color: "#ffffff" }}>Save Record</button>
                        <button type="button" onClick={() => setShowAddForm(false)} style={{ color: "#374151" }}>Cancel</button>
                    </div>
                </form>
            )}

            {/* Weather Data Table */}
            {records.length === 0 ? (
                <div className="p-6 rounded-xl text-center" style={{ backgroundColor: "#fafafa", border: "1px solid #f5f5f5" }}>
                    <Sun size={32} className="mx-auto mb-2" style={{ color: "#9ca3af" }} />
                    <p className="text-sm" style={{ color: "#6b7280" }}>No weather records yet. Add your first entry above.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid #f5f5f5" }}>
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ backgroundColor: "#fafafa" }}>
                                <th className="text-left p-3 font-semibold" style={{ color: "#374151" }}>Date</th>
                                <th className="text-left p-3 font-semibold" style={{ color: "#374151" }}>Source</th>
                                <th className="text-right p-3 font-semibold" style={{ color: "#374151" }}>High F</th>
                                <th className="text-right p-3 font-semibold" style={{ color: "#374151" }}>Low F</th>
                                <th className="text-right p-3 font-semibold" style={{ color: "#374151" }}>Precip (in)</th>
                                <th className="text-right p-3 font-semibold" style={{ color: "#374151" }}>Humidity %</th>
                                <th className="text-right p-3 font-semibold" style={{ color: "#374151" }}>Wind (mph)</th>
                                <th className="text-right p-3 font-semibold" style={{ color: "#374151" }}>GDD 50</th>
                                <th className="text-right p-3 font-semibold" style={{ color: "#374151" }}>UV</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records
                                .sort((a, b) => b.date.localeCompare(a.date))
                                .map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50 transition" style={{ borderTop: "1px solid #f5f5f5" }}>
                                        <td className="p-3" style={{ color: "#171717" }}>{record.date}</td>
                                        <td className="p-3">
                                            <span
                                                className="px-2 py-0.5 rounded-full text-xs font-semibold"
                                                style={
                                                    record.source === "observation"
                                                        ? { backgroundColor: "#dcfce7", color: "#166534" }
                                                        : { backgroundColor: "#dbeafe", color: "#1e40af" }
                                                }
                                            >
                                                {record.source}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right" style={{ color: "#171717" }}>{record.temp_high_f ?? "--"}</td>
                                        <td className="p-3 text-right" style={{ color: "#171717" }}>{record.temp_low_f ?? "--"}</td>
                                        <td className="p-3 text-right" style={{ color: "#171717" }}>{record.precipitation_in ?? "--"}</td>
                                        <td className="p-3 text-right" style={{ color: "#171717" }}>{record.humidity_pct ?? "--"}</td>
                                        <td className="p-3 text-right" style={{ color: "#171717" }}>{record.wind_speed_mph ?? "--"}</td>
                                        <td className="p-3 text-right" style={{ color: "#171717" }}>{record.gdd_base50 ?? "--"}</td>
                                        <td className="p-3 text-right" style={{ color: "#171717" }}>{record.uv_index ?? "--"}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
