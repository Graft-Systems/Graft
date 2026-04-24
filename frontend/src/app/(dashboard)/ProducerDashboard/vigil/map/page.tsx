"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import Sidebar from "@/components/dashboard/Sidebar";
import api from "@/app/lib/api";

type FeatureCollection = {
    type: "FeatureCollection";
    features: Array<{
        type: "Feature";
        id: string;
        geometry: GeoJSON.Geometry;
        properties: Record<string, string>;
    }>;
};

type LayersResponse = {
    vineyard: { id: string; name: string };
    blocks: FeatureCollection;
    rows: FeatureCollection;
    vines: FeatureCollection;
};

type AggregateResponse = {
    unit_preference: "g" | "lbs";
    totals: { yield_g: number; yield_lbs: number; photo_count: number };
    confidence: { mean_g: number; stddev_g: number; avg_confidence_score: number };
    clone_breakdown: Array<{ clone_type: string; yield_g: number }>;
};

type VinePhotoResponse = {
    vine_id: string;
    photo_id: string;
    captured_at: string;
    image_url: string;
    yield_estimate: { yield_g_mean: number; yield_g_stddev: number; confidence_score: number; cluster_estimate?: number };
};

type AnyFeature = GeoJSON.Feature<GeoJSON.Geometry, { id?: string }>;

function ConfidenceDistribution({ mean, stddev }: { mean: number; stddev: number }) {
    const safeStd = Math.max(stddev, 1);
    const width = 420;
    const height = 140;
    const baseline = 110;
    const leftPad = 16;
    const rightPad = 16;
    const chartWidth = width - leftPad - rightPad;
    const maxPdf = 1 / (safeStd * Math.sqrt(2 * Math.PI));
    const points = Array.from({ length: 64 }, (_, idx) => {
        const t = idx / 63;
        const xVal = mean + (t - 0.5) * 6 * safeStd;
        const pdf = (1 / (safeStd * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((xVal - mean) / safeStd) ** 2);
        const normalized = pdf / maxPdf;
        const x = leftPad + t * chartWidth;
        const y = baseline - normalized * 84;
        return `${x},${y}`;
    }).join(" ");

    const meanX = leftPad + chartWidth / 2;
    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36">
            <polyline fill="none" stroke="#6366f1" strokeWidth="3" points={points} />
            <line x1={leftPad} y1={baseline} x2={width - rightPad} y2={baseline} stroke="#d4d4d8" strokeWidth="1" />
            <line x1={meanX} y1={22} x2={meanX} y2={baseline} stroke="#dc2626" strokeWidth="2" strokeDasharray="4 4" />
            <text x={meanX + 6} y={20} fontSize="11" fill="#52525b">
                mean {mean.toFixed(1)}g
            </text>
        </svg>
    );
}

