from __future__ import annotations

import threading
from dataclasses import dataclass
from typing import Iterable

from django.db import close_old_connections
from django.utils import timezone

from .models.vigil import VigilMLModelVersion, VigilTrainingSample
from .vigil_engine import VigilMLEngine


@dataclass
class TrainingProgress:
    stage: str
    progress: int
    message: str


class VigilMLService:
    """Service layer to orchestrate VIGIL model training and inference outside API views."""

    def __init__(self):
        self.engine = VigilMLEngine()

    def create_model_version(self, *, producer, name: str, notes: str, is_active: bool, algorithm: str) -> VigilMLModelVersion:
        last_model = VigilMLModelVersion.objects.filter(producer=producer, name=name).order_by("-version").first()
        next_version = (last_model.version + 1) if last_model else 1
        return VigilMLModelVersion.objects.create(
            producer=producer,
            name=name,
            version=next_version,
            status="training",
            algorithm=algorithm,
            notes=notes,
            is_active=is_active,
            metrics={"training_progress": {"stage": "queued", "progress": 0, "message": "Queued for training"}},
        )

    def start_training_async(self, *, model_version_id: int, sample_ids: list[int] | None = None) -> None:
        thread = threading.Thread(
            target=self._train_model_worker,
            kwargs={"model_version_id": model_version_id, "sample_ids": sample_ids or []},
            daemon=True,
        )
        thread.start()

    def _train_model_worker(self, *, model_version_id: int, sample_ids: list[int]) -> None:
        close_old_connections()
        try:
            model_version = VigilMLModelVersion.objects.select_related("producer").get(pk=model_version_id)
            samples = VigilTrainingSample.objects.filter(producer=model_version.producer)
            if sample_ids:
                samples = samples.filter(id__in=sample_ids)

            def progress_callback(stage: str, progress: int, message: str) -> None:
                self._update_training_progress(model_version.id, stage=stage, progress=progress, message=message)

            result = self.engine.train_model(
                model_version,
                samples.select_related("block", "scan_session", "block__vineyard").iterator(chunk_size=256),
                progress_callback=progress_callback,
            )

            if model_version.is_active:
                VigilMLModelVersion.objects.filter(producer=model_version.producer).exclude(pk=model_version.pk).update(is_active=False)

            model_version.refresh_from_db()
            model_version.status = "ready"
            model_version.artifact_path = result["artifact_path"]
            model_version.feature_schema = result["feature_schema"]
            model_version.metrics = result["metrics"]
            model_version.training_sample_count = result["training_sample_count"]
            model_version.validation_sample_count = result["validation_sample_count"]
            model_version.trained_at = timezone.now()
            model_version.save(update_fields=[
                "status",
                "artifact_path",
                "feature_schema",
                "metrics",
                "training_sample_count",
                "validation_sample_count",
                "trained_at",
                "is_active",
            ])
        except Exception as exc:
            try:
                model_version = VigilMLModelVersion.objects.get(pk=model_version_id)
                existing_metrics = model_version.metrics or {}
                existing_metrics["training_progress"] = {
                    "stage": "failed",
                    "progress": 100,
                    "message": str(exc),
                }
                model_version.status = "failed"
                model_version.metrics = existing_metrics
                model_version.notes = (model_version.notes + "\n" if model_version.notes else "") + str(exc)
                model_version.save(update_fields=["status", "metrics", "notes"])
            except Exception:
                pass
        finally:
            close_old_connections()

    def train_model_sync(self, *, model_version: VigilMLModelVersion, samples: Iterable) -> dict:
        def progress_callback(stage: str, progress: int, message: str) -> None:
            self._update_training_progress(model_version.id, stage=stage, progress=progress, message=message)

        result = self.engine.train_model(model_version, samples, progress_callback=progress_callback)
        if model_version.is_active:
            VigilMLModelVersion.objects.filter(producer=model_version.producer).exclude(pk=model_version.pk).update(is_active=False)
        model_version.status = "ready"
        model_version.artifact_path = result["artifact_path"]
        model_version.feature_schema = result["feature_schema"]
        model_version.metrics = result["metrics"]
        model_version.training_sample_count = result["training_sample_count"]
        model_version.validation_sample_count = result["validation_sample_count"]
        model_version.trained_at = timezone.now()
        model_version.save(update_fields=[
            "status",
            "artifact_path",
            "feature_schema",
            "metrics",
            "training_sample_count",
            "validation_sample_count",
            "trained_at",
            "is_active",
        ])
        return result

    def _update_training_progress(self, model_version_id: int, *, stage: str, progress: int, message: str) -> None:
        model_version = VigilMLModelVersion.objects.filter(pk=model_version_id).first()
        if not model_version:
            return
        metrics = model_version.metrics or {}
        metrics["training_progress"] = {
            "stage": stage,
            "progress": max(0, min(100, int(progress))),
            "message": message,
            "updated_at": timezone.now().isoformat(),
        }
        model_version.metrics = metrics
        model_version.save(update_fields=["metrics"])

    def get_training_progress(self, model_version: VigilMLModelVersion) -> TrainingProgress:
        progress_data = (model_version.metrics or {}).get("training_progress") or {}
        stage = progress_data.get("stage") or ("ready" if model_version.status == "ready" else model_version.status)
        progress = int(progress_data.get("progress", 100 if model_version.status in {"ready", "failed"} else 0))
        message = progress_data.get("message") or model_version.get_status_display()
        return TrainingProgress(stage=stage, progress=progress, message=message)
