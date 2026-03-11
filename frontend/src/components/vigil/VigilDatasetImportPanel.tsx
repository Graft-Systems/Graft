"use client";

import React, { useEffect, useRef, useState } from "react";
import { Database, FolderUp, Loader2, FlaskConical, CheckCircle2, HardDriveUpload } from "lucide-react";
import api from "@/app/lib/api";

interface DatasetDefinition {
    key: string;
    name: string;
    description: string;
    supports_folder_upload: boolean;
    supports_bundled_source: boolean;
    bundled_root_available: boolean;
    max_files: number;
    expected_format: {
        ground_truth_csv?: string;
        color_images?: string;
        depth_metadata?: string;
        ground_truth_columns?: string[];
    };
}

interface ImportResult {
    dataset_key: string;
    dataset_name: string;
    source_label: string;
    imported_samples: number;
    skipped_samples: number;
    total_candidate_rows: number;
    capped_files: boolean;
    available_training_samples: number;
    trained_model?: {
        id: number;
        name: string;
        version: number;
        training_sample_count?: number;
    };
}

interface Props {
    onImportComplete?: () => void;
}

type DirectoryFile = File & { webkitRelativePath?: string };

export default function VigilDatasetImportPanel({ onImportComplete }: Props) {
    const [datasets, setDatasets] = useState<DatasetDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<DirectoryFile[]>([]);
    const [trainAfterImport, setTrainAfterImport] = useState(true);
    const [modelName, setModelName] = useState("GrapesNet Model");
    const [notes, setNotes] = useState("");
    const [result, setResult] = useState<ImportResult | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const folderInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        fetchDatasets();
    }, []);

    useEffect(() => {
        if (folderInputRef.current) {
            folderInputRef.current.setAttribute("webkitdirectory", "");
            folderInputRef.current.setAttribute("directory", "");
        }
    }, [folderInputRef.current]);

    const fetchDatasets = async () => {
        setLoading(true);
        try {
            const response = await api.get("/vigil/ml/datasets/");
            setDatasets(response.data);
        } catch (error) {
            console.error("Error loading dataset definitions:", error);
        } finally {
            setLoading(false);
        }
    };

    const grapesNet = datasets.find((dataset) => dataset.key === "grapesnet") || null;
    const prioritizeGrapesNetFiles = (files: DirectoryFile[], maxFiles: number) => {
        const normalized = files.map((file, index) => {
            const relativePath = (file.webkitRelativePath || file.name).replace(/\\/g, "/");
            let priority = 99;
            const lowered = relativePath.toLowerCase();

            if (lowered.endsWith("dataset 4/rgb-d/ground truth for dataset 4.csv")) priority = 0;
            else if (lowered.includes("dataset 4/rgb-d/") && lowered.endsWith("_color.png")) priority = 1;
            else if (lowered.includes("dataset 4/rgb/") && lowered.endsWith("_color.png")) priority = 2;
            else if (lowered.includes("dataset 4/rgb-d/") && lowered.endsWith("_depth_metadata.csv")) priority = 3;
            else if (lowered.includes("dataset 4/rgb-d/") && lowered.endsWith("_depth.png")) priority = 4;
            else if (lowered.includes("dataset 4/rgb-d/") && lowered.endsWith("_depth.raw")) priority = 5;

            return { file, relativePath, priority, index };
        });

        const relevant = normalized
            .filter((item) => item.priority < 99)
            .sort((left, right) => (left.priority - right.priority) || (left.index - right.index));

        return relevant.slice(0, maxFiles).map((item) => item.file);
    };

    const cappedSelection = grapesNet ? prioritizeGrapesNetFiles(selectedFiles, grapesNet.max_files) : selectedFiles;
    const selectionWasCapped = grapesNet ? selectedFiles.length > cappedSelection.length : false;

    const handleFolderSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []) as DirectoryFile[];
        setSelectedFiles(files);
        setResult(null);
        setErrorMessage(null);
    };

    const submitImport = async (sourceMode: "upload" | "bundled") => {
        if (!grapesNet) return;
        setSubmitting(true);
        setResult(null);
        setErrorMessage(null);
        try {
            if (sourceMode === "upload") {
                if (cappedSelection.length === 0) {
                    alert("Choose a GrapesNet dataset folder before importing.");
                    setSubmitting(false);
                    return;
                }

                const formData = new FormData();
                const relativePaths = cappedSelection.map((file) => file.webkitRelativePath || file.name);
                cappedSelection.forEach((file) => {
                    formData.append("files", file);
                });
                formData.append("relative_paths", JSON.stringify(relativePaths));
                formData.append("source_mode", "upload");
                formData.append("train_after_import", String(trainAfterImport));
                formData.append("model_name", modelName);
                formData.append("notes", notes);
                formData.append("max_files", String(grapesNet.max_files));

                const response = await api.post(`/vigil/ml/datasets/${grapesNet.key}/import/`, formData);
                setResult(response.data);
            } else {
                const response = await api.post(`/vigil/ml/datasets/${grapesNet.key}/import/`, {
                    source_mode: "bundled",
                    train_after_import: trainAfterImport,
                    model_name: modelName,
                    notes,
                    max_files: grapesNet.max_files,
                });
                setResult(response.data);
            }
            setSelectedFiles([]);
            if (folderInputRef.current) {
                folderInputRef.current.value = "";
            }
            onImportComplete?.();
        } catch (error) {
            console.error("Error importing dataset:", error);
            const backendError =
                (typeof error === "object" && error !== null && "response" in error
                    ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
                    : null) || "Dataset import failed. Check the console for details.";
            setErrorMessage(backendError);
            alert(backendError);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-10">
                <Loader2 className="animate-spin" style={{ color: "#9f1239" }} />
            </div>
        );
    }

    if (!grapesNet) {
        return <p style={{ color: "#6b7280" }}>No dataset importers are configured.</p>;
    }

    return (
        <div className="space-y-6">
            <div className="rounded-2xl p-4 xl:p-5" style={{ backgroundColor: "#fffaf5", border: "1px solid #fed7aa" }}>
                <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: "#ffedd5", color: "#9a3412" }}>
                        <Database size={18} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold" style={{ color: "#262626" }}>{grapesNet.name}</h3>
                        <p className="text-sm" style={{ color: "#6b7280" }}>{grapesNet.description}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 text-sm">
                    <div className="rounded-xl p-4" style={{ backgroundColor: "#ffffff", border: "1px solid #fde68a" }}>
                        <p className="font-semibold mb-2" style={{ color: "#92400e" }}>Observed Format</p>
                        <p style={{ color: "#4b5563" }}>Dataset 4 is the labeled weight-estimation subset. The key file is <span className="font-medium">Ground Truth for Dataset 4.csv</span>, which maps each <span className="font-medium">*_Color.png</span> image to height, width, distance, and ground-truth weight.</p>
                    </div>
                    <div className="rounded-xl p-4" style={{ backgroundColor: "#ffffff", border: "1px solid #dbeafe" }}>
                        <p className="font-semibold mb-2" style={{ color: "#1d4ed8" }}>Importer Focus</p>
                        <p style={{ color: "#4b5563" }}>This importer targets the labeled Dataset 4 subset and caps processed files to <span className="font-medium">{grapesNet.max_files}</span>. It pulls paired color images and depth metadata, then creates training samples for the VIGIL model.</p>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 text-sm">
                    <div className="rounded-xl p-3" style={{ backgroundColor: "#ffffff", border: "1px solid #f3f4f6" }}>
                        <p className="font-medium" style={{ color: "#111827" }}>Ground Truth CSV</p>
                        <p style={{ color: "#6b7280" }}>{grapesNet.expected_format.ground_truth_csv}</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ backgroundColor: "#ffffff", border: "1px solid #f3f4f6" }}>
                        <p className="font-medium" style={{ color: "#111827" }}>Color Image Pattern</p>
                        <p style={{ color: "#6b7280" }}>{grapesNet.expected_format.color_images}</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ backgroundColor: "#ffffff", border: "1px solid #f3f4f6" }}>
                        <p className="font-medium" style={{ color: "#111827" }}>Depth Metadata Pattern</p>
                        <p style={{ color: "#6b7280" }}>{grapesNet.expected_format.depth_metadata}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
                <div className="rounded-2xl p-4 xl:p-5 space-y-4" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
                    <div className="flex items-center gap-3">
                        <FolderUp size={18} style={{ color: "#9f1239" }} />
                        <h3 className="text-base font-bold" style={{ color: "#262626" }}>Upload Dataset Folder</h3>
                    </div>

                    <label className="block rounded-xl border border-dashed p-4 cursor-pointer" style={{ borderColor: "#fda4af", backgroundColor: "#fff1f2" }}>
                        <div className="flex items-center gap-3">
                            <HardDriveUpload size={18} style={{ color: "#9f1239" }} />
                            <div>
                                <p className="font-medium" style={{ color: "#262626" }}>
                                    {selectedFiles.length > 0 ? `${cappedSelection.length} files selected` : "Choose a GrapesNet folder"}
                                </p>
                                <p className="text-xs" style={{ color: "#6b7280" }}>The importer preserves relative paths and prioritizes Dataset 4 files before applying the {grapesNet.max_files}-file cap.</p>
                            </div>
                        </div>
                        <input ref={folderInputRef} type="file" multiple className="hidden" onChange={handleFolderSelection} />
                    </label>

                    {selectionWasCapped ? (
                        <p className="text-sm" style={{ color: "#b45309" }}>Your folder contains extra files. Only the most relevant Dataset 4 files are queued, up to {grapesNet.max_files} items.</p>
                    ) : null}

                    <button
                        type="button"
                        disabled={submitting || cappedSelection.length === 0}
                        onClick={() => submitImport("upload")}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition"
                        style={{ backgroundColor: "#9f1239", color: "#ffffff", opacity: submitting || cappedSelection.length === 0 ? 0.6 : 1 }}
                    >
                        {submitting ? <Loader2 size={18} className="animate-spin" /> : <FolderUp size={18} />}
                        Import Uploaded Folder
                    </button>
                </div>

                <div className="rounded-2xl p-4 xl:p-5 space-y-4" style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                    <div className="flex items-center gap-3">
                        <FlaskConical size={18} style={{ color: "#166534" }} />
                        <h3 className="text-base font-bold" style={{ color: "#262626" }}>Import and Train Settings</h3>
                    </div>

                    <input
                        className="w-full p-2 border rounded-md text-gray-900 placeholder:text-gray-500"
                        placeholder="Model Name"
                        value={modelName}
                        onChange={(e) => setModelName(e.target.value)}
                    />
                    <textarea
                        className="w-full p-2 border rounded-md text-gray-900 placeholder:text-gray-500"
                        rows={3}
                        placeholder="Optional notes about this dataset import"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                    <label className="flex items-center gap-3 text-sm" style={{ color: "#374151" }}>
                        <input type="checkbox" checked={trainAfterImport} onChange={(e) => setTrainAfterImport(e.target.checked)} />
                        Train a model immediately after importing the dataset
                    </label>

                    {grapesNet.bundled_root_available ? (
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={() => submitImport("bundled")}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition"
                            style={{ backgroundColor: "#166534", color: "#ffffff", opacity: submitting ? 0.6 : 1 }}
                        >
                            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
                            Import Bundled GrapesNet Subset
                        </button>
                    ) : (
                        <div className="rounded-xl p-4" style={{ backgroundColor: "#ffffff", border: "1px solid #d1fae5" }}>
                            <p className="text-sm font-medium mb-1" style={{ color: "#166534" }}>Bundled source unavailable</p>
                            <p className="text-sm" style={{ color: "#6b7280" }}>The local GrapesNet folder is not present in the workspace. Use the folder upload on the left to import and train from your dataset copy.</p>
                        </div>
                    )}
                </div>
            </div>

            {result ? (
                <div className="rounded-2xl p-4 xl:p-5" style={{ backgroundColor: "#f8fafc", border: "1px solid #dbeafe" }}>
                    <div className="flex items-center gap-3 mb-3">
                        <CheckCircle2 size={18} style={{ color: "#2563eb" }} />
                        <h3 className="text-base font-bold" style={{ color: "#262626" }}>Last Import Result</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                        <div>
                            <p style={{ color: "#6b7280" }}>New Imports</p>
                            <p className="font-semibold" style={{ color: "#111827" }}>{result.imported_samples}</p>
                        </div>
                        <div>
                            <p style={{ color: "#6b7280" }}>Skipped</p>
                            <p className="font-semibold" style={{ color: "#111827" }}>{result.skipped_samples}</p>
                        </div>
                        <div>
                            <p style={{ color: "#6b7280" }}>Rows Considered</p>
                            <p className="font-semibold" style={{ color: "#111827" }}>{result.total_candidate_rows}</p>
                        </div>
                        <div>
                            <p style={{ color: "#6b7280" }}>Source</p>
                            <p className="font-semibold" style={{ color: "#111827" }}>{result.source_label}</p>
                        </div>
                        <div>
                            <p style={{ color: "#6b7280" }}>Training Pool</p>
                            <p className="font-semibold" style={{ color: "#111827" }}>{result.trained_model?.training_sample_count ?? result.available_training_samples}</p>
                        </div>
                    </div>
                    {result.imported_samples === 0 && result.skipped_samples > 0 ? (
                        <p className="text-sm mt-3" style={{ color: "#6b7280" }}>No new samples were added because these files were already imported. Training can still use the existing sample pool shown above.</p>
                    ) : null}
                    {result.capped_files ? (
                        <p className="text-sm mt-3" style={{ color: "#b45309" }}>The upload exceeded the dataset cap, so only the first {grapesNet.max_files} files were processed.</p>
                    ) : null}
                    {result.trained_model ? (
                        <p className="text-sm mt-3" style={{ color: "#166534" }}>Trained model: {result.trained_model.name} v{result.trained_model.version} using {result.trained_model.training_sample_count ?? result.available_training_samples} samples.</p>
                    ) : trainAfterImport ? (
                        <p className="text-sm mt-3" style={{ color: "#6b7280" }}>No new model version was returned from this import request.</p>
                    ) : null}
                </div>
            ) : null}

            {errorMessage ? (
                <div className="rounded-2xl p-4 xl:p-5" style={{ backgroundColor: "#fff7ed", border: "1px solid #fdba74" }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: "#9a3412" }}>Import Error</p>
                    <p className="text-sm" style={{ color: "#7c2d12" }}>{errorMessage}</p>
                </div>
            ) : null}
        </div>
    );
}