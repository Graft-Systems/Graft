from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

from django.http import FileResponse
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone

from .models.vigil import GrapeSpeciesProfile, VigilInferenceResult
from .models.wine import Producer

PLACEHOLDER_IMAGE_URL = "/vigil-grape-cluster-bg.svg"
MASTER_DATASET_IMAGE_DIR = Path("/Users/arnavchittiprolu/master_dataset/images")


@dataclass
class InferencePoint:
    block_id: int
    block_name: str
    vineyard_name: str
    row_number: int
    vine_number: int
    clone_type: str
    weight_g: float
    confidence: float
    cluster_estimate: float
    photo_id: int
    image_url: str
    captured_at: Any


def _get_producer(request):
    try:
        return request.user.producer_profile
    except Producer.DoesNotExist:
        return None


def _block_feature_id(block_id: int) -> str:
    return f"block-{block_id}"


def _row_feature_id(block_id: int, row_number: int) -> str:
    return f"row-{block_id}-{row_number}"


def _vine_feature_id(block_id: int, row_number: int, vine_number: int) -> str:
    return f"vine-{block_id}-{row_number}-{vine_number}"


def _polygon_feature(feature_id: str, name: str, coords: list[list[float]], level: str, clone: str) -> dict[str, Any]:
    return {
        "type": "Feature",
        "id": feature_id,
        "geometry": {"type": "Polygon", "coordinates": [coords]},
        "properties": {"id": feature_id, "name": name, "level": level, "clone_type": clone},
    }


def _point_feature(feature_id: str, name: str, lon: float, lat: float, clone: str, row_id: str) -> dict[str, Any]:
    return {
        "type": "Feature",
        "id": feature_id,
        "geometry": {"type": "Point", "coordinates": [lon, lat]},
        "properties": {"id": feature_id, "name": name, "level": "vine", "clone_type": clone, "row_id": row_id},
    }


def _rows_for_block(points: list[InferencePoint], block_id: int) -> list[int]:
    values = sorted({point.row_number for point in points if point.block_id == block_id and point.row_number is not None})
    return values or [1, 2, 3]


def _vines_for_row(points: list[InferencePoint], block_id: int, row_number: int) -> list[int]:
    values = sorted(
        {
            point.vine_number
            for point in points
            if point.block_id == block_id and point.row_number == row_number and point.vine_number is not None
        }
    )
    return values or [1, 2, 3, 4, 5, 6]


def _average_weight(points: list[InferencePoint], block_id: int, row_number: int | None = None, vine_number: int | None = None) -> float:
    scoped = [
        point.weight_g
        for point in points
        if point.block_id == block_id
        and (row_number is None or point.row_number == row_number)
        and (vine_number is None or point.vine_number == vine_number)
    ]
    if not scoped:
        return 0.0
    return sum(scoped) / len(scoped)


