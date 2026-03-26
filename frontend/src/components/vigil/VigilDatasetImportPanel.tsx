"use client";

import React, { useEffect, useRef, useState } from "react";
import { Database, FolderUp, Loader2, FlaskConical, CheckCircle2, HardDriveUpload, ChevronDown, ChevronUp } from "lucide-react";
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
    const [selectedDatasetKey, setSelectedDatasetKey] = useState("grapesnet");
    const [summaryExpanded, setSummaryExpanded] = useState(false);
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
            const incomingDatasets = response.data as DatasetDefinition[];
            setDatasets(incomingDatasets);
            if (incomingDatasets.length > 0) {
                const preferred = incomingDatasets.find((dataset) => dataset.key === "grapesnet") || incomingDatasets[0];
                setSelectedDatasetKey(preferred.key);
                setModelName(`${preferred.name} Model`);
            }
        } catch (error) {
            console.error("Error loading dataset definitions:", error);
        } finally {
            setLoading(false);
        }
    };

    const selectedDataset =
        datasets.find((dataset) => dataset.key === selectedDatasetKey)
        || datasets.find((dataset) => dataset.key === "grapesnet")
        || null;

    const isGrapesNetSelected = selectedDataset?.key === "grapesnet";

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

            return { file, priority, index };
        });

        const relevant = normalized
            .filter((item) => item.priority < 99)
            .sort((left, right) => (left.priority - right.priority) || (left.index - right.index));

        return relevant.slice(0, maxFiles).map((item) => item.file);
    };

    const cappedSelection = selectedDataset
        ? (isGrapesNetSelected
            ? prioritizeGrapesNetFiles(selectedFiles, selectedDataset.max_files)
            : selectedFiles.slice(0, selectedDataset.max_files))
        : selectedFiles;

    const selectionWasCapped = selectedDataset ? selectedFiles.length > cappedSelection.length : false;

    const handleFolderSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []) as DirectoryFile[];
        setSelectedFiles(files);
        setResult(null);
        setErrorMessage(null);
    };

    const handleDatasetSelection = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const datasetKey = event.target.value;
        const nextDataset = datasets.find((dataset) => dataset.key === datasetKey);

        setSelectedDatasetKey(datasetKey);
        setSelectedFiles([]);
        setResult(null);
        setErrorMessage(null);

        if (folderInputRef.current) {
            folderInputRef.current.value = "";
        }
        if (nextDataset) {
            setModelName(`${nextDataset.name} Model`);
        }
    };

    const submitImport = async (sourceMode: "upload" | "bundled") => {
        if (!selectedDataset) return;

        setSubmitting(true);
        setResult(null);
        setErrorMessage(null);

        try {
            if (sourceMode === "upload") {
                if (cappedSelection.length === 0) {
                    alert(`Choose a ${selectedDataset.name} dataset folder before importing.`);
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
                formData.append("max_files", String(selectedDataset.max_files));

                const response = await api.post(`/vigil/ml/datasets/${selectedDataset.key}/import/`, formData);
                setResult(response.data);
            } else {
                const response = await api.post(`/vigil/ml/datasets/${selectedDataset.key}/import/`, {
                    source_mode: "bundled",
                    train_after_import: trainAfterImport,
                    model_name: modelName,
                    notes,
                    max_files: selectedDataset.max_files,
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
            <div className="flex justify-center p-8">
                <Loader2 className="animate-spin" style={{ color: "#9f1239" }} />
            </div>
        );
    }

    if (!selectedDataset) {
        return <p style={{ color: "#6b7280" }}>No dataset importers are configured.</p>;
    }

    return (
        <div className="space-y-4">
            <div className="rounded-2xl p-3 xl:p-4" style={{ backgroundColor: "#fffaf5", border: "1px solid #fed7aa" }}>
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-3 mb-3">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: "#ffedd5", color: "#9a3412" }}>
                            <Database size={16} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold" style={{ color: "#262626" }}>{selectedDataset.name}</h3>
                            <p className="text-sm" style={{ color: "#6b7280" }}>{selectedDataset.description}</p>
                        </div>
                    </div>

                    <div className="w-full xl:w-72">
                        <label className="text-xs font-semibold block mb-1" style={{ color: "#7c2d12" }}>Dataset Selection</label>
                        <select
                            value={selectedDataset.key}
                            onChange={handleDatasetSelection}
                            className="w-full rounded-lg border p-2 text-sm"
                            style={{ borderColor: "#fdba74", backgroundColor: "#ffffff", color: "#111827" }}
                        >
                            {datasets.map((dataset) => (
                                <option key={dataset.key} value={dataset.key}>{dataset.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="rounded-xl p-3" style={{ backgroundColor: "#ffffff", border: "1px solid #fde68a" }}>
                    <p className="font-semibold text-sm mb-1" style={{ color: "#92400e" }}>Brief Summary</p>
                    <p className="text-sm" style={{ color: "#4b5563" }}>
                        {isGrapesNetSelected
                            ? `GrapesNet Dataset 4 is the labeled subset for grape weight estimation. Imports are capped at ${selectedDataset.max_files} files, prioritizing labeled color images and paired depth metadata.`
                            : `${selectedDataset.name} is configured for import with a file cap of ${selectedDataset.max_files}. Expand below to view format expectations and ingestion details.`}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setSummaryExpanded((previous) => !previous)}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold"
                    style={{ color: "#9a3412" }}
                >
                    {summaryExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {summaryExpanded ? "Hide dataset details" : "Show dataset details"}
                </button>

                {summaryExpanded ? (
                    <div className="mt-3 grid grid-cols-1 gap-3 text-sm">
                        <div className="rounded-xl p-3" style={{ backgroundColor: "#ffffff", border: "1px solid #dbeafe" }}>
                            <p className="font-semibold mb-1" style={{ color: "#1d4ed8" }}>Importer Focus</p>
                            <p style={{ color: "#4b5563" }}>
                                {isGrapesNetSelected
                                    ? `Targets labeled Dataset 4 rows and creates training samples from paired color imagery and depth metadata, up to ${selectedDataset.max_files} files per import.`
                                    : `Uses the current importer definition for ${selectedDataset.name} and enforces the configured max file cap of ${selectedDataset.max_files}.`}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div className="rounded-xl p-3" style={{ backgroundColor: "#ffffff", border: "1px solid #f3f4f6" }}>
                                <p className="font-medium" style={{ color: "#111827" }}>Ground Truth CSV</p>
                                <p style={{ color: "#6b7280" }}>{selectedDataset.expected_format.ground_truth_csv || "N/A"}</p>
                            </div>
                            <div className="rounded-xl p-3" style={{ backgroundColor: "#ffffff", border: "1px solid #f3f4f6" }}>
                                <p className="font-medium" style={{ color: "#111827" }}>Color Image Pattern</p>
                                <p style={{ color: "#6b7280" }}>{selectedDataset.expected_format.color_images || "N/A"}</p>
                            </div>
                            <div className="rounded-xl p-3" style={{ backgroundColor: "#ffffff", border: "1px solid #f3f4f6" }}>
                                <p className="font-medium" style={{ color: "#111827" }}>Depth Metadata Pattern</p>
                                <p style={{ color: "#6b7280" }}>{selectedDataset.expected_format.depth_metadata || "N/A"}</p>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="rounded-xl p-3 xl:p-4 space-y-3" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
                    <div className="flex items-center gap-2">
                        <FolderUp size={16} style={{ color: "#9f1239" }} />
                        <h3 className="text-sm font-bold" style={{ color: "#262626" }}>Upload Dataset Folder</h3>
                    </div>

                    <label className="block rounded-xl border border-dashed p-3 cursor-pointer" style={{ borderColor: "#fda4af", backgroundColor: "#fff1f2" }}>
                        <div className="flex items-center gap-3">
                            <HardDriveUpload size={16} style={{ color: "#9f1239" }} />
                            <div>
                                <p className="font-medium text-sm" style={{ color: "#262626" }}>
                                    {selectedFiles.length > 0 ? `${cappedSelection.length} files selected` : `Choose a ${selectedDataset.name} folder`}
                                </p>
                                <p className="text-xs" style={{ color: "#6b7280" }}>
                                    {isGrapesNetSelected
                                        ? `Prioritizes Dataset 4 files before applying the ${selectedDataset.max_files}-file cap.`
                                        : `Preserves folder paths and applies a ${selectedDataset.max_files}-file cap.`}
                                </p>
                            </div>
                        </div>
                        <input ref={folderInputRef} type="file" multiple className="hidden" onChange={handleFolderSelection} />
                    </label>

                    {selectionWasCapped ? (
                        <p className="text-xs" style={{ color: "#b45309" }}>Your folder contains extra files. Only the first {selectedDataset.max_files} queued files will be imported.</p>
                    ) : null}

                    <button
                        type="button"
                        disabled={submitting || cappedSelection.length === 0}
                        onClick={() => submitImport("upload")}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-semibold text-sm transition"
                        style={{ backgroundColor: "#9f1239", color: "#ffffff", opacity: submitting || cappedSelection.length === 0 ? 0.6 : 1 }}
                    >
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <FolderUp size={16} />}
                        Import Uploaded Folder
                    </button>
                </div>

                <div className="rounded-xl p-3 xl:p-4 space-y-3" style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                    <div className="flex items-center gap-2">
                        <FlaskConical size={16} style={{ color: "#166534" }} />
                        <h3 className="text-sm font-bold" style={{ color: "#262626" }}>Import and Train Settings</h3>
                    </div>

                    <input
                        className="w-full px-2.5 py-2 border rounded-md text-sm text-gray-900 placeholder:text-gray-500"
                        placeholder="Model Name"
                        value={modelName}
                        onChange={(e) => setModelName(e.target.value)}
                    />
                    <textarea
                        className="w-full px-2.5 py-2 border rounded-md text-sm text-gray-900 placeholder:text-gray-500"
                        rows={3}
                        placeholder="Optional notes about this dataset import"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                    <label className="flex items-center gap-2 text-sm" style={{ color: "#374151" }}>
                        <input type="checkbox" checked={trainAfterImport} onChange={(e) => setTrainAfterImport(e.target.checked)} />
                        Train a model immediately after importing the dataset
                    </label>

                    {selectedDataset.bundled_root_available ? (
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={() => submitImport("bundled")}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-semibold text-sm transition"
                            style={{ backgroundColor: "#166534", color: "#ffffff", opacity: submitting ? 0.6 : 1 }}
                        >
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
                            {`Import Bundled ${selectedDataset.name} Subset`}
                        </button>
                    ) : (
                        <div className="rounded-xl p-3" style={{ backgroundColor: "#ffffff", border: "1px solid #d1fae5" }}>
                            <p className="text-sm font-medium mb-1" style={{ color: "#166534" }}>Bundled source unavailable</p>
                            <p className="text-xs" style={{ color: "#6b7280" }}>
                                {`No local bundled folder was detected for ${selectedDataset.name}. Use folder upload to import and train from your dataset copy.`}
                            </p>
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
                        <p className="text-sm mt-3" style={{ color: "#b45309" }}>The upload exceeded the dataset cap, so only the first {selectedDataset.max_files} files were processed.</p>
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