export default function VigilGeoYieldDemoPage() {
    const [layers, setLayers] = useState<LayersResponse | null>(null);
    const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
    const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
    const [selectedVineIds, setSelectedVineIds] = useState<string[]>([]);
    const [aggregate, setAggregate] = useState<AggregateResponse | null>(null);
    const [latestPhoto, setLatestPhoto] = useState<VinePhotoResponse | null>(null);
    const [activeVineIndex, setActiveVineIndex] = useState(0);
    const [unitPreference, setUnitPreference] = useState<"g" | "lbs">("g");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const mapContainerId = "vigil-geo-demo-map";
    const mapRef = useRef<L.Map | null>(null);
    const blockLayerRef = useRef<L.GeoJSON | null>(null);
    const rowLayerRef = useRef<L.GeoJSON | null>(null);
    const vineLayerRef = useRef<L.GeoJSON | null>(null);
    useEffect(() => {
        const bootstrap = async () => {
            setLoading(true);
            try {
                const response = await api.get("/vigil/demo-geoyield/layers/");
                setLayers(response.data as LayersResponse);
            } catch (fetchError) {
                console.error(fetchError);
                setError("Failed to load synthetic geo-yield layers.");
            } finally {
                setLoading(false);
            }
        };
        bootstrap();
    }, []);

    useEffect(() => {
        const refreshAggregate = async () => {
            if (!selectedBlockIds.length && !selectedRowIds.length && !selectedVineIds.length) {
                setAggregate(null);
                return;
            }
            try {
                const response = await api.post("/vigil/demo-geoyield/aggregate/", {
                    block_ids: selectedBlockIds,
                    row_ids: selectedRowIds,
                    vine_ids: selectedVineIds,
                    unit_preference: unitPreference,
                });
                setAggregate(response.data as AggregateResponse);
            } catch (fetchError) {
                console.error(fetchError);
                setError("Failed to aggregate selected region.");
            }
        };
        refreshAggregate();
    }, [selectedBlockIds, selectedRowIds, selectedVineIds, unitPreference]);

    useEffect(() => {
        if (!selectedBlockIds.length && !selectedRowIds.length && !selectedVineIds.length) {
            setLatestPhoto(null);
            setActiveVineIndex(0);
        }
    }, [selectedBlockIds, selectedRowIds, selectedVineIds]);

    useEffect(() => {
        if (!selectedVineIds.length) {
            setActiveVineIndex(0);
            return;
        }
        if (activeVineIndex >= selectedVineIds.length) {
            setActiveVineIndex(selectedVineIds.length - 1);
        }
    }, [selectedVineIds, activeVineIndex]);

    useEffect(() => {
        const fetchActiveVinePhoto = async () => {
            if (!selectedVineIds.length) {
                setLatestPhoto(null);
                return;
            }
            const targetVineId = selectedVineIds[activeVineIndex] ?? selectedVineIds[selectedVineIds.length - 1];
            if (!targetVineId) {
                setLatestPhoto(null);
                return;
            }
            try {
                const response = await api.get(`/vigil/demo-geoyield/vines/${targetVineId}/latest-photo/`);
                setLatestPhoto(response.data as VinePhotoResponse);
            } catch (fetchError) {
                console.error(fetchError);
            }
        };
        void fetchActiveVinePhoto();
    }, [selectedVineIds, activeVineIndex]);

    const selectedFeatureIds = useMemo(() => {
        if (!layers) return [];
        const allFeatures = [...layers.blocks.features, ...layers.rows.features];
        return allFeatures
            .map((feature) => String(feature.properties.id ?? feature.id))
            .filter((id) => selectedBlockIds.includes(id) || selectedRowIds.includes(id));
    }, [layers, selectedBlockIds, selectedRowIds]);

    useEffect(() => {
        if (mapRef.current) return;
        const container = document.getElementById(mapContainerId);
        if (!container) return;

        const map = L.map(mapContainerId, {
            center: [38.501, -122.427],
            zoom: 14,
            zoomControl: true,
        });

        L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
            attribution: "Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
        }).addTo(map);

        mapRef.current = map;

        return () => {
            blockLayerRef.current?.remove();
            rowLayerRef.current?.remove();
            vineLayerRef.current?.remove();
            map.remove();
            mapRef.current = null;
            blockLayerRef.current = null;
            rowLayerRef.current = null;
            vineLayerRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!layers || !mapRef.current) return;

        blockLayerRef.current?.remove();
        rowLayerRef.current?.remove();
        vineLayerRef.current?.remove();

        const blockLayer = L.geoJSON(layers.blocks as unknown as GeoJSON.FeatureCollection, {
            style: (feature?: AnyFeature) => {
                const id = String(feature?.properties?.id ?? "");
                const isSelected = selectedFeatureIds.includes(id);
                return {
                    color: isSelected ? "#dc2626" : "#7c3aed",
                    weight: isSelected ? 5 : 2,
                    fillOpacity: 0,
                };
            },
            onEachFeature: (feature: AnyFeature, layer: L.Layer) => {
                layer.on("click", (event: L.LeafletMouseEvent) => {
                    const id = String(feature.properties?.id ?? "");
                    if (!id) return;
                    void selectFeature({ id, level: "block", multi: Boolean(event.originalEvent.shiftKey) });
                });
            },
        }).addTo(mapRef.current);

        const rowLayer = L.geoJSON(layers.rows as unknown as GeoJSON.FeatureCollection, {
            style: (feature?: AnyFeature) => {
                const id = String(feature?.properties?.id ?? "");
                const isSelected = selectedFeatureIds.includes(id);
                return {
                    color: isSelected ? "#dc2626" : "#0ea5e9",
                    weight: isSelected ? 5 : 2,
                    fillOpacity: 0,
                };
            },
            onEachFeature: (feature: AnyFeature, layer: L.Layer) => {
                layer.on("click", (event: L.LeafletMouseEvent) => {
                    const id = String(feature.properties?.id ?? "");
                    if (!id) return;
                    void selectFeature({ id, level: "row", multi: Boolean(event.originalEvent.shiftKey) });
                });
            },
        }).addTo(mapRef.current);

        const vineLayer = L.geoJSON(layers.vines as unknown as GeoJSON.FeatureCollection, {
            pointToLayer: (feature: AnyFeature, latlng: L.LatLng) => {
                const id = String(feature?.properties?.id ?? "");
                const isSelected = selectedVineIds.includes(id);
                return L.circleMarker(latlng, {
                    radius: isSelected ? 7 : 5,
                    color: isSelected ? "#dc2626" : "#111827",
                    fillColor: isSelected ? "#dc2626" : "#111827",
                    fillOpacity: 1,
                    weight: isSelected ? 3 : 1,
                });
            },
            onEachFeature: (feature: AnyFeature, layer: L.Layer) => {
                layer.on("click", (event: L.LeafletMouseEvent) => {
                    const id = String(feature.properties?.id ?? "");
                    if (!id) return;
                    void selectFeature({ id, level: "vine", multi: Boolean(event.originalEvent.shiftKey) });
                });
            },
        }).addTo(mapRef.current);

        blockLayerRef.current = blockLayer;
        rowLayerRef.current = rowLayer;
        vineLayerRef.current = vineLayer;
    }, [layers, selectedFeatureIds, selectedVineIds]);

    const selectFeature = async (feature: { id: string; level: string; multi: boolean }) => {
        const id = feature.id;
        if (feature.level === "block") {
            if (feature.multi) {
                setSelectedBlockIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
            } else {
                setSelectedBlockIds((prev) => (prev.length === 1 && prev[0] === id ? [] : [id]));
            }
            return;
        }
        if (feature.level === "row") {
            if (feature.multi) {
                setSelectedRowIds((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]));
            } else {
                setSelectedRowIds((prev) => (prev.length === 1 && prev[0] === id ? [] : [id]));
            }
            return;
        }
        const isSelected = selectedVineIds.includes(id);
        // Vine points support direct multi-select toggle without requiring Shift.
        const nextVineIds = isSelected ? selectedVineIds.filter((value) => value !== id) : [...selectedVineIds, id];
        setSelectedVineIds(nextVineIds);
        if (!nextVineIds.length) {
            setLatestPhoto(null);
            return;
        }
        const nextIndex = isSelected ? Math.max(0, Math.min(activeVineIndex, nextVineIds.length - 1)) : nextVineIds.indexOf(id);
        setActiveVineIndex(nextIndex >= 0 ? nextIndex : 0);
    };

    const displayedYield = unitPreference === "g" ? (aggregate?.totals.yield_g ?? 0) : (aggregate?.totals.yield_lbs ?? 0);

    return (
        <div className="min-h-screen flex bg-neutral-50">
            <Sidebar />
            <div className="flex-1 p-6 space-y-5 max-w-[1400px]">
                <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-rose-700">Vigil Geo Yield</p>
                            <h1 className="text-2xl font-bold text-neutral-900 mt-1">Geospatial Yield</h1>
                            <p className="text-sm text-neutral-600">
                            {layers?.vineyard?.name ? `${layers.vineyard.name}: ` : ""}
                            click block/row/vine to outline selection and aggregate yield.
                            </p>
                        </div>
                        <button
                            className="px-3 py-2 text-sm rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                            onClick={() => {
                                setSelectedBlockIds([]);
                                setSelectedRowIds([]);
                                setSelectedVineIds([]);
                                setLatestPhoto(null);
                            }}
                        >
                            Clear Selection
                        </button>
                    </div>
                </div>

                {error ? <p className="text-sm text-red-700">{error}</p> : null}
                {loading ? <p className="text-sm text-neutral-600">Loading synthetic vineyard layers...</p> : null}

                <div className="rounded-2xl overflow-hidden border border-neutral-200 bg-white shadow-sm">
                    <div id={mapContainerId} style={{ width: "100%", height: 520 }} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-neutral-200 border-t-4 border-t-rose-500 bg-white p-6 md:p-7 shadow-sm min-h-[150px]">
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-xs uppercase tracking-wide text-rose-700">Total Yield</p>
                            <div className="inline-flex border border-neutral-200 rounded-lg overflow-hidden bg-neutral-100/60">
                                <button
                                    className={`px-3 py-1.5 text-xs font-medium ${unitPreference === "g" ? "bg-rose-700 text-white" : "bg-transparent text-neutral-700"}`}
                                    onClick={() => setUnitPreference("g")}
                                >
                                    g
                                </button>
                                <button
                                    className={`px-3 py-1.5 text-xs font-medium ${unitPreference === "lbs" ? "bg-rose-700 text-white" : "bg-transparent text-neutral-700"}`}
                                    onClick={() => setUnitPreference("lbs")}
                                >
                                    lbs
                                </button>
                            </div>
                        </div>
                        <p className="mt-3 text-4xl font-bold text-neutral-900">
                            {displayedYield.toLocaleString(undefined, {
                                minimumFractionDigits: unitPreference === "g" ? 0 : 3,
                                maximumFractionDigits: unitPreference === "g" ? 2 : 3,
                            })}{" "}
                            <span className="text-2xl font-semibold text-neutral-500">{unitPreference}</span>
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                            {(aggregate?.totals.yield_g ?? 0).toFixed(2)} g / {(aggregate?.totals.yield_lbs ?? 0).toFixed(3)} lbs
                        </p>
                    </div>
                    <div className="rounded-2xl border border-neutral-200 border-t-4 border-t-rose-500 bg-white p-6 md:p-7 shadow-sm min-h-[150px]">
                        <p className="text-xs uppercase tracking-wide text-rose-700">Photos Counted</p>
                        <p className="mt-3 text-4xl font-bold text-neutral-900">{aggregate?.totals.photo_count ?? 0}</p>
                        <p className="text-xs text-neutral-500 mt-1">Photos within active selection geometry</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-neutral-200 border-t-4 border-t-rose-500 bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold text-rose-700 mb-2">Clone Breakdown</p>
                        {aggregate?.clone_breakdown?.length ? (
                            <ul className="space-y-2 text-sm text-neutral-700">
                                {aggregate.clone_breakdown.map((item) => (
                                    <li key={item.clone_type} className="flex items-center justify-between rounded-lg border border-neutral-200/80 bg-neutral-50 px-3 py-2">
                                        <span className="font-medium text-neutral-800">{item.clone_type}</span>
                                        <span className="text-neutral-600">{item.yield_g.toFixed(2)} g</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-neutral-500">Select a block, row, or vine to view clone totals.</p>
                        )}
                    </div>
                    <div className="rounded-2xl border border-neutral-200 border-t-4 border-t-rose-500 bg-white p-5 shadow-sm">
                        <p className="text-sm font-semibold text-rose-700 mb-2">Confidence Distribution</p>
                        {aggregate ? (
                            <div>
                                <ConfidenceDistribution mean={aggregate.confidence.mean_g} stddev={aggregate.confidence.stddev_g} />
                                <p className="text-xs text-neutral-600">
                                    mean {aggregate.confidence.mean_g.toFixed(2)}g, stddev {aggregate.confidence.stddev_g.toFixed(2)}g, avg confidence{" "}
                                    {aggregate.confidence.avg_confidence_score.toFixed(3)}
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-neutral-500">Select a region to visualize the confidence distribution.</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-neutral-200 border-t-4 border-t-rose-500 bg-white p-5 shadow-sm">
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-rose-700">Vine Deep Dive</p>
                            {selectedVineIds.length > 1 ? (
                                <div className="inline-flex items-center gap-2">
                                    <button
                                        type="button"
                                        className="rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-100"
                                        onClick={() => setActiveVineIndex((prev) => (prev - 1 + selectedVineIds.length) % selectedVineIds.length)}
                                    >
                                        Prev
                                    </button>
                                    <span className="text-xs text-neutral-500">
                                        {activeVineIndex + 1} / {selectedVineIds.length}
                                    </span>
                                    <button
                                        type="button"
                                        className="rounded-md border border-neutral-300 px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-100"
                                        onClick={() => setActiveVineIndex((prev) => (prev + 1) % selectedVineIds.length)}
                                    >
                                        Next
                                    </button>
                                </div>
                            ) : null}
                        </div>
                        {latestPhoto ? (
                            <div className="space-y-2">
                                <div className="relative w-full h-64 rounded-xl overflow-hidden border border-neutral-200 bg-linear-to-b from-neutral-50 to-neutral-100">
                                    <Image src={latestPhoto.image_url} alt="Latest vine photo" fill unoptimized className="object-contain" />
                                </div>
                                <p className="text-xs text-neutral-600">Captured: {new Date(latestPhoto.captured_at).toLocaleString()}</p>
                                <p className="text-sm text-neutral-700">
                                    Estimate: {latestPhoto.yield_estimate.yield_g_mean.toFixed(2)}g +/- {latestPhoto.yield_estimate.yield_g_stddev.toFixed(2)}g
                                </p>
                                {typeof latestPhoto.yield_estimate.cluster_estimate === "number" && latestPhoto.yield_estimate.cluster_estimate > 0 ? (
                                    <p className="text-xs text-neutral-600">
                                        Cluster estimate used: {latestPhoto.yield_estimate.cluster_estimate.toFixed(1)} clusters
                                    </p>
                                ) : null}
                                <p className="text-xs text-neutral-500">Photo history timeline for this vine is planned and scaffolded for next iteration.</p>
                            </div>
                        ) : (
                            <p className="text-sm text-neutral-500">Click a vine point to show latest photo.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