def _build_layers(points: list[InferencePoint]) -> dict[str, Any]:
    block_ids = sorted({point.block_id for point in points})
    blocks = []
    rows = []
    vines = []

    if not block_ids:
        return {
            "vineyard": {"id": "demo-empty", "name": "No Inference Data"},
            "blocks": {"type": "FeatureCollection", "features": []},
            "rows": {"type": "FeatureCollection", "features": []},
            "vines": {"type": "FeatureCollection", "features": []},
        }

    base_lon = -122.432
    base_lat = 38.503
    block_w = 0.005
    block_h = 0.004
    block_gap = 0.0008

    block_name_by_id = {}
    for point in points:
        block_name_by_id[point.block_id] = point.block_name

    for block_index, block_id in enumerate(block_ids):
        clone = next((point.clone_type for point in points if point.block_id == block_id and point.clone_type), "")
        left = base_lon + block_index * (block_w + block_gap)
        right = left + block_w
        top = base_lat
        bottom = top - block_h

        block_feature_id = _block_feature_id(block_id)
        blocks.append(
            _polygon_feature(
                block_feature_id,
                block_name_by_id.get(block_id, f"Block {block_id}"),
                [[left, top], [right, top], [right, bottom], [left, bottom], [left, top]],
                "block",
                clone,
            )
        )

        row_numbers = _rows_for_block(points, block_id)
        row_height = block_h / max(len(row_numbers), 1)
        for row_idx, row_number in enumerate(row_numbers):
            row_top = top - row_idx * row_height
            row_bottom = row_top - (row_height * 0.72)
            row_id = _row_feature_id(block_id, row_number)
            rows.append(
                _polygon_feature(
                    row_id,
                    f"Row {row_number}",
                    [[left + 0.00015, row_top], [right - 0.00015, row_top], [right - 0.00015, row_bottom], [left + 0.00015, row_bottom], [left + 0.00015, row_top]],
                    "row",
                    clone,
                )
            )

            vine_numbers = _vines_for_row(points, block_id, row_number)
            span = (right - left) - 0.0006
            for vine_idx, vine_number in enumerate(vine_numbers):
                lon = left + 0.0003 + (span * (vine_idx + 1) / (len(vine_numbers) + 1))
                lat = (row_top + row_bottom) / 2
                vine_id = _vine_feature_id(block_id, row_number, vine_number)
                vines.append(_point_feature(vine_id, f"Vine {row_number}-{vine_number}", lon, lat, clone, row_id))

    vineyard_name = next((point.vineyard_name for point in points if point.vineyard_name), "Demo Vineyard")
    return {
        "vineyard": {"id": "inference-derived", "name": vineyard_name},
        "blocks": {"type": "FeatureCollection", "features": blocks},
        "rows": {"type": "FeatureCollection", "features": rows},
        "vines": {"type": "FeatureCollection", "features": vines},
    }


def _fallback_points(request) -> list[InferencePoint]:
    points: list[InferencePoint] = []
    now = timezone.now()
    dataset_images = _list_master_dataset_images()
    block_specs = [
        (1, "Demo Block A", "Cabernet Sauvignon"),
        (2, "Demo Block B", "Merlot"),
    ]
    photo_counter = 1
    for block_id, block_name, clone_type in block_specs:
        for row_number in range(1, 4):
            for vine_number in range(1, 7):
                cluster_estimate = float(22 + block_id * 2 + row_number + (vine_number % 3))
                avg_cluster_weight_g = 34.0 if clone_type == "Merlot" else 36.0
                weight_g = cluster_estimate * avg_cluster_weight_g
                confidence = min(0.98, 0.75 + (row_number * 0.03) + (vine_number * 0.01))
                image_url = _fallback_image_url(request, dataset_images, photo_counter - 1)
                points.append(
                    InferencePoint(
                        block_id=block_id,
                        block_name=block_name,
                        vineyard_name="Napa Valley Estate Vineyard",
                        row_number=row_number,
                        vine_number=vine_number,
                        clone_type=clone_type,
                        weight_g=weight_g,
                        confidence=confidence,
                        cluster_estimate=cluster_estimate,
                        photo_id=photo_counter,
                        image_url=image_url,
                        captured_at=now,
                    )
                )
                photo_counter += 1
    return points


def _list_master_dataset_images() -> list[Path]:
    if not MASTER_DATASET_IMAGE_DIR.exists():
        return []
    image_paths: list[Path] = []
    for suffix in ("*.jpg", "*.jpeg", "*.png", "*.JPG", "*.JPEG", "*.PNG"):
        image_paths.extend(MASTER_DATASET_IMAGE_DIR.rglob(suffix))
    return sorted(path for path in image_paths if path.is_file())


def _fallback_image_url(request, dataset_images: list[Path], index: int) -> str:
    if not dataset_images:
        return PLACEHOLDER_IMAGE_URL
    image_path = dataset_images[index % len(dataset_images)]
    relative_path = image_path.relative_to(MASTER_DATASET_IMAGE_DIR).as_posix()
    return request.build_absolute_uri(f"/api/vigil/demo-geoyield/images/{relative_path}/")


