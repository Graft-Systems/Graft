"use client";

import { useEffect, useState } from "react";
import api from "@/app/lib/api";

interface Vineyard {
    id: number;
    name: string;
}

interface Block {
    id: number;
    name: string;
    grape_species: string;
    acres: number | null;
}

interface Props {
    selectedVineyardId: number | null;
    selectedBlockId: number | null;
    onSelectVineyard: (id: number | null) => void;
    onSelectBlock: (id: number | null) => void;
}

export default function IrrigationContextPanel({
    selectedVineyardId,
    selectedBlockId,
    onSelectVineyard,
    onSelectBlock,
}: Props) {
    const [vineyards, setVineyards] = useState<Vineyard[]>([]);
    const [blocks, setBlocks] = useState<Block[]>([]);

    useEffect(() => {
        const fetchVineyards = async () => {
            try {
                const response = await api.get("/agriculture/vineyards/");
                setVineyards(response.data);
            } catch (error) {
                console.error("Error loading vineyards:", error);
                setVineyards([]);
            }
        };

        fetchVineyards();
    }, []);

    useEffect(() => {
        const fetchBlocks = async () => {
            if (!selectedVineyardId) {
                setBlocks([]);
                return;
            }
            try {
                const response = await api.get("/agriculture/blocks/", {
                    params: { vineyard_id: selectedVineyardId },
                });
                setBlocks(response.data);
            } catch (error) {
                console.error("Error loading blocks:", error);
                setBlocks([]);
            }
        };

        fetchBlocks();
    }, [selectedVineyardId]);

    const selectedBlock = blocks.find((block) => block.id === selectedBlockId) ?? null;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "#6b7280" }}>
                        Vineyard
                    </label>
                    <select
                        className="rounded-xl border p-3 text-sm"
                        style={{ borderColor: "#e5e7eb", color: "#171717", backgroundColor: "#ffffff" }}
                        value={selectedVineyardId ?? ""}
                        onChange={(event) => {
                            const value = event.target.value ? Number(event.target.value) : null;
                            onSelectVineyard(value);
                            onSelectBlock(null);
                        }}
                    >
                        <option value="">Select a vineyard</option>
                        {vineyards.map((vineyard) => (
                            <option key={vineyard.id} value={vineyard.id}>{vineyard.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "#6b7280" }}>
                        Block
                    </label>
                    <select
                        className="rounded-xl border p-3 text-sm"
                        style={{ borderColor: "#e5e7eb", color: "#171717", backgroundColor: "#ffffff" }}
                        value={selectedBlockId ?? ""}
                        onChange={(event) => onSelectBlock(event.target.value ? Number(event.target.value) : null)}
                        disabled={!selectedVineyardId}
                    >
                        <option value="">Select a block</option>
                        {blocks.map((block) => (
                            <option key={block.id} value={block.id}>
                                {block.name} · {block.grape_species}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="rounded-2xl p-4" style={{ backgroundColor: "#fafafa", border: "1px solid #f3f4f6" }}>
                {selectedBlock ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                            <p style={{ color: "#6b7280" }}>Block</p>
                            <p className="font-semibold" style={{ color: "#171717" }}>{selectedBlock.name}</p>
                        </div>
                        <div>
                            <p style={{ color: "#6b7280" }}>Variety</p>
                            <p className="font-semibold" style={{ color: "#171717" }}>{selectedBlock.grape_species}</p>
                        </div>
                        <div>
                            <p style={{ color: "#6b7280" }}>Acres</p>
                            <p className="font-semibold" style={{ color: "#171717" }}>
                                {selectedBlock.acres !== null ? selectedBlock.acres : "--"}
                            </p>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm" style={{ color: "#6b7280" }}>
                        Choose a vineyard and block to load soil moisture, irrigation history, and recommendations.
                    </p>
                )}
            </div>
        </div>
    );
}
