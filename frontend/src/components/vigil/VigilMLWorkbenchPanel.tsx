"use client";

import React, { useEffect, useState } from "react";
import {
    BrainCircuit,
    FlaskConical,
    Loader2,
    Play,
    Trash2,
    Upload,
    Image as ImageIcon,
    CheckCircle2,
    Sparkles,
    X,
} from "lucide-react";
import api from "@/app/lib/api";
import LatestPredictionPanel from "@/components/vigil/LatestPredictionPanel";

interface TrainingSample {
    id: number;
    sample_name: string;
    image_url: string | null;
    grape_species: string;
    target_volume_cm3: number;
    target_weight_g: number | null;
    occlusion_percentage: number;
    created_at: string;
    block_name: string | null;
}

interface ModelVersion {
    id: number;
    name: string;
    version: number;
    status: string;
    metrics: {
        rmse_cm3?: number;
        r2?: number;
        evaluation_mode?: string;
        top_features?: Array<{ feature: string; weight: number }>;
    };
    training_sample_count: number;
    validation_sample_count: number;
    is_active: boolean;
    trained_at: string | null;
}

interface TrainingProgress {
    model_id: number;
    status: string;
    stage: string;
    progress: number;
    message: string;
}

interface PredictionResult {
    id: number;
    model_version: number | null;
    model_name: string | null;
    sample_name: string;
    image_url: string | null;
    grape_species: string;
    predicted_volume_cm3: number;
    predicted_weight_g: number | null;
    confidence_score: number;
    created_at: string;
    annotated_image_url?: string | null;
    features?: {
        detections?: Array<{ x: number; y: number; width: number; height: number; confidence: number }>;
        [key: string]: unknown;
    };
}

interface Props {
    blockId: number | null;
    scanSessionId: number | null;
    refreshToken?: number;
    displayMode?: "full" | "inference" | "training";
}

const emptyTrainingForm = {
    sample_name: "",
    grape_species: "",
    target_volume_cm3: "",
    target_weight_g: "",
    occlusion_percentage: "0",
    hanging_height_cm: "",
    berry_count: "",
    weather_temp_f: "",
    recent_rain_in: "",
    soil_moisture_pct: "",
    metadata: "",
};

const emptyPredictionForm = {
    sample_name: "",
    grape_species: "",
    occlusion_percentage: "0",
    hanging_height_cm: "",
    berry_count: "",
    weather_temp_f: "",
    recent_rain_in: "",
    soil_moisture_pct: "",
    metadata: "",
};