def _load_points_for_producer(producer, request) -> list[InferencePoint]:
    queryset = (
        VigilInferenceResult.objects.filter(
            producer=producer,
        )
        .select_related("block", "block__vineyard")
        .order_by("-created_at")
    )

    def _extract_int(item: VigilInferenceResult, key: str) -> int | None:
        for source in (item.input_payload or {}, item.features or {}):
            value = source.get(key)
            if value in (None, ""):
                continue
            try:
                return int(float(value))
            except (TypeError, ValueError):
                continue
        return None

    def _extract_float(item: VigilInferenceResult, keys: tuple[str, ...]) -> float | None:
        for key in keys:
            for source in (item.input_payload or {}, item.features or {}):
                value = source.get(key)
                if value in (None, ""):
                    continue
                try:
                    return float(value)
                except (TypeError, ValueError):
                    continue
        return None

    species_avg_weight_cache: dict[str, float] = {}

    def _species_cluster_weight_g(species_name: str | None) -> float:
        if not species_name:
            return 35.0
        normalized = species_name.strip()
        if not normalized:
            return 35.0
        if normalized in species_avg_weight_cache:
            return species_avg_weight_cache[normalized]
        profile = GrapeSpeciesProfile.objects.filter(species_name__iexact=normalized).first()
        if profile and profile.avg_cluster_weight_g:
            species_avg_weight_cache[normalized] = float(profile.avg_cluster_weight_g)
        else:
            species_avg_weight_cache[normalized] = 35.0
        return species_avg_weight_cache[normalized]

    points: list[InferencePoint] = []
    block_counters: dict[int, int] = {}
    for item in queryset:
        # If legacy rows are not linked to a block yet, bucket them into demo blocks
        # so they can still be visualized and clicked with real photo payloads.
        inferred_block_id = item.block_id or ((item.id % 2) + 1)
        row_number = _extract_int(item, "row_number")
        vine_number = _extract_int(item, "vine_number")
        # Use existing inference rows whenever available, but inject deterministic
        # fallback row/vine metadata for records that do not carry those keys yet.
        if row_number is None or vine_number is None:
            block_index = block_counters.get(inferred_block_id, 0)
            row_number = (block_index % 3) + 1
            vine_number = (block_index % 6) + 1
            block_counters[inferred_block_id] = block_index + 1
        cluster_estimate = _extract_float(
            item,
            (
                "cluster_estimate",
                "detected_cluster_count",
                "clusters_detected",
                "cluster_count",
                "total_clusters_detected",
            ),
        )
        species_name = item.grape_species or (item.block.grape_species if item.block else "")
        avg_cluster_weight_g = _species_cluster_weight_g(species_name)
        # Prefer cluster-based yield if estimate is present; this aligns totals with
        # the "photo + cluster_estimate" workflow and falls back gracefully.
        if cluster_estimate is not None:
            weight_g = max(0.0, cluster_estimate * avg_cluster_weight_g)
        else:
            weight_g = float(item.predicted_weight_g or 0.0)
        image_url = request.build_absolute_uri(item.image.url) if item.image else PLACEHOLDER_IMAGE_URL
        points.append(
            InferencePoint(
                block_id=inferred_block_id,
                block_name=item.block.name if item.block else f"Block {inferred_block_id}",
                vineyard_name=item.block.vineyard.name if item.block and item.block.vineyard else "Napa Valley Estate Vineyard",
                row_number=row_number,
                vine_number=vine_number,
                clone_type=species_name,
                weight_g=weight_g,
                confidence=float(item.confidence_score or 0.0),
                cluster_estimate=float(cluster_estimate or 0.0),
                photo_id=item.id,
                image_url=image_url,
                captured_at=item.created_at,
            )
        )
    if points:
        return points
    return _fallback_points(request)


def _point_ids(point: InferencePoint) -> tuple[str, str, str]:
    block_id = _block_feature_id(point.block_id)
    row_id = _row_feature_id(point.block_id, point.row_number)
    vine_id = _vine_feature_id(point.block_id, point.row_number, point.vine_number)
    return block_id, row_id, vine_id


class DemoGeoLayersView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        producer = _get_producer(request)
        if not producer:
            return Response({"error": "Producer profile required"}, status=status.HTTP_400_BAD_REQUEST)
        points = _load_points_for_producer(producer, request)
        return Response(_build_layers(points), status=status.HTTP_200_OK)


class DemoGeoAggregateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        producer = _get_producer(request)
        if not producer:
            return Response({"error": "Producer profile required"}, status=status.HTTP_400_BAD_REQUEST)

        points = _load_points_for_producer(producer, request)
        block_ids = set(request.data.get("block_ids") or [])
        row_ids = set(request.data.get("row_ids") or [])
        vine_ids = set(request.data.get("vine_ids") or [])
        unit_preference = request.data.get("unit_preference") or "g"

        if not block_ids and not row_ids and not vine_ids:
            return Response(
                {
                    "totals": {"yield_g": 0.0, "yield_lbs": 0.0, "photo_count": 0},
                    "confidence": {"mean_g": 0.0, "stddev_g": 0.0, "avg_confidence_score": 0.0},
                    "clone_breakdown": [],
                },
                status=status.HTTP_200_OK,
            )

        selected = []
        for point in points:
            block_id, row_id, vine_id = _point_ids(point)
            if block_id in block_ids or row_id in row_ids or vine_id in vine_ids:
                selected.append(point)

        total_yield_g = sum(item.weight_g for item in selected)
        avg_conf = sum(item.confidence for item in selected) / len(selected) if selected else 0.0
        combined_stddev = (sum(((1.0 - item.confidence) * max(item.weight_g, 1.0) * 0.25) ** 2 for item in selected) ** 0.5) if selected else 0.0

        by_clone: dict[str, float] = {}
        for item in selected:
            clone = item.clone_type or "Unknown"
            by_clone[clone] = by_clone.get(clone, 0.0) + item.weight_g

        clone_breakdown = [{"clone_type": clone_name, "yield_g": yield_g} for clone_name, yield_g in sorted(by_clone.items())]

        payload = {
            "unit_preference": unit_preference,
            "totals": {
                "yield_g": round(total_yield_g, 3),
                "yield_lbs": round(total_yield_g / 453.59237, 3),
                "photo_count": len(selected),
            },
            "confidence": {
                "mean_g": round(total_yield_g, 3),
                "stddev_g": round(combined_stddev, 3),
                "avg_confidence_score": round(avg_conf, 4),
            },
            "clone_breakdown": clone_breakdown,
        }
        return Response(payload, status=status.HTTP_200_OK)


class DemoGeoVineLatestPhotoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, vine_id: str):
        producer = _get_producer(request)
        if not producer:
            return Response({"error": "Producer profile required"}, status=status.HTTP_400_BAD_REQUEST)
        points = _load_points_for_producer(producer, request)
        matches = []
        for point in points:
            _, _, computed_vine_id = _point_ids(point)
            if computed_vine_id == vine_id:
                matches.append(point)
        if not matches:
            return Response({"error": "Vine not found in demo dataset."}, status=status.HTTP_404_NOT_FOUND)
        latest = sorted(matches, key=lambda item: item.captured_at or 0, reverse=True)[0]
        stddev = (1.0 - latest.confidence) * max(latest.weight_g, 1.0) * 0.25
        return Response(
            {
                "vine_id": vine_id,
                "photo_id": str(latest.photo_id),
                "captured_at": latest.captured_at.isoformat() if latest.captured_at else None,
                "image_url": latest.image_url or PLACEHOLDER_IMAGE_URL,
                "yield_estimate": {
                    "yield_g_mean": latest.weight_g,
                    "yield_g_stddev": stddev,
                    "confidence_score": latest.confidence,
                    "cluster_estimate": latest.cluster_estimate,
                },
            },
            status=status.HTTP_200_OK,
        )


class DemoGeoImageView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, filepath: str):
        image_path = (MASTER_DATASET_IMAGE_DIR / filepath).resolve()
        dataset_root = MASTER_DATASET_IMAGE_DIR.resolve()
        if not str(image_path).startswith(f"{dataset_root}{Path('/')}") and image_path != dataset_root:
            return Response({"error": "Invalid image path"}, status=status.HTTP_400_BAD_REQUEST)
        if not image_path.exists() or not image_path.is_file():
            return Response({"error": "Image not found"}, status=status.HTTP_404_NOT_FOUND)
        content_type = "image/png" if image_path.suffix.lower() == ".png" else "image/jpeg"
        return FileResponse(image_path.open("rb"), content_type=content_type)
