"use client";

import React, { useEffect, useState } from "react";
import { Plus, Grape, Loader2, X } from "lucide-react";
import api from "@/app/lib/api";

interface DiseaseSusceptibility {
    [disease: string]: string; // "high" | "moderate" | "low"
}

interface SpeciesProfile {
    id: number;
    species_name: string;
    avg_cluster_weight_g: number | null;
    avg_clusters_per_vine: number | null;
    avg_berries_per_cluster: number | null;
    avg_berry_weight_g: number | null;
    typical_yield_tons_per_acre: number | null;
    rain_swell_factor: number | null;
    heat_stress_threshold_f: number | null;
    optimal_gdd_range_low: number | null;
    optimal_gdd_range_high: number | null;
    disease_susceptibility: DiseaseSusceptibility;
    notes: string;
}

const SUSCEPTIBILITY_COLORS: Record<string, { bg: string; text: string }> = {
    high: { bg: "#fef2f2", text: "#dc2626" },
    moderate: { bg: "#fffbeb", text: "#d97706" },
    low: { bg: "#f0fdf4", text: "#16a34a" },
};

export default function SpeciesProfilePanel() {
    const [profiles, setProfiles] = useState<SpeciesProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);

    const [newProfile, setNewProfile] = useState({
        species_name: "",
        avg_cluster_weight_g: "",
        avg_clusters_per_vine: "",
        avg_berries_per_cluster: "",
        avg_berry_weight_g: "",
        typical_yield_tons_per_acre: "",
        rain_swell_factor: "1.000",
        heat_stress_threshold_f: "",
        optimal_gdd_range_low: "",
        optimal_gdd_range_high: "",
        notes: "",
    });

    const [diseaseEntries, setDiseaseEntries] = useState<{ disease: string; level: string }[]>([]);

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        try {
            const response = await api.get("/vigil/species-profiles/");
            setProfiles(response.data);
        } catch (error) {
            console.error("Error fetching species profiles:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const susceptibility: DiseaseSusceptibility = {};
            diseaseEntries.forEach((entry) => {
                if (entry.disease.trim()) {
                    susceptibility[entry.disease.trim()] = entry.level;
                }
            });

            const payload = {
                species_name: newProfile.species_name,
                avg_cluster_weight_g: newProfile.avg_cluster_weight_g ? parseFloat(newProfile.avg_cluster_weight_g) : null,
                avg_clusters_per_vine: newProfile.avg_clusters_per_vine ? parseInt(newProfile.avg_clusters_per_vine) : null,
                avg_berries_per_cluster: newProfile.avg_berries_per_cluster ? parseInt(newProfile.avg_berries_per_cluster) : null,
                avg_berry_weight_g: newProfile.avg_berry_weight_g ? parseFloat(newProfile.avg_berry_weight_g) : null,
                typical_yield_tons_per_acre: newProfile.typical_yield_tons_per_acre ? parseFloat(newProfile.typical_yield_tons_per_acre) : null,
                rain_swell_factor: newProfile.rain_swell_factor ? parseFloat(newProfile.rain_swell_factor) : 1.0,
                heat_stress_threshold_f: newProfile.heat_stress_threshold_f ? parseFloat(newProfile.heat_stress_threshold_f) : null,
                optimal_gdd_range_low: newProfile.optimal_gdd_range_low ? parseInt(newProfile.optimal_gdd_range_low) : null,
                optimal_gdd_range_high: newProfile.optimal_gdd_range_high ? parseInt(newProfile.optimal_gdd_range_high) : null,
                disease_susceptibility: susceptibility,
                notes: newProfile.notes,
            };

            const response = await api.post("/vigil/species-profiles/", payload);
            setProfiles([...profiles, response.data]);
            setShowAddForm(false);
            setNewProfile({
                species_name: "",
                avg_cluster_weight_g: "",
                avg_clusters_per_vine: "",
                avg_berries_per_cluster: "",
                avg_berry_weight_g: "",
                typical_yield_tons_per_acre: "",
                rain_swell_factor: "1.000",
                heat_stress_threshold_f: "",
                optimal_gdd_range_low: "",
                optimal_gdd_range_high: "",
                notes: "",
            });
            setDiseaseEntries([]);
        } catch (error) {
            console.error("Post Error:", error);
            alert("Error adding species profile. Check the console for details.");
        }
    };

    const addDiseaseEntry = () => {
        setDiseaseEntries([...diseaseEntries, { disease: "", level: "moderate" }]);
    };

    const updateDiseaseEntry = (index: number, field: "disease" | "level", value: string) => {
        const updated = [...diseaseEntries];
        updated[index][field] = value;
        setDiseaseEntries(updated);
    };

    const removeDiseaseEntry = (index: number) => {
        setDiseaseEntries(diseaseEntries.filter((_, i) => i !== index));
    };

    const renderStatRow = (label: string, value: string | null | undefined) => {
        if (value === null || value === undefined || value === "") return null;
        return (
            <div className="flex justify-between items-center py-1">
                <span className="text-xs" style={{ color: "#6b7280" }}>{label}</span>
                <span className="text-sm font-medium" style={{ color: "#171717" }}>{value}</span>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold" style={{ color: "#262626" }}>Species Profiles</h3>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition shadow-sm"
                    style={{ backgroundColor: "#9f1239", color: "#ffffff" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#be123c")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#9f1239")}
                >
                    <Plus size={18} /> Add Species Profile
                </button>
            </div>

            {/* Add Species Profile Form */}
            {showAddForm && (
                <form onSubmit={handleAddProfile} className="p-4 rounded-xl grid grid-cols-2 gap-4 mb-6" style={{ backgroundColor: "#fafafa", border: "1px solid #ffe4e6" }}>
                    <input
                        className="p-2 border rounded-md col-span-2 placeholder:text-gray-500 text-gray-900"
                        placeholder="Species Name (required)"
                        value={newProfile.species_name}
                        onChange={(e) => setNewProfile({ ...newProfile, species_name: e.target.value })}
                        required
                    />
                    <input
                        className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                        type="number"
                        step="0.01"
                        placeholder="Avg Cluster Weight (g)"
                        value={newProfile.avg_cluster_weight_g}
                        onChange={(e) => setNewProfile({ ...newProfile, avg_cluster_weight_g: e.target.value })}
                    />
                    <input
                        className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                        type="number"
                        placeholder="Avg Clusters per Vine"
                        value={newProfile.avg_clusters_per_vine}
                        onChange={(e) => setNewProfile({ ...newProfile, avg_clusters_per_vine: e.target.value })}
                    />
                    <input
                        className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                        type="number"
                        placeholder="Avg Berries per Cluster"
                        value={newProfile.avg_berries_per_cluster}
                        onChange={(e) => setNewProfile({ ...newProfile, avg_berries_per_cluster: e.target.value })}
                    />
                    <input
                        className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                        type="number"
                        step="0.01"
                        placeholder="Avg Berry Weight (g)"
                        value={newProfile.avg_berry_weight_g}
                        onChange={(e) => setNewProfile({ ...newProfile, avg_berry_weight_g: e.target.value })}
                    />
                    <input
                        className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                        type="number"
                        step="0.01"
                        placeholder="Typical Yield (tons/acre)"
                        value={newProfile.typical_yield_tons_per_acre}
                        onChange={(e) => setNewProfile({ ...newProfile, typical_yield_tons_per_acre: e.target.value })}
                    />
                    <input
                        className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                        type="number"
                        step="0.001"
                        placeholder="Rain Swell Factor (default 1.000)"
                        value={newProfile.rain_swell_factor}
                        onChange={(e) => setNewProfile({ ...newProfile, rain_swell_factor: e.target.value })}
                    />
                    <input
                        className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                        type="number"
                        step="0.1"
                        placeholder="Heat Stress Threshold (F)"
                        value={newProfile.heat_stress_threshold_f}
                        onChange={(e) => setNewProfile({ ...newProfile, heat_stress_threshold_f: e.target.value })}
                    />
                    <input
                        className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                        type="number"
                        placeholder="Optimal GDD Low"
                        value={newProfile.optimal_gdd_range_low}
                        onChange={(e) => setNewProfile({ ...newProfile, optimal_gdd_range_low: e.target.value })}
                    />
                    <input
                        className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                        type="number"
                        placeholder="Optimal GDD High"
                        value={newProfile.optimal_gdd_range_high}
                        onChange={(e) => setNewProfile({ ...newProfile, optimal_gdd_range_high: e.target.value })}
                    />
                    <textarea
                        className="p-2 border rounded-md col-span-2 placeholder:text-gray-500 text-gray-900"
                        placeholder="Notes"
                        rows={2}
                        value={newProfile.notes}
                        onChange={(e) => setNewProfile({ ...newProfile, notes: e.target.value })}
                    />

                    {/* Disease Susceptibility Key-Value Editor */}
                    <div className="col-span-2 space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-semibold" style={{ color: "#374151" }}>Disease Susceptibility</label>
                            <button
                                type="button"
                                onClick={addDiseaseEntry}
                                className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md transition"
                                style={{ color: "#9f1239", backgroundColor: "#fff1f2" }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#ffe4e6")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fff1f2")}
                            >
                                <Plus size={14} /> Add Disease
                            </button>
                        </div>
                        {diseaseEntries.map((entry, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                                <input
                                    className="p-2 border rounded-md flex-1 placeholder:text-gray-500 text-gray-900"
                                    placeholder="Disease name (e.g. powdery_mildew)"
                                    value={entry.disease}
                                    onChange={(e) => updateDiseaseEntry(idx, "disease", e.target.value)}
                                />
                                <select
                                    className="p-2 border rounded-md placeholder:text-gray-500 text-gray-900"
                                    value={entry.level}
                                    onChange={(e) => updateDiseaseEntry(idx, "level", e.target.value)}
                                >
                                    <option value="low">Low</option>
                                    <option value="moderate">Moderate</option>
                                    <option value="high">High</option>
                                </select>
                                <button
                                    type="button"
                                    onClick={() => removeDiseaseEntry(idx)}
                                    className="p-1 rounded-md hover:bg-gray-100 transition"
                                    style={{ color: "#6b7280" }}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                        {diseaseEntries.length === 0 && (
                            <p className="text-xs" style={{ color: "#6b7280" }}>No disease entries added yet. Click &quot;Add Disease&quot; to begin.</p>
                        )}
                    </div>

                    <div className="col-span-2 flex gap-2">
                        <button type="submit" className="px-4 py-2 rounded-md" style={{ backgroundColor: "#9f1239", color: "#ffffff" }}>Save Profile</button>
                        <button type="button" onClick={() => setShowAddForm(false)} style={{ color: "#374151" }}>Cancel</button>
                    </div>
                </form>
            )}

            {/* Species Profiles Grid */}
            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin" style={{ color: "#9f1239" }} /></div>
            ) : profiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 rounded-xl" style={{ backgroundColor: "#fafafa", border: "1px solid #f5f5f5" }}>
                    <Grape size={40} style={{ color: "#9ca3af" }} />
                    <p className="mt-4 text-sm" style={{ color: "#6b7280" }}>No species profiles yet. Add one to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profiles.map((profile) => (
                        <div
                            key={profile.id}
                            className="p-5 rounded-xl hover:shadow-md transition"
                            style={{ backgroundColor: "#ffffff", border: "1px solid #f5f5f5" }}
                        >
                            {/* Header */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-full" style={{ backgroundColor: "#fff1f2", color: "#9f1239" }}>
                                    <Grape size={20} />
                                </div>
                                <h4 className="text-lg font-bold" style={{ color: "#171717" }}>{profile.species_name}</h4>
                            </div>

                            {/* Stats */}
                            <div className="space-y-1 mb-4" style={{ borderBottom: "1px solid #f5f5f5", paddingBottom: "12px" }}>
                                {renderStatRow("Avg Cluster Weight", profile.avg_cluster_weight_g !== null ? `${profile.avg_cluster_weight_g}g` : null)}
                                {renderStatRow("Clusters / Vine", profile.avg_clusters_per_vine !== null ? `${profile.avg_clusters_per_vine}` : null)}
                                {renderStatRow("Berries / Cluster", profile.avg_berries_per_cluster !== null ? `${profile.avg_berries_per_cluster}` : null)}
                                {renderStatRow("Avg Berry Weight", profile.avg_berry_weight_g !== null ? `${profile.avg_berry_weight_g}g` : null)}
                                {renderStatRow("Typical Yield", profile.typical_yield_tons_per_acre !== null ? `${profile.typical_yield_tons_per_acre} t/acre` : null)}
                                {renderStatRow("Rain Swell Factor", profile.rain_swell_factor !== null ? `x${profile.rain_swell_factor}` : null)}
                                {renderStatRow("Heat Stress Threshold", profile.heat_stress_threshold_f !== null ? `${profile.heat_stress_threshold_f}F` : null)}
                                {renderStatRow(
                                    "GDD Range",
                                    profile.optimal_gdd_range_low !== null && profile.optimal_gdd_range_high !== null
                                        ? `${profile.optimal_gdd_range_low} - ${profile.optimal_gdd_range_high}`
                                        : null
                                )}
                            </div>

                            {/* Disease Susceptibility */}
                            {profile.disease_susceptibility && Object.keys(profile.disease_susceptibility).length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold mb-2" style={{ color: "#6b7280" }}>Disease Susceptibility</p>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(profile.disease_susceptibility).map(([disease, level]) => {
                                            const colors = SUSCEPTIBILITY_COLORS[level] || SUSCEPTIBILITY_COLORS.moderate;
                                            return (
                                                <span
                                                    key={disease}
                                                    className="px-2 py-1 rounded-full text-xs font-medium"
                                                    style={{ backgroundColor: colors.bg, color: colors.text }}
                                                >
                                                    {disease.replace(/_/g, " ")}: {level}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {profile.notes && (
                                <p className="mt-3 text-xs" style={{ color: "#6b7280" }}>{profile.notes}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