export default function VigilMLWorkbenchPanel({ blockId, scanSessionId, refreshToken = 0, displayMode = "full" }: Props) {
    const [samples, setSamples] = useState<TrainingSample[]>([]);
    const [models, setModels] = useState<ModelVersion[]>([]);
    const [predictions, setPredictions] = useState<PredictionResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [trainingModel, setTrainingModel] = useState(false);
    const [predicting, setPredicting] = useState(false);
    const [trainingFiles, setTrainingFiles] = useState<File[]>([]);
    const [predictionFiles, setPredictionFiles] = useState<File[]>([]);
    const [predictionMode, setPredictionMode] = useState<"single" | "multiple">("single");
    const [showAdvancedPredictFields, setShowAdvancedPredictFields] = useState(false);
    const [trainingForm, setTrainingForm] = useState({ ...emptyTrainingForm });
    const [predictionForm, setPredictionForm] = useState({ ...emptyPredictionForm });
    const [modelName, setModelName] = useState("Cluster Volume Model");
    const [modelNotes, setModelNotes] = useState("");
    const [selectedModelId, setSelectedModelId] = useState<number | "">("");
    const [trainingProgress, setTrainingProgress] = useState<TrainingProgress | null>(null);
    const [latestPrediction, setLatestPrediction] = useState<PredictionResult | null>(null);
    const [expandedPredictionImageUrl, setExpandedPredictionImageUrl] = useState<string | null>(null);
    const [expandedPredictionLabel, setExpandedPredictionLabel] = useState<string>("Prediction image");

    useEffect(() => {
        fetchWorkbenchData();
    }, [blockId, scanSessionId, refreshToken]);

    const fetchWorkbenchData = async () => {
        setLoading(true);
        try {
            const [sampleResponse, modelResponse, predictionResponse] = await Promise.all([
                api.get("/vigil/ml/training-samples/", { params: blockId ? { block_id: blockId } : undefined }),
                api.get("/vigil/ml/models/"),
                api.get("/vigil/ml/predictions/", {
                    params: scanSessionId ? { scan_session_id: scanSessionId } : (blockId ? { block_id: blockId } : undefined),
                }),
            ]);

            setSamples(sampleResponse.data);
            setModels(modelResponse.data);
            setPredictions(predictionResponse.data);

            const readyModel = modelResponse.data.find((model: ModelVersion) => model.is_active && model.status === "ready")
                || modelResponse.data.find((model: ModelVersion) => model.status === "ready");
            setSelectedModelId((current) => current || readyModel?.id || "");

            const currentlyTraining = modelResponse.data.find((model: ModelVersion) => model.status === "training");
            if (currentlyTraining) {
                const progressData = (currentlyTraining.metrics as { training_progress?: { stage?: string; progress?: number; message?: string } })?.training_progress;
                setTrainingProgress({
                    model_id: currentlyTraining.id,
                    status: currentlyTraining.status,
                    stage: progressData?.stage || "training",
                    progress: progressData?.progress ?? 0,
                    message: progressData?.message || "Training in progress",
                });
            }
        } catch (error) {
            console.error("Error loading VIGIL ML data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!trainingProgress || ["ready", "failed", "archived"].includes(trainingProgress.status)) {
            return;
        }

        const interval = setInterval(async () => {
            try {
                const response = await api.get(`/vigil/ml/models/${trainingProgress.model_id}/progress/`);
                const nextProgress = response.data as TrainingProgress;
                setTrainingProgress(nextProgress);
                if (["ready", "failed", "archived"].includes(nextProgress.status)) {
                    await fetchWorkbenchData();
                }
            } catch (error) {
                console.error("Error polling training progress:", error);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [trainingProgress?.model_id, trainingProgress?.status]);

    const parseMetadata = (raw: string) => {
        if (!raw.trim()) return "{}";
        try {
            return JSON.stringify(JSON.parse(raw));
        } catch {
            throw new Error("Metadata must be valid JSON.");
        }
    };

    const handleUploadTrainingSample = async (e: React.FormEvent) => {
        e.preventDefault();
        if (trainingFiles.length === 0) {
            alert("Select one or more images before uploading training samples.");
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("sample_name", trainingForm.sample_name);
            formData.append("grape_species", trainingForm.grape_species);
            formData.append("target_volume_cm3", trainingForm.target_volume_cm3);
            if (trainingForm.target_weight_g) formData.append("target_weight_g", trainingForm.target_weight_g);
            if (trainingForm.occlusion_percentage) formData.append("occlusion_percentage", trainingForm.occlusion_percentage);
            if (trainingForm.hanging_height_cm) formData.append("hanging_height_cm", trainingForm.hanging_height_cm);
            if (trainingForm.berry_count) formData.append("berry_count", trainingForm.berry_count);
            if (trainingForm.weather_temp_f) formData.append("weather_temp_f", trainingForm.weather_temp_f);
            if (trainingForm.recent_rain_in) formData.append("recent_rain_in", trainingForm.recent_rain_in);
            if (trainingForm.soil_moisture_pct) formData.append("soil_moisture_pct", trainingForm.soil_moisture_pct);
            formData.append("metadata", parseMetadata(trainingForm.metadata));
            if (blockId) formData.append("block", String(blockId));
            if (scanSessionId) formData.append("scan_session", String(scanSessionId));

            if (trainingFiles.length === 1) {
                formData.append("image", trainingFiles[0]);
            } else {
                trainingFiles.forEach((file) => formData.append("images", file));
            }

            const response = await api.post("/vigil/ml/training-samples/", formData);
            if (response.data?.samples && Array.isArray(response.data.samples)) {
                setSamples((current) => [...response.data.samples, ...current]);
            } else {
                setSamples((current) => [response.data, ...current]);
            }
            setTrainingForm({ ...emptyTrainingForm });
            setTrainingFiles([]);
        } catch (error) {
            console.error("Error uploading training sample:", error);
            alert("Unable to upload training sample. Check the console for details.");
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteSample = async (sampleId: number) => {
        if (!confirm("Delete this training sample?")) return;
        try {
            await api.delete(`/vigil/ml/training-samples/${sampleId}/`);
            setSamples((current) => current.filter((sample) => sample.id !== sampleId));
        } catch (error) {
            console.error("Error deleting training sample:", error);
            alert("Unable to delete training sample.");
        }
    };

    const handleTrainModel = async () => {
        setTrainingModel(true);
        try {
            const response = await api.post("/vigil/ml/train/", {
                name: modelName,
                notes: modelNotes,
                block_id: blockId,
                is_active: true,
            });
            const createdModel = response.data as ModelVersion;
            setModels((current) => [createdModel, ...current.filter((model) => model.id !== createdModel.id)]);
            setSelectedModelId(createdModel.id);
            setModelNotes("");
            setTrainingProgress({
                model_id: createdModel.id,
                status: createdModel.status,
                stage: "queued",
                progress: 0,
                message: "Queued for training",
            });
        } catch (error) {
            console.error("Error training model:", error);
            alert("Model training failed. Make sure you have enough labeled samples.");
        } finally {
            setTrainingModel(false);
        }
    };

    const handlePredict = async (e: React.FormEvent) => {
        e.preventDefault();
        if (predictionFiles.length === 0) {
            alert("Select one or more images to test against the trained model.");
            return;
        }

        setPredicting(true);
        try {
            const results: PredictionResult[] = [];
            const baseLabel = predictionForm.sample_name.trim();

            for (let index = 0; index < predictionFiles.length; index += 1) {
                const file = predictionFiles[index];
                const inferredLabel = baseLabel
                    ? (predictionMode === "multiple" ? `${baseLabel} ${index + 1}` : baseLabel)
                    : file.name;

                const formData = new FormData();
                formData.append("image", file);
                formData.append("sample_name", inferredLabel);
                formData.append("grape_species", predictionForm.grape_species);
                if (predictionForm.occlusion_percentage) formData.append("occlusion_percentage", predictionForm.occlusion_percentage);
                if (predictionForm.hanging_height_cm) formData.append("hanging_height_cm", predictionForm.hanging_height_cm);
                if (predictionForm.berry_count) formData.append("berry_count", predictionForm.berry_count);
                if (predictionForm.weather_temp_f) formData.append("weather_temp_f", predictionForm.weather_temp_f);
                if (predictionForm.recent_rain_in) formData.append("recent_rain_in", predictionForm.recent_rain_in);
                if (predictionForm.soil_moisture_pct) formData.append("soil_moisture_pct", predictionForm.soil_moisture_pct);
                formData.append("metadata", parseMetadata(predictionForm.metadata));
                if (selectedModelId) formData.append("model_version", String(selectedModelId));
                if (blockId) formData.append("block", String(blockId));
                if (scanSessionId) formData.append("scan_session", String(scanSessionId));

                const response = await api.post("/vigil/ml/predictions/", formData);
                results.push(response.data as PredictionResult);
            }

            const newest = results[results.length - 1] || null;
            setLatestPrediction(newest);
            setPredictions((current) => [...results.reverse(), ...current]);
            setPredictionForm({ ...emptyPredictionForm });
            setPredictionFiles([]);
        } catch (error) {
            console.error("Error creating prediction:", error);
            alert("Prediction failed. Check the console for details.");
        } finally {
            setPredicting(false);
        }
    };

    const readyModels = models.filter((model) => model.status === "ready");
    const showTrainingPanels = displayMode === "full" || displayMode === "training";
    const showInferencePanels = displayMode === "full" || displayMode === "inference";
    const formatNumber = (value: number | string | null | undefined, digits = 2) => {
        if (value === null || value === undefined || value === "") return "--";
        const numericValue = Number(value);
        return Number.isFinite(numericValue) ? numericValue.toFixed(digits) : "--";
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="animate-spin" style={{ color: "#9f1239" }} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {showTrainingPanels ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        <div className="rounded-xl p-4" style={{ backgroundColor: "#fafafa", border: "1px solid #e5e5e5" }}>
                            <p className="text-xs uppercase tracking-[0.18em] mb-2" style={{ color: "#6b7280" }}>Training Samples</p>
                            <p className="text-3xl font-bold" style={{ color: "#9f1239" }}>{samples.length}</p>
                        </div>
                        <div className="rounded-xl p-4" style={{ backgroundColor: "#fafafa", border: "1px solid #e5e5e5" }}>
                            <p className="text-xs uppercase tracking-[0.18em] mb-2" style={{ color: "#6b7280" }}>Ready Models</p>
                            <p className="text-3xl font-bold" style={{ color: "#0f766e" }}>{readyModels.length}</p>
                        </div>
                        <div className="rounded-xl p-4" style={{ backgroundColor: "#fafafa", border: "1px solid #e5e5e5" }}>
                            <p className="text-xs uppercase tracking-[0.18em] mb-2" style={{ color: "#6b7280" }}>Saved Predictions</p>
                            <p className="text-3xl font-bold" style={{ color: "#1d4ed8" }}>{predictions.length}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
                        <form onSubmit={handleUploadTrainingSample} className="rounded-2xl p-4 xl:p-5 space-y-4" style={{ backgroundColor: "#fffaf5", border: "1px solid #fed7aa" }}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: "#ffedd5", color: "#9a3412" }}>
                            <Upload size={18} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold" style={{ color: "#262626" }}>Upload Labeled Training Data</h3>
                            <p className="text-sm" style={{ color: "#6b7280" }}>Attach cluster images with true volume targets to teach the model.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                        <input
                            className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500"
                            placeholder="Sample Name"
                            value={trainingForm.sample_name}
                            onChange={(e) => setTrainingForm({ ...trainingForm, sample_name: e.target.value })}
                        />
                        <input
                            className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500"
                            placeholder="Grape Species"
                            value={trainingForm.grape_species}
                            onChange={(e) => setTrainingForm({ ...trainingForm, grape_species: e.target.value })}
                        />
                        <input
                            className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500"
                            type="number"
                            step="0.01"
                            placeholder="True Volume (cm³)"
                            value={trainingForm.target_volume_cm3}
                            onChange={(e) => setTrainingForm({ ...trainingForm, target_volume_cm3: e.target.value })}
                            required
                        />
                        <input
                            className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500"
                            type="number"
                            step="0.01"
                            placeholder="True Weight (g)"
                            value={trainingForm.target_weight_g}
                            onChange={(e) => setTrainingForm({ ...trainingForm, target_weight_g: e.target.value })}
                        />
                        <input
                            className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500"
                            type="number"
                            step="0.01"
                            placeholder="Occlusion %"
                            value={trainingForm.occlusion_percentage}
                            onChange={(e) => setTrainingForm({ ...trainingForm, occlusion_percentage: e.target.value })}
                        />
                        <input
                            className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500"
                            type="number"
                            step="0.01"
                            placeholder="Hanging Height (cm)"
                            value={trainingForm.hanging_height_cm}
                            onChange={(e) => setTrainingForm({ ...trainingForm, hanging_height_cm: e.target.value })}
                        />
                        <input
                            className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500"
                            type="number"
                            placeholder="Berry Count"
                            value={trainingForm.berry_count}
                            onChange={(e) => setTrainingForm({ ...trainingForm, berry_count: e.target.value })}
                        />
                        <input
                            className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500"
                            type="number"
                            step="0.1"
                            placeholder="Weather Temp (°F)"
                            value={trainingForm.weather_temp_f}
                            onChange={(e) => setTrainingForm({ ...trainingForm, weather_temp_f: e.target.value })}
                        />
                        <input
                            className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500"
                            type="number"
                            step="0.01"
                            placeholder="Recent Rain (in)"
                            value={trainingForm.recent_rain_in}
                            onChange={(e) => setTrainingForm({ ...trainingForm, recent_rain_in: e.target.value })}
                        />
                        <input
                            className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500"
                            type="number"
                            step="0.1"
                            placeholder="Soil Moisture %"
                            value={trainingForm.soil_moisture_pct}
                            onChange={(e) => setTrainingForm({ ...trainingForm, soil_moisture_pct: e.target.value })}
                        />
                    </div>

                    <textarea
                        className="w-full p-2 border rounded-md text-gray-900 placeholder:text-gray-500"
                        rows={3}
                        placeholder='Optional metadata JSON, e.g. {"sun_exposure": "west", "sensor_distance_cm": 42}'
                        value={trainingForm.metadata}
                        onChange={(e) => setTrainingForm({ ...trainingForm, metadata: e.target.value })}
                    />

                    <label className="block rounded-xl border border-dashed p-4 cursor-pointer" style={{ borderColor: "#fdba74", backgroundColor: "#ffffff" }}>
                        <div className="flex items-center gap-3">
                            <ImageIcon size={18} style={{ color: "#9a3412" }} />
                            <div>
                                <p className="font-medium" style={{ color: "#262626" }}>
                                    {trainingFiles.length === 0
                                        ? "Choose one or more labeled cluster images"
                                        : `${trainingFiles.length} image${trainingFiles.length === 1 ? "" : "s"} selected`}
                                </p>
                                <p className="text-xs" style={{ color: "#6b7280" }}>PNG or JPG with measured cluster volume targets.</p>
                            </div>
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => setTrainingFiles(Array.from(e.target.files || []))}
                        />
                    </label>

                    <button
                        type="submit"
                        disabled={uploading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition"
                        style={{ backgroundColor: "#9a3412", color: "#ffffff", opacity: uploading ? 0.7 : 1 }}
                    >
                        {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                        Upload Training Sample
                    </button>
                    </form>

                    <div className="rounded-2xl p-4 xl:p-5 space-y-4" style={{ backgroundColor: "#f7fee7", border: "1px solid #bef264" }}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: "#ecfccb", color: "#3f6212" }}>
                            <BrainCircuit size={18} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold" style={{ color: "#262626" }}>Train or Refresh the Model</h3>
                            <p className="text-sm" style={{ color: "#6b7280" }}>The engine combines image-derived signals with vineyard context and scan metadata.</p>
                        </div>
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
                        placeholder="Optional training notes"
                        value={modelNotes}
                        onChange={(e) => setModelNotes(e.target.value)}
                    />
                    <button
                        type="button"
                        onClick={handleTrainModel}
                        disabled={trainingModel}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition"
                        style={{ backgroundColor: "#4d7c0f", color: "#ffffff", opacity: trainingModel ? 0.7 : 1 }}
                    >
                        {trainingModel ? <Loader2 size={18} className="animate-spin" /> : <FlaskConical size={18} />}
                        Train Active Model
                    </button>

                    {trainingProgress ? (
                        <div className="rounded-xl p-3" style={{ backgroundColor: "#ffffff", border: "1px solid #d9f99d" }}>
                            <div className="flex items-center justify-between text-xs mb-2" style={{ color: "#3f6212" }}>
                                <span>{trainingProgress.message}</span>
                                <span>{trainingProgress.progress}%</span>
                            </div>
                            <div className="h-2 rounded-full" style={{ backgroundColor: "#ecfccb" }}>
                                <div
                                    className="h-2 rounded-full transition-all"
                                    style={{ width: `${Math.max(0, Math.min(trainingProgress.progress, 100))}%`, backgroundColor: "#65a30d" }}
                                />
                            </div>
                            <p className="text-xs mt-2" style={{ color: "#4b5563" }}>Stage: {trainingProgress.stage}</p>
                        </div>
                    ) : null}

                    <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                        {models.length === 0 ? (
                            <div className="rounded-xl p-4" style={{ backgroundColor: "#ffffff", border: "1px solid #d9f99d" }}>
                                <p className="text-sm" style={{ color: "#4b5563" }}>No models yet. Upload at least five labeled samples, then train.</p>
                            </div>
                        ) : models.map((model) => (
                            <div key={model.id} className="rounded-xl p-4" style={{ backgroundColor: "#ffffff", border: `1px solid ${model.is_active ? "#84cc16" : "#e5e7eb"}` }}>
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold" style={{ color: "#111827" }}>{model.name} v{model.version}</p>
                                            {model.is_active && <CheckCircle2 size={16} style={{ color: "#4d7c0f" }} />}
                                        </div>
                                        <p className="text-xs uppercase tracking-[0.16em]" style={{ color: model.status === "ready" ? "#166534" : "#92400e" }}>{model.status}</p>
                                    </div>
                                    <p className="text-xs" style={{ color: "#6b7280" }}>{model.training_sample_count} samples</p>
                                </div>
                                <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                                    <div>
                                        <p style={{ color: "#6b7280" }}>RMSE</p>
                                        <p className="font-semibold" style={{ color: "#111827" }}>{model.metrics?.rmse_cm3 ?? "--"}</p>
                                    </div>
                                    <div>
                                        <p style={{ color: "#6b7280" }}>R²</p>
                                        <p className="font-semibold" style={{ color: "#111827" }}>{model.metrics?.r2 ?? "--"}</p>
                                    </div>
                                    <div>
                                        <p style={{ color: "#6b7280" }}>Mode</p>
                                        <p className="font-semibold" style={{ color: "#111827" }}>{model.metrics?.evaluation_mode ?? "--"}</p>
                                    </div>
                                </div>
                                {model.metrics?.top_features?.length ? (
                                    <div className="mt-3">
                                        <p className="text-xs uppercase tracking-[0.16em] mb-2" style={{ color: "#6b7280" }}>Top Drivers</p>
                                        <div className="flex flex-wrap gap-2">
                                            {model.metrics.top_features.slice(0, 4).map((feature) => (
                                                <span key={feature.feature} className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "#f7fee7", color: "#3f6212" }}>
                                                    {feature.feature}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                        </div>
                    </div>
                </>
            ) : null}

            {showInferencePanels ? (
                <div className="space-y-4">
                <form onSubmit={handlePredict} className="rounded-2xl p-4 xl:p-5 space-y-4" style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: "#dbeafe", color: "#1d4ed8" }}>
                            <Play size={18} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold" style={{ color: "#262626" }}>Test on a Real Image</h3>
                            <p className="text-sm" style={{ color: "#6b7280" }}>Run inference using the active model or pick a prior trained version.</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setPredictionMode("single");
                                if (predictionFiles.length > 1) {
                                    setPredictionFiles(predictionFiles.slice(0, 1));
                                }
                            }}
                            className="px-3 py-1.5 rounded-lg text-sm font-semibold transition"
                            style={{
                                backgroundColor: predictionMode === "single" ? "#1d4ed8" : "#ffffff",
                                color: predictionMode === "single" ? "#ffffff" : "#1d4ed8",
                                border: "1px solid #93c5fd",
                            }}
                        >
                            One Image
                        </button>
                        <button
                            type="button"
                            onClick={() => setPredictionMode("multiple")}
                            className="px-3 py-1.5 rounded-lg text-sm font-semibold transition"
                            style={{
                                backgroundColor: predictionMode === "multiple" ? "#1d4ed8" : "#ffffff",
                                color: predictionMode === "multiple" ? "#ffffff" : "#1d4ed8",
                                border: "1px solid #93c5fd",
                            }}
                        >
                            Multiple Images
                        </button>
                    </div>

                    <label
                        className="block rounded-xl border border-dashed p-6 xl:p-8 cursor-pointer"
                        style={{ borderColor: "#93c5fd", backgroundColor: "#ffffff", minHeight: "220px" }}
                    >
                        <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                            <Sparkles size={22} style={{ color: "#1d4ed8" }} />
                            <div>
                                <p className="font-semibold" style={{ color: "#262626" }}>
                                    {predictionFiles.length > 0
                                        ? `${predictionFiles.length} image${predictionFiles.length === 1 ? "" : "s"} selected`
                                        : `Upload ${predictionMode === "single" ? "an image" : "one or more images"}`}
                                </p>
                                <p className="text-xs mt-1" style={{ color: "#6b7280" }}>
                                    Drag and drop or click to browse. Supported formats: JPG, PNG.
                                </p>
                                {predictionFiles.length > 0 ? (
                                    <p className="text-xs mt-2" style={{ color: "#1d4ed8" }}>
                                        {predictionFiles.slice(0, 2).map((file) => file.name).join(" | ")}
                                        {predictionFiles.length > 2 ? ` | +${predictionFiles.length - 2} more` : ""}
                                    </p>
                                ) : null}
                            </div>
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            multiple={predictionMode === "multiple"}
                            className="hidden"
                            onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                setPredictionFiles(predictionMode === "single" ? files.slice(0, 1) : files);
                            }}
                        />
                    </label>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
                        <select
                            className="p-2 border rounded-md text-gray-900"
                            value={selectedModelId}
                            onChange={(e) => setSelectedModelId(e.target.value ? Number(e.target.value) : "")}
                        >
                            <option value="">Use active model</option>
                            {readyModels.map((model) => (
                                <option key={model.id} value={model.id}>{model.name} v{model.version}{model.is_active ? " (active)" : ""}</option>
                            ))}
                        </select>
                        <input
                            className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500"
                            placeholder="Prediction Label"
                            value={predictionForm.sample_name}
                            onChange={(e) => setPredictionForm({ ...predictionForm, sample_name: e.target.value })}
                        />
                        <input
                            className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500"
                            placeholder="Grape Species"
                            value={predictionForm.grape_species}
                            onChange={(e) => setPredictionForm({ ...predictionForm, grape_species: e.target.value })}
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowAdvancedPredictFields((value) => !value)}
                        className="text-sm font-semibold"
                        style={{ color: "#1d4ed8" }}
                    >
                        {showAdvancedPredictFields ? "Hide Advanced Options" : "Show Advanced Options"}
                    </button>

                    {showAdvancedPredictFields ? (
                        <>
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                        <input
                            className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500"
                            type="number"
                            step="0.01"
                            placeholder="Occlusion %"
                            value={predictionForm.occlusion_percentage}
                            onChange={(e) => setPredictionForm({ ...predictionForm, occlusion_percentage: e.target.value })}
                        />
                        <input
                            className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500"
                            type="number"
                            step="0.01"
                            placeholder="Hanging Height (cm)"
                            value={predictionForm.hanging_height_cm}
                            onChange={(e) => setPredictionForm({ ...predictionForm, hanging_height_cm: e.target.value })}
                        />
                        <input
                            className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500"
                            type="number"
                            placeholder="Berry Count"
                            value={predictionForm.berry_count}
                            onChange={(e) => setPredictionForm({ ...predictionForm, berry_count: e.target.value })}
                        />
                        <input
                            className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500"
                            type="number"
                            step="0.1"
                            placeholder="Weather Temp (°F)"
                            value={predictionForm.weather_temp_f}
                            onChange={(e) => setPredictionForm({ ...predictionForm, weather_temp_f: e.target.value })}
                        />
                        <input
                            className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500"
                            type="number"
                            step="0.01"
                            placeholder="Recent Rain (in)"
                            value={predictionForm.recent_rain_in}
                            onChange={(e) => setPredictionForm({ ...predictionForm, recent_rain_in: e.target.value })}
                        />
                        <input
                            className="p-2 border rounded-md text-gray-900 placeholder:text-gray-500"
                            type="number"
                            step="0.1"
                            placeholder="Soil Moisture %"
                            value={predictionForm.soil_moisture_pct}
                            onChange={(e) => setPredictionForm({ ...predictionForm, soil_moisture_pct: e.target.value })}
                        />
                            </div>

                            <textarea
                                className="w-full p-2 border rounded-md text-gray-900 placeholder:text-gray-500"
                                rows={3}
                                placeholder='Optional metadata JSON for inference, e.g. {"camera_angle": "left-canopy"}'
                                value={predictionForm.metadata}
                                onChange={(e) => setPredictionForm({ ...predictionForm, metadata: e.target.value })}
                            />
                        </>
                    ) : null}

                    <button
                        type="submit"
                        disabled={predicting}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition"
                        style={{ backgroundColor: "#1d4ed8", color: "#ffffff", opacity: predicting ? 0.7 : 1 }}
                    >
                        {predicting ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
                        {predictionMode === "multiple" ? "Run Batch Predictions" : "Run Volume Prediction"}
                    </button>
                </form>

                <div className="space-y-4">
                    <LatestPredictionPanel
                        latestPrediction={latestPrediction}
                        formatNumber={formatNumber}
                        onExpandImage={(url, label) => {
                            setExpandedPredictionImageUrl(url);
                            setExpandedPredictionLabel(label);
                        }}
                    />
                    {displayMode === "full" ? (
                        <div className="rounded-2xl p-4 xl:p-5" style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }}>
                            <h3 className="text-base font-bold mb-4" style={{ color: "#262626" }}>Recent Samples</h3>
                            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                                {samples.length === 0 ? (
                                    <p className="text-sm" style={{ color: "#6b7280" }}>No labeled samples uploaded yet.</p>
                                ) : samples.slice(0, 6).map((sample) => (
                                    <div key={sample.id} className="flex items-center gap-3 rounded-xl p-3" style={{ backgroundColor: "#fafafa", border: "1px solid #f3f4f6" }}>
                                        {sample.image_url ? (
                                            <img src={sample.image_url} alt={sample.sample_name || "Training sample"} className="w-14 h-14 rounded-lg object-cover border" />
                                        ) : (
                                            <div className="w-14 h-14 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#f3f4f6" }}>
                                                <ImageIcon size={18} style={{ color: "#9ca3af" }} />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate" style={{ color: "#111827" }}>{sample.sample_name || "Untitled sample"}</p>
                                            <p className="text-sm truncate" style={{ color: "#6b7280" }}>{sample.grape_species || sample.block_name || "No species"}</p>
                                            <p className="text-sm" style={{ color: "#9a3412" }}>Target {formatNumber(sample.target_volume_cm3)} cm³</p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteSample(sample.id)}
                                            className="p-2 rounded-lg transition"
                                            style={{ color: "#991b1b" }}
                                            title="Delete sample"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
                </div>
            ) : null}

            {expandedPredictionImageUrl ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
                    onClick={() => setExpandedPredictionImageUrl(null)}
                >
                    <div
                        className="relative w-full max-w-5xl rounded-2xl bg-white p-3 shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setExpandedPredictionImageUrl(null)}
                            className="absolute right-3 top-3 rounded-full p-2"
                            style={{ backgroundColor: "rgba(255,255,255,0.9)", color: "#111827" }}
                            aria-label="Close expanded prediction image"
                        >
                            <X size={18} />
                        </button>
                        <img
                            src={expandedPredictionImageUrl}
                            alt={expandedPredictionLabel}
                            className="max-h-[80vh] w-full rounded-xl object-contain"
                        />
                    </div>
                </div>
            ) : null}
        </div>
    );
}