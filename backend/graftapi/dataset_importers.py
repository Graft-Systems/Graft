from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Any

from django.conf import settings
from django.core.files import File
from django.utils import timezone

from .models.vigil import VigilTrainingSample, VigilMLModelVersion
from .vigil_engine import VigilMLEngine
from .vigil_ml_service import VigilMLService


ml_service = VigilMLService()


MAX_DATASET_FILES = 100


@dataclass
class ImportSummary:
    imported_samples: int
    skipped_samples: int
    total_candidate_rows: int
    capped_files: bool
    source_label: str
    trained_model: VigilMLModelVersion | None = None


class GrapesNetImporter:
    dataset_key = "grapesnet"
    dataset_name = "GrapesNet"
    supported_subset = "Dataset 4 RGB-D weight-estimation subset"
    grape_species = "Sonaka"

    def get_definition(self) -> dict[str, Any]:
        return {
            "key": self.dataset_key,
            "name": self.dataset_name,
            "description": "Imports GrapesNet Dataset 4 labeled RGB-D samples for cluster volume and weight training.",
            "supports_folder_upload": True,
            "supports_bundled_source": True,
            "max_files": MAX_DATASET_FILES,
            "expected_format": {
                "ground_truth_csv": "Dataset 4/RGB-D/Ground Truth for Dataset 4.csv",
                "color_images": "Dataset 4/RGB-D/*_Color.png or Dataset 4/RGB/*_Color.png",
                "depth_metadata": "Dataset 4/RGB-D/*_Depth_metadata.csv",
                "ground_truth_columns": [
                    "Image No.",
                    "Cluster No.",
                    "Height(cm)",
                    "Width(cm)",
                    "Distance(cm)",
                    "Ground truth:Weight(kg)",
                ],
            },
        }

    def bundled_root(self) -> Path:
        return Path(settings.BASE_DIR).parent / "GrapesNet"

    def bundled_root_exists(self) -> bool:
        return self.bundled_root().exists()

    def import_from_bundled_root(self, producer, *, max_files: int, train_after_import: bool, model_name: str, notes: str = "") -> ImportSummary:
        dataset_root = self.bundled_root()
        if not dataset_root.exists():
            raise FileNotFoundError("Bundled GrapesNet folder not found in the workspace.")
        return self._import_from_root(
            producer,
            dataset_root=dataset_root,
            max_files=max_files,
            train_after_import=train_after_import,
            model_name=model_name.strip(),
            notes=notes.strip(),
            source_label="bundled-root",
        )

    def import_from_uploaded_files(
        self,
        producer,
        *,
        uploaded_files,
        relative_paths: list[str],
        max_files: int,
        train_after_import: bool,
        model_name: str,
        notes: str = "",
    ) -> ImportSummary:
        file_limit = min(max_files, MAX_DATASET_FILES)
        prioritized_files = self._prioritize_uploaded_files(uploaded_files, relative_paths, file_limit)
        capped_files = len(prioritized_files) < len(uploaded_files)
        selected_files = [item[0] for item in prioritized_files]
        selected_paths = [item[1] for item in prioritized_files]

        with TemporaryDirectory() as temp_dir:
            temp_root = Path(temp_dir) / self.dataset_name
            for uploaded_file, relative_path in zip(selected_files, selected_paths):
                safe_relative_path = Path(relative_path or uploaded_file.name)
                destination = temp_root / safe_relative_path
                destination.parent.mkdir(parents=True, exist_ok=True)
                with destination.open("wb+") as target:
                    for chunk in uploaded_file.chunks():
                        target.write(chunk)

            summary = self._import_from_root(
                producer,
                dataset_root=temp_root,
                max_files=file_limit,
                train_after_import=train_after_import,
                model_name=model_name.strip(),
                notes=notes.strip(),
                source_label="folder-upload",
            )
            summary.capped_files = capped_files
            return summary

    def _prioritize_uploaded_files(self, uploaded_files, relative_paths: list[str], file_limit: int):
        candidates = []
        for index, uploaded_file in enumerate(uploaded_files):
            relative_path = relative_paths[index] if index < len(relative_paths) else getattr(uploaded_file, "name", f"file_{index}")
            normalized = relative_path.replace("\\", "/")
            priority = self._path_priority(normalized)
            candidates.append((priority, index, uploaded_file, relative_path))

        prioritized = [item for item in sorted(candidates, key=lambda item: (item[0], item[1])) if item[0] < 99]
        return [(uploaded_file, relative_path) for _, _, uploaded_file, relative_path in prioritized[:file_limit]]

    def _path_priority(self, normalized_path: str) -> int:
        lowered = normalized_path.lower()
        if lowered.endswith("dataset 4/rgb-d/ground truth for dataset 4.csv"):
            return 0
        if "dataset 4/rgb-d/" in lowered and lowered.endswith("_color.png"):
            return 1
        if "dataset 4/rgb/" in lowered and lowered.endswith("_color.png"):
            return 2
        if "dataset 4/rgb-d/" in lowered and lowered.endswith("_depth_metadata.csv"):
            return 3
        if "dataset 4/rgb-d/" in lowered and lowered.endswith("_depth.png"):
            return 4
        if "dataset 4/rgb-d/" in lowered and lowered.endswith("_depth.raw"):
            return 5
        return 99

    def _import_from_root(
        self,
        producer,
        *,
        dataset_root: Path,
        max_files: int,
        train_after_import: bool,
        model_name: str,
        notes: str,
        source_label: str,
    ) -> ImportSummary:
        dataset_4_root = self._find_dataset_4_root(dataset_root)
        dataset_4_rgbd = dataset_4_root / "RGB-D"
        dataset_4_rgb = dataset_4_root / "RGB"
        ground_truth_path = dataset_4_rgbd / "Ground Truth for Dataset 4.csv"
        if not ground_truth_path.exists():
            raise FileNotFoundError("Ground Truth for Dataset 4.csv was not found in the provided GrapesNet folder.")

        rows = self._read_ground_truth(ground_truth_path)
        file_limit = min(max_files, MAX_DATASET_FILES)
        rows = rows[:file_limit]
        imported_samples = 0
        skipped_samples = 0

        for row in rows:
            color_filename = row["Image No."].strip()
            sample_name = f"GrapesNet Dataset4 {Path(color_filename).stem}"
            if VigilTrainingSample.objects.filter(producer=producer, sample_name=sample_name).exists():
                skipped_samples += 1
                continue

            color_path = dataset_4_rgbd / color_filename
            if not color_path.exists():
                color_path = dataset_4_rgb / color_filename
            if not color_path.exists():
                skipped_samples += 1
                continue

            stem = color_filename.replace("_Color.png", "")
            depth_png = dataset_4_rgbd / f"{stem}_Depth.png"
            depth_metadata_path = dataset_4_rgbd / f"{stem}_Depth_metadata.csv"
            metadata = {
                "dataset_key": self.dataset_key,
                "dataset_name": self.dataset_name,
                "subset": self.supported_subset,
                "cluster_no": self._safe_int(row.get("Cluster No.")),
                "height_cm": self._safe_float(row.get("Height(cm)")),
                "width_cm": self._safe_float(row.get("Width(cm)")),
                "distance_cm": self._safe_float(row.get("Distance(cm)")),
                "source_label": source_label,
                "depth_image_filename": depth_png.name if depth_png.exists() else None,
                "depth_metadata": self._read_depth_metadata(depth_metadata_path) if depth_metadata_path.exists() else {},
                "volume_formula": "ellipsoid_pi_over_6_h_w_w",
            }
            target_volume_cm3 = self._estimate_volume_cm3(metadata["height_cm"], metadata["width_cm"])
            target_weight_g = self._safe_float(row.get("Ground truth:Weight(kg)"))
            if target_weight_g is not None:
                target_weight_g *= 1000.0

            with color_path.open("rb") as image_handle:
                training_sample = VigilTrainingSample(
                    producer=producer,
                    sample_name=sample_name,
                    grape_species=self.grape_species,
                    target_volume_cm3=target_volume_cm3,
                    target_weight_g=target_weight_g,
                    occlusion_percentage=0,
                    bbox_width_px=None,
                    bbox_height_px=None,
                    berry_count=None,
                    metadata=metadata,
                    notes=notes,
                )
                training_sample.image.save(color_path.name, File(image_handle), save=False)
                training_sample.hanging_height_cm = metadata["height_cm"]
                training_sample.save()
            imported_samples += 1

        trained_model = None
        if train_after_import:
            available_sample_count = VigilTrainingSample.objects.filter(
                producer=producer,
                sample_name__startswith="GrapesNet Dataset4",
            ).count()
            if available_sample_count >= VigilMLEngine.min_samples:
                trained_model = self._train_imported_model(producer, model_name=model_name, notes=notes)

        return ImportSummary(
            imported_samples=imported_samples,
            skipped_samples=skipped_samples,
            total_candidate_rows=len(rows),
            capped_files=False,
            source_label=source_label,
            trained_model=trained_model,
        )

    def _find_dataset_4_root(self, dataset_root: Path) -> Path:
        direct_root = dataset_root / "Dataset 4"
        if direct_root.exists():
            return direct_root

        matches = [path for path in dataset_root.rglob("Dataset 4") if path.is_dir()]
        if matches:
            return matches[0]

        raise FileNotFoundError("Dataset 4 folder was not found in the uploaded GrapesNet directory.")

    def _train_imported_model(self, producer, *, model_name: str, notes: str) -> VigilMLModelVersion:
        samples = list(
            VigilTrainingSample.objects.filter(
                producer=producer,
                sample_name__startswith="GrapesNet Dataset4",
            ).select_related("block", "scan_session", "block__vineyard")
        )
        if len(samples) < VigilMLEngine.min_samples:
            raise ValueError(f"At least {VigilMLEngine.min_samples} GrapesNet samples are required to train the model.")

        model_version = ml_service.create_model_version(
            producer=producer,
            name=model_name,
            notes=notes,
            is_active=True,
            algorithm="yolo-like-cv-ensemble-v2",
        )

        ml_service.train_model_sync(model_version=model_version, samples=samples)
        return model_version

    def _read_ground_truth(self, csv_path: Path) -> list[dict[str, str]]:
        with csv_path.open("r", encoding="utf-8-sig", newline="") as csv_file:
            return list(csv.DictReader(csv_file))

    def _read_depth_metadata(self, csv_path: Path) -> dict[str, Any]:
        metadata: dict[str, Any] = {}
        with csv_path.open("r", encoding="utf-8-sig", newline="") as csv_file:
            reader = csv.reader(csv_file)
            for row in reader:
                if len(row) < 2:
                    continue
                key = row[0].strip().rstrip(":")
                value = row[1].strip()
                if key:
                    metadata[key] = self._safe_float(value) if value.replace(".", "", 1).isdigit() else value
        return metadata

    def _estimate_volume_cm3(self, height_cm: float | None, width_cm: float | None) -> float:
        if height_cm is None or width_cm is None:
            return 1.0
        return max(1.0, 0.5235987756 * height_cm * width_cm * width_cm)

    def _safe_float(self, value: Any) -> float | None:
        try:
            if value in (None, ""):
                return None
            return float(value)
        except (TypeError, ValueError):
            return None

    def _safe_int(self, value: Any) -> int | None:
        try:
            if value in (None, ""):
                return None
            return int(float(value))
        except (TypeError, ValueError):
            return None


DATASET_IMPORTERS = {
    GrapesNetImporter.dataset_key: GrapesNetImporter(),
}


def get_dataset_importer(dataset_key: str):
    return DATASET_IMPORTERS.get(dataset_key)
