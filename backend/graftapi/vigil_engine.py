from __future__ import annotations

import math
import pickle
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image
from django.conf import settings
from django.utils import timezone


def _coerce_float(value: Any) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


@dataclass
class PreparedSample:
    features: dict[str, Any]
    volume: float
    weight: float | None


class VigilMLEngine:
    """Train and serve a lightweight image-plus-metadata regression model."""

    min_samples = 5
    default_alpha = 1.0

    def train_model(self, model_version, samples) -> dict[str, Any]:
        prepared = [self._prepare_training_sample(sample) for sample in samples if getattr(sample, "image", None)]
        if len(prepared) < self.min_samples:
            raise ValueError(f"At least {self.min_samples} labeled samples are required to train a model.")

        feature_dicts = [sample.features for sample in prepared]
        schema = self._build_schema(feature_dicts)
        all_x, feature_names = self._vectorize_features(feature_dicts, schema)
        volume_y = np.array([sample.volume for sample in prepared], dtype=float)

        split = self._train_validation_split(len(prepared))
        metrics = self._evaluate_volume_model(all_x, volume_y, split)
        volume_model = self._fit_ridge(all_x, volume_y, alpha=self.default_alpha)

        weight_samples = [sample for sample in prepared if sample.weight is not None]
        weight_model = None
        density_g_per_cm3 = self._estimate_density(weight_samples)
        if len(weight_samples) >= 3:
            weight_feature_dicts = [sample.features for sample in weight_samples]
            weight_x, _ = self._vectorize_features(weight_feature_dicts, schema)
            weight_y = np.array([sample.weight for sample in weight_samples], dtype=float)
            weight_model = self._fit_ridge(weight_x, weight_y, alpha=self.default_alpha)

        artifact = {
            "trained_at": timezone.now().isoformat(),
            "schema": schema,
            "feature_names": feature_names,
            "volume_model": volume_model,
            "weight_model": weight_model,
            "density_g_per_cm3": density_g_per_cm3,
            "volume_rmse": metrics["rmse_cm3"],
            "volume_r2": metrics["r2"],
            "sample_count": len(prepared),
            "feature_center": all_x.mean(axis=0).tolist() if len(all_x) else [],
            "distance_scale": float(np.percentile(np.linalg.norm(all_x - all_x.mean(axis=0), axis=1), 75)) if len(all_x) > 1 else 1.0,
        }

        artifact_path = self._artifact_path(model_version)
        artifact_path.parent.mkdir(parents=True, exist_ok=True)
        with artifact_path.open("wb") as artifact_file:
            pickle.dump(artifact, artifact_file)

        metrics["top_features"] = self._top_feature_weights(feature_names, volume_model)
        return {
            "artifact_path": str(artifact_path.relative_to(settings.MEDIA_ROOT)),
            "feature_schema": schema,
            "metrics": metrics,
            "training_sample_count": len(prepared),
            "validation_sample_count": split[1].size,
        }

    def predict(self, model_version, *, image_path: str, block=None, scan_session=None, payload: dict[str, Any] | None = None) -> dict[str, Any]:
        artifact = self._load_artifact(model_version)
        payload = payload or {}
        features = self._build_feature_dict(
            image_path=image_path,
            grape_species=payload.get("grape_species"),
            block=block,
            scan_session=scan_session,
            occlusion_percentage=payload.get("occlusion_percentage"),
            hanging_height_cm=payload.get("hanging_height_cm"),
            bbox_width_px=payload.get("bbox_width_px"),
            bbox_height_px=payload.get("bbox_height_px"),
            berry_count=payload.get("berry_count"),
            row_number=payload.get("row_number"),
            vine_number=payload.get("vine_number"),
            weather_temp_f=payload.get("weather_temp_f"),
            recent_rain_in=payload.get("recent_rain_in"),
            soil_moisture_pct=payload.get("soil_moisture_pct"),
            metadata=payload.get("metadata") or {},
        )
        x_matrix, _ = self._vectorize_features([features], artifact["schema"])
        x_vector = x_matrix[0]
        predicted_volume = max(0.0, self._predict_ridge(artifact["volume_model"], x_vector))
        if artifact.get("weight_model"):
            predicted_weight = max(0.0, self._predict_ridge(artifact["weight_model"], x_vector))
        else:
            predicted_weight = max(0.0, predicted_volume * float(artifact.get("density_g_per_cm3") or 0.85))

        confidence = self._estimate_confidence(
            x_vector=x_vector,
            sample_count=int(artifact.get("sample_count") or 0),
            rmse=float(artifact.get("volume_rmse") or 0.0),
            prediction=predicted_volume,
            feature_center=np.array(artifact.get("feature_center") or np.zeros_like(x_vector), dtype=float),
            distance_scale=float(artifact.get("distance_scale") or 1.0),
        )

        return {
            "predicted_volume_cm3": round(predicted_volume, 2),
            "predicted_weight_g": round(predicted_weight, 2),
            "confidence_score": round(confidence, 2),
            "features": self._round_features(features),
        }

    def _prepare_training_sample(self, sample) -> PreparedSample:
        features = self._build_feature_dict(
            image_path=sample.image.path,
            grape_species=sample.grape_species,
            block=sample.block,
            scan_session=sample.scan_session,
            occlusion_percentage=sample.occlusion_percentage,
            hanging_height_cm=sample.hanging_height_cm,
            bbox_width_px=sample.bbox_width_px,
            bbox_height_px=sample.bbox_height_px,
            berry_count=sample.berry_count,
            row_number=sample.row_number,
            vine_number=sample.vine_number,
            weather_temp_f=sample.weather_temp_f,
            recent_rain_in=sample.recent_rain_in,
            soil_moisture_pct=sample.soil_moisture_pct,
            metadata=sample.metadata or {},
        )
        return PreparedSample(
            features=features,
            volume=float(sample.target_volume_cm3),
            weight=_coerce_float(sample.target_weight_g),
        )

    def _build_feature_dict(
        self,
        *,
        image_path: str,
        grape_species: Any,
        block,
        scan_session,
        occlusion_percentage: Any,
        hanging_height_cm: Any,
        bbox_width_px: Any,
        bbox_height_px: Any,
        berry_count: Any,
        row_number: Any,
        vine_number: Any,
        weather_temp_f: Any,
        recent_rain_in: Any,
        soil_moisture_pct: Any,
        metadata: dict[str, Any],
    ) -> dict[str, Any]:
        features = self._extract_image_features(image_path)
        features.update(
            {
                "grape_species": grape_species or getattr(block, "grape_species", "") or "unknown",
                "scan_platform": getattr(scan_session, "platform", "unknown") if scan_session else "unknown",
                "block_trellis_system": getattr(block, "trellis_system", "") if block else "",
                "block_soil_type": getattr(getattr(block, "vineyard", None), "soil_type", "") if block else "",
                "block_climate_zone": getattr(getattr(block, "vineyard", None), "climate_zone", "") if block else "",
                "occlusion_percentage": _coerce_float(occlusion_percentage),
                "hanging_height_cm": _coerce_float(hanging_height_cm),
                "bbox_width_px": _coerce_float(bbox_width_px),
                "bbox_height_px": _coerce_float(bbox_height_px),
                "berry_count": _coerce_float(berry_count),
                "row_number": _coerce_float(row_number),
                "vine_number": _coerce_float(vine_number),
                "weather_temp_f": _coerce_float(weather_temp_f),
                "recent_rain_in": _coerce_float(recent_rain_in),
                "soil_moisture_pct": _coerce_float(soil_moisture_pct),
                "block_acres": _coerce_float(getattr(block, "acres", None)) if block else None,
                "block_row_count": _coerce_float(getattr(block, "row_count", None)) if block else None,
                "block_vine_count": _coerce_float(getattr(block, "vine_count", None)) if block else None,
            }
        )

        for key, value in (metadata or {}).items():
            if isinstance(value, (int, float)):
                features[f"meta_{key}"] = float(value)
            elif isinstance(value, str) and value:
                features[f"meta_{key}"] = value
        return features

    def _extract_image_features(self, image_path: str) -> dict[str, float]:
        with Image.open(image_path) as image:
            rgb_image = image.convert("RGB")
            width, height = rgb_image.size
            resized = rgb_image.resize((96, 96))

        pixels = np.asarray(resized, dtype=np.float32) / 255.0
        red = pixels[:, :, 0]
        green = pixels[:, :, 1]
        blue = pixels[:, :, 2]
        brightness = pixels.mean(axis=2)
        saturation = pixels.max(axis=2) - pixels.min(axis=2)
        gray = 0.299 * red + 0.587 * green + 0.114 * blue
        grad_x = np.abs(np.diff(gray, axis=1)).mean()
        grad_y = np.abs(np.diff(gray, axis=0)).mean()
        purple_mask = ((red + blue) * 0.5 > green * 1.05) & (saturation > 0.12) & (brightness < 0.75)
        green_mask = (green > red * 1.05) & (green > blue * 1.05)
        dark_mask = brightness < 0.25

        return {
            "image_width": float(width),
            "image_height": float(height),
            "image_aspect_ratio": float(width / height) if height else 1.0,
            "mean_red": float(red.mean()),
            "mean_green": float(green.mean()),
            "mean_blue": float(blue.mean()),
            "std_red": float(red.std()),
            "std_green": float(green.std()),
            "std_blue": float(blue.std()),
            "brightness_mean": float(brightness.mean()),
            "brightness_std": float(brightness.std()),
            "saturation_mean": float(saturation.mean()),
            "purple_ratio": float(purple_mask.mean()),
            "green_ratio": float(green_mask.mean()),
            "dark_ratio": float(dark_mask.mean()),
            "texture_strength": float(grad_x + grad_y),
        }

    def _build_schema(self, feature_dicts: list[dict[str, Any]]) -> dict[str, Any]:
        numeric_keys: set[str] = set()
        categorical_values: dict[str, set[str]] = {}

        for feature_dict in feature_dicts:
            for key, value in feature_dict.items():
                if value is None:
                    continue
                if isinstance(value, (int, float, np.integer, np.floating)):
                    numeric_keys.add(key)
                else:
                    categorical_values.setdefault(key, set()).add(str(value))

        numeric_keys_sorted = sorted(numeric_keys)
        numeric_matrix = []
        for feature_dict in feature_dicts:
            numeric_matrix.append([
                float(feature_dict.get(key)) if feature_dict.get(key) is not None else np.nan
                for key in numeric_keys_sorted
            ])
        numeric_array = np.array(numeric_matrix, dtype=float) if numeric_matrix else np.empty((0, 0))
        means = np.nanmean(numeric_array, axis=0) if numeric_array.size else np.array([])
        means = np.where(np.isnan(means), 0.0, means)
        stds = np.nanstd(numeric_array, axis=0) if numeric_array.size else np.array([])
        stds = np.where((stds == 0) | np.isnan(stds), 1.0, stds)

        categorical_columns = []
        for key in sorted(categorical_values.keys()):
            for value in sorted(categorical_values[key]):
                categorical_columns.append(f"{key}={value}")

        return {
            "numeric_keys": numeric_keys_sorted,
            "numeric_means": means.tolist(),
            "numeric_stds": stds.tolist(),
            "categorical_columns": categorical_columns,
        }

    def _vectorize_features(self, feature_dicts: list[dict[str, Any]], schema: dict[str, Any]) -> tuple[np.ndarray, list[str]]:
        numeric_keys = schema.get("numeric_keys", [])
        numeric_means = np.array(schema.get("numeric_means", []), dtype=float)
        numeric_stds = np.array(schema.get("numeric_stds", []), dtype=float)
        categorical_columns = schema.get("categorical_columns", [])
        column_index = {column: idx for idx, column in enumerate(categorical_columns)}

        rows = []
        for feature_dict in feature_dicts:
            numeric_values = []
            for idx, key in enumerate(numeric_keys):
                raw_value = feature_dict.get(key)
                value = numeric_means[idx] if raw_value is None else float(raw_value)
                numeric_values.append((value - numeric_means[idx]) / numeric_stds[idx])

            categorical_values = np.zeros(len(categorical_columns), dtype=float)
            for key, value in feature_dict.items():
                if value is None or isinstance(value, (int, float, np.integer, np.floating)):
                    continue
                column = f"{key}={value}"
                if column in column_index:
                    categorical_values[column_index[column]] = 1.0

            rows.append(np.concatenate([np.array(numeric_values, dtype=float), categorical_values]))

        feature_names = [*numeric_keys, *categorical_columns]
        if not rows:
            return np.empty((0, len(feature_names))), feature_names
        return np.vstack(rows), feature_names

    def _fit_ridge(self, x_matrix: np.ndarray, y_vector: np.ndarray, *, alpha: float) -> dict[str, Any]:
        x_augmented = np.hstack([np.ones((x_matrix.shape[0], 1)), x_matrix])
        identity = np.eye(x_augmented.shape[1])
        identity[0, 0] = 0.0
        weights = np.linalg.pinv(x_augmented.T @ x_augmented + alpha * identity) @ x_augmented.T @ y_vector
        return {"weights": weights.tolist(), "alpha": alpha}

    def _predict_ridge(self, model: dict[str, Any], x_vector: np.ndarray) -> float:
        weights = np.array(model["weights"], dtype=float)
        return float(np.dot(np.concatenate([[1.0], x_vector]), weights))

    def _train_validation_split(self, sample_count: int) -> tuple[np.ndarray, np.ndarray]:
        if sample_count < 8:
            indices = np.arange(sample_count)
            return indices, np.array([], dtype=int)
        rng = np.random.default_rng(42)
        indices = rng.permutation(sample_count)
        validation_size = max(1, int(math.ceil(sample_count * 0.2)))
        return indices[validation_size:], indices[:validation_size]

    def _evaluate_volume_model(self, x_matrix: np.ndarray, y_vector: np.ndarray, split: tuple[np.ndarray, np.ndarray]) -> dict[str, Any]:
        train_idx, validation_idx = split
        if validation_idx.size == 0:
            model = self._fit_ridge(x_matrix, y_vector, alpha=self.default_alpha)
            predictions = np.array([self._predict_ridge(model, x_matrix[i]) for i in range(len(x_matrix))])
            actual = y_vector
        else:
            model = self._fit_ridge(x_matrix[train_idx], y_vector[train_idx], alpha=self.default_alpha)
            predictions = np.array([self._predict_ridge(model, x_matrix[i]) for i in validation_idx])
            actual = y_vector[validation_idx]

        rmse = float(np.sqrt(np.mean((predictions - actual) ** 2))) if len(actual) else 0.0
        denominator = float(np.sum((actual - actual.mean()) ** 2)) if len(actual) else 0.0
        r2 = 1.0 if denominator == 0 else float(1 - np.sum((actual - predictions) ** 2) / denominator)
        return {
            "rmse_cm3": round(rmse, 3),
            "r2": round(r2, 4),
            "evaluation_mode": "holdout" if validation_idx.size else "in_sample",
        }

    def _estimate_density(self, weight_samples: list[PreparedSample]) -> float:
        ratios = []
        for sample in weight_samples:
            if sample.weight is None or sample.volume <= 0:
                continue
            ratios.append(sample.weight / sample.volume)
        if not ratios:
            return 0.85
        return float(np.median(ratios))

    def _estimate_confidence(
        self,
        *,
        x_vector: np.ndarray,
        sample_count: int,
        rmse: float,
        prediction: float,
        feature_center: np.ndarray,
        distance_scale: float,
    ) -> float:
        sample_factor = min(1.0, math.log1p(max(sample_count, 0)) / math.log(26))
        error_factor = 1.0 / (1.0 + (rmse / max(prediction, 1.0)))
        distance = float(np.linalg.norm(x_vector - feature_center))
        distance_factor = 1.0 / (1.0 + (distance / max(distance_scale, 1e-6)))
        confidence = 0.1 + 0.45 * sample_factor + 0.25 * error_factor + 0.2 * distance_factor
        return float(max(0.05, min(0.99, confidence)))

    def _top_feature_weights(self, feature_names: list[str], model: dict[str, Any]) -> list[dict[str, Any]]:
        weights = np.abs(np.array(model["weights"][1:], dtype=float))
        ranked = np.argsort(weights)[::-1][:8]
        output = []
        for idx in ranked:
            if idx < len(feature_names):
                output.append({"feature": feature_names[idx], "weight": round(float(weights[idx]), 5)})
        return output

    def _artifact_path(self, model_version) -> Path:
        return Path(settings.MEDIA_ROOT) / "vigil" / "models" / str(model_version.producer_id) / f"model_{model_version.id}.pkl"

    def _load_artifact(self, model_version) -> dict[str, Any]:
        if not model_version.artifact_path:
            raise ValueError("Selected model does not have a trained artifact.")
        artifact_path = Path(settings.MEDIA_ROOT) / model_version.artifact_path
        if not artifact_path.exists():
            raise FileNotFoundError("Model artifact file is missing.")
        with artifact_path.open("rb") as artifact_file:
            return pickle.load(artifact_file)

    def _round_features(self, features: dict[str, Any]) -> dict[str, Any]:
        rounded = {}
        for key, value in features.items():
            if isinstance(value, float):
                rounded[key] = round(value, 5)
            else:
                rounded[key] = value
        return rounded
