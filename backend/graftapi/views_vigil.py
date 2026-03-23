import json
from datetime import timedelta
from pathlib import Path

from django.db.models import Avg, Count, Sum, Q
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework import status, permissions
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .serializers_vigil import (
    VineyardSerializer,
    VineyardBlockSerializer,
    ScanSessionSerializer,
    GrapeClusterSerializer,
    PestDiseaseDetectionSerializer,
    WeatherDataSerializer,
    IrrigationLogSerializer,
    GrapeSpeciesProfileSerializer,
    YieldEstimateSerializer,
    VigilTrainingSampleSerializer,
    VigilMLModelVersionSerializer,
    VigilInferenceResultSerializer,
)
from .models.vigil import (
    Vineyard,
    VineyardBlock,
    ScanSession,
    GrapeCluster,
    PestDiseaseDetection,
    WeatherData,
    IrrigationLog,
    GrapeSpeciesProfile,
    YieldEstimate,
    VigilTrainingSample,
    VigilMLModelVersion,
    VigilInferenceResult,
)
from .models.wine import Producer
from .dataset_importers import MAX_DATASET_FILES, DATASET_IMPORTERS, get_dataset_importer
from .vigil_engine import VigilMLEngine
from .vigil_ml_service import VigilMLService


ml_service = VigilMLService()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_producer(request):
    """Return the producer profile for the authenticated user, or None."""
    try:
        return request.user.producer_profile
    except Producer.DoesNotExist:
        return None


def _parse_json_field(data, key, default):
    value = data.get(key, default)
    if value in (None, "", default):
        return default
    if isinstance(value, (dict, list)):
        return value
    try:
        return json.loads(value)
    except (TypeError, ValueError):
        return default


def _get_owned_block(producer, block_id):
    if not block_id:
        return None
    return VineyardBlock.objects.filter(pk=block_id, vineyard__producer=producer).first()


def _get_owned_scan(producer, scan_session_id):
    if not scan_session_id:
        return None
    return ScanSession.objects.filter(pk=scan_session_id, block__vineyard__producer=producer).first()


# ---------------------------------------------------------------------------
# Vineyard (list / create)
# ---------------------------------------------------------------------------

class VineyardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        producer = _get_producer(request)
        if not producer:
            return Response([], status=status.HTTP_200_OK)
        vineyards = Vineyard.objects.filter(producer=producer)
        serializer = VineyardSerializer(vineyards, many=True)
        return Response(serializer.data)

    def post(self, request):
        producer = _get_producer(request)
        if not producer:
            return Response({"error": "Producer profile required"}, status=status.HTTP_400_BAD_REQUEST)
        serializer = VineyardSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(producer=producer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# Vineyard Detail (retrieve / update / delete)
# ---------------------------------------------------------------------------

class VineyardDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, request, pk):
        producer = _get_producer(request)
        if not producer:
            return None
        return Vineyard.objects.filter(producer=producer, pk=pk).first()

    def get(self, request, pk):
        vineyard = self.get_object(request, pk)
        if not vineyard:
            return Response({"error": "Vineyard not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = VineyardSerializer(vineyard)
        return Response(serializer.data)

    def put(self, request, pk):
        vineyard = self.get_object(request, pk)
        if not vineyard:
            return Response({"error": "Vineyard not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = VineyardSerializer(vineyard, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        return self.put(request, pk)

    def delete(self, request, pk):
        vineyard = self.get_object(request, pk)
        if not vineyard:
            return Response({"error": "Vineyard not found"}, status=status.HTTP_404_NOT_FOUND)
        vineyard.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Vineyard Block (list / create)
# ---------------------------------------------------------------------------

class VineyardBlockView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        producer = _get_producer(request)
        if not producer:
            return Response([], status=status.HTTP_200_OK)
        vineyard_id = request.query_params.get("vineyard_id")
        blocks = VineyardBlock.objects.filter(vineyard__producer=producer)
        if vineyard_id:
            blocks = blocks.filter(vineyard_id=vineyard_id)
        serializer = VineyardBlockSerializer(blocks, many=True)
        return Response(serializer.data)

    def post(self, request):
        producer = _get_producer(request)
        if not producer:
            return Response({"error": "Producer profile required"}, status=status.HTTP_400_BAD_REQUEST)
        vineyard_id = request.data.get("vineyard")
        if not Vineyard.objects.filter(pk=vineyard_id, producer=producer).exists():
            return Response(
                {"error": "Vineyard not found or does not belong to you"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = VineyardBlockSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# Vineyard Block Detail (retrieve / update / delete)
# ---------------------------------------------------------------------------

class VineyardBlockDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, request, pk):
        producer = _get_producer(request)
        if not producer:
            return None
        return VineyardBlock.objects.filter(vineyard__producer=producer, pk=pk).first()

    def get(self, request, pk):
        block = self.get_object(request, pk)
        if not block:
            return Response({"error": "Block not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = VineyardBlockSerializer(block)
        return Response(serializer.data)

    def put(self, request, pk):
        block = self.get_object(request, pk)
        if not block:
            return Response({"error": "Block not found"}, status=status.HTTP_404_NOT_FOUND)
        # If the caller is moving the block to a different vineyard, validate ownership.
        vineyard_id = request.data.get("vineyard")
        if vineyard_id:
            producer = _get_producer(request)
            if not Vineyard.objects.filter(pk=vineyard_id, producer=producer).exists():
                return Response(
                    {"error": "Vineyard not found or does not belong to you"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        serializer = VineyardBlockSerializer(block, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        return self.put(request, pk)

    def delete(self, request, pk):
        block = self.get_object(request, pk)
        if not block:
            return Response({"error": "Block not found"}, status=status.HTTP_404_NOT_FOUND)
        block.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Scan Session (list / create)
# ---------------------------------------------------------------------------

class ScanSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        producer = _get_producer(request)
        if not producer:
            return Response([], status=status.HTTP_200_OK)
        block_id = request.query_params.get("block_id")
        sessions = ScanSession.objects.filter(block__vineyard__producer=producer)
        if block_id:
            sessions = sessions.filter(block_id=block_id)
        # Annotate with summary stats
        sessions = sessions.annotate(
            cluster_count=Count("clusters"),
            pest_count=Count("pest_detections"),
        )
        serializer = ScanSessionSerializer(sessions, many=True)
        # Append summary stats to each entry
        data = serializer.data
        session_map = {s.id: s for s in sessions}
        for item in data:
            session_obj = session_map.get(item["id"])
            if session_obj:
                item["cluster_count"] = session_obj.cluster_count
                item["pest_count"] = session_obj.pest_count
        return Response(data)

    def post(self, request):
        producer = _get_producer(request)
        if not producer:
            return Response({"error": "Producer profile required"}, status=status.HTTP_400_BAD_REQUEST)
        block_id = request.data.get("block")
        if not VineyardBlock.objects.filter(pk=block_id, vineyard__producer=producer).exists():
            return Response(
                {"error": "Block not found or does not belong to you"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = ScanSessionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# Scan Session Detail (retrieve / update / delete)
# ---------------------------------------------------------------------------

class ScanSessionDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, request, pk):
        producer = _get_producer(request)
        if not producer:
            return None
        return ScanSession.objects.filter(block__vineyard__producer=producer, pk=pk).first()

    def get(self, request, pk):
        session = self.get_object(request, pk)
        if not session:
            return Response({"error": "Scan session not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = ScanSessionSerializer(session)
        data = serializer.data
        # Include cluster counts breakdown
        clusters = session.clusters.all()
        data["cluster_counts"] = {
            "total": clusters.count(),
            "full": clusters.filter(visibility="full").count(),
            "partial": clusters.filter(visibility="partial").count(),
            "estimated": clusters.filter(visibility="estimated").count(),
        }
        return Response(data)

    def put(self, request, pk):
        session = self.get_object(request, pk)
        if not session:
            return Response({"error": "Scan session not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = ScanSessionSerializer(session, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        return self.put(request, pk)

    def delete(self, request, pk):
        session = self.get_object(request, pk)
        if not session:
            return Response({"error": "Scan session not found"}, status=status.HTTP_404_NOT_FOUND)
        session.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Grape Cluster (list -- read-only, populated by CV pipeline)
# ---------------------------------------------------------------------------

class GrapeClusterView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        producer = _get_producer(request)
        if not producer:
            return Response([], status=status.HTTP_200_OK)
        scan_session_id = request.query_params.get("scan_session_id")
        clusters = GrapeCluster.objects.filter(scan_session__block__vineyard__producer=producer)
        if scan_session_id:
            clusters = clusters.filter(scan_session_id=scan_session_id)
        serializer = GrapeClusterSerializer(clusters, many=True)
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# Pest / Disease Detection (list / create)
# ---------------------------------------------------------------------------

class PestDiseaseDetectionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        producer = _get_producer(request)
        if not producer:
            return Response([], status=status.HTTP_200_OK)
        scan_session_id = request.query_params.get("scan_session_id")
        detections = PestDiseaseDetection.objects.filter(
            scan_session__block__vineyard__producer=producer
        )
        if scan_session_id:
            detections = detections.filter(scan_session_id=scan_session_id)
        serializer = PestDiseaseDetectionSerializer(detections, many=True)
        return Response(serializer.data)

    def post(self, request):
        producer = _get_producer(request)
        if not producer:
            return Response({"error": "Producer profile required"}, status=status.HTTP_400_BAD_REQUEST)
        scan_session_id = request.data.get("scan_session")
        if not ScanSession.objects.filter(
            pk=scan_session_id, block__vineyard__producer=producer
        ).exists():
            return Response(
                {"error": "Scan session not found or does not belong to you"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = PestDiseaseDetectionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# Weather Data (list / create)
# ---------------------------------------------------------------------------

class WeatherDataView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        producer = _get_producer(request)
        if not producer:
            return Response([], status=status.HTTP_200_OK)
        vineyard_id = request.query_params.get("vineyard_id")
        weather = WeatherData.objects.filter(vineyard__producer=producer)
        if vineyard_id:
            weather = weather.filter(vineyard_id=vineyard_id)
        # Optional filters: source, date_from, date_to
        source = request.query_params.get("source")
        if source:
            weather = weather.filter(source=source)
        date_from = request.query_params.get("date_from")
        if date_from:
            weather = weather.filter(date__gte=date_from)
        date_to = request.query_params.get("date_to")
        if date_to:
            weather = weather.filter(date__lte=date_to)
        serializer = WeatherDataSerializer(weather, many=True)
        return Response(serializer.data)

    def post(self, request):
        producer = _get_producer(request)
        if not producer:
            return Response({"error": "Producer profile required"}, status=status.HTTP_400_BAD_REQUEST)
        vineyard_id = request.data.get("vineyard")
        if not Vineyard.objects.filter(pk=vineyard_id, producer=producer).exists():
            return Response(
                {"error": "Vineyard not found or does not belong to you"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = WeatherDataSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# Irrigation Log (list / create)
# ---------------------------------------------------------------------------

class IrrigationLogView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        producer = _get_producer(request)
        if not producer:
            return Response([], status=status.HTTP_200_OK)
        block_id = request.query_params.get("block_id")
        logs = IrrigationLog.objects.filter(block__vineyard__producer=producer)
        if block_id:
            logs = logs.filter(block_id=block_id)
        serializer = IrrigationLogSerializer(logs, many=True)
        return Response(serializer.data)

    def post(self, request):
        producer = _get_producer(request)
        if not producer:
            return Response({"error": "Producer profile required"}, status=status.HTTP_400_BAD_REQUEST)
        block_id = request.data.get("block")
        if not VineyardBlock.objects.filter(pk=block_id, vineyard__producer=producer).exists():
            return Response(
                {"error": "Block not found or does not belong to you"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = IrrigationLogSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# Irrigation Log Detail (retrieve / update / delete)
# ---------------------------------------------------------------------------

class IrrigationLogDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, request, pk):
        producer = _get_producer(request)
        if not producer:
            return None
        return IrrigationLog.objects.filter(block__vineyard__producer=producer, pk=pk).first()

    def get(self, request, pk):
        log = self.get_object(request, pk)
        if not log:
            return Response({"error": "Irrigation log not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = IrrigationLogSerializer(log)
        return Response(serializer.data)

    def put(self, request, pk):
        log = self.get_object(request, pk)
        if not log:
            return Response({"error": "Irrigation log not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = IrrigationLogSerializer(log, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        return self.put(request, pk)

    def delete(self, request, pk):
        log = self.get_object(request, pk)
        if not log:
            return Response({"error": "Irrigation log not found"}, status=status.HTTP_404_NOT_FOUND)
        log.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Grape Species Profile (shared reference data)
# ---------------------------------------------------------------------------

class GrapeSpeciesProfileView(APIView):
    """
    Shared reference data -- not scoped to a producer.
    GET is open to any user; POST requires authentication.
    """

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [permissions.IsAuthenticated()]

    def get(self, request):
        profiles = GrapeSpeciesProfile.objects.all().order_by("species_name")
        serializer = GrapeSpeciesProfileSerializer(profiles, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = GrapeSpeciesProfileSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# Yield Estimate (list / create)
# ---------------------------------------------------------------------------

class YieldEstimateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        producer = _get_producer(request)
        if not producer:
            return Response([], status=status.HTTP_200_OK)
        block_id = request.query_params.get("block_id")
        estimates = YieldEstimate.objects.filter(block__vineyard__producer=producer)
        if block_id:
            estimates = estimates.filter(block_id=block_id)
        serializer = YieldEstimateSerializer(estimates, many=True)
        # Group by estimate_date to present bear/base/bull scenarios together
        data = serializer.data
        return Response(data)

    def post(self, request):
        producer = _get_producer(request)
        if not producer:
            return Response({"error": "Producer profile required"}, status=status.HTTP_400_BAD_REQUEST)
        block_id = request.data.get("block")
        if not VineyardBlock.objects.filter(pk=block_id, vineyard__producer=producer).exists():
            return Response(
                {"error": "Block not found or does not belong to you"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = YieldEstimateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# Yield Estimate Detail (retrieve / update / delete)
# ---------------------------------------------------------------------------

class YieldEstimateDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, request, pk):
        producer = _get_producer(request)
        if not producer:
            return None
        return YieldEstimate.objects.filter(block__vineyard__producer=producer, pk=pk).first()

    def get(self, request, pk):
        estimate = self.get_object(request, pk)
        if not estimate:
            return Response({"error": "Yield estimate not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = YieldEstimateSerializer(estimate)
        return Response(serializer.data)

    def put(self, request, pk):
        estimate = self.get_object(request, pk)
        if not estimate:
            return Response({"error": "Yield estimate not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = YieldEstimateSerializer(estimate, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        return self.put(request, pk)

    def delete(self, request, pk):
        estimate = self.get_object(request, pk)
        if not estimate:
            return Response({"error": "Yield estimate not found"}, status=status.HTTP_404_NOT_FOUND)
        estimate.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# VIGIL Dashboard Summary (aggregated overview)
# ---------------------------------------------------------------------------

class VigilDashboardSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        producer = _get_producer(request)
        if not producer:
            return Response({"error": "Producer profile required"}, status=status.HTTP_400_BAD_REQUEST)

        vineyards = Vineyard.objects.filter(producer=producer)
        blocks = VineyardBlock.objects.filter(vineyard__producer=producer)
        scan_sessions = ScanSession.objects.filter(block__vineyard__producer=producer)

        total_vineyards = vineyards.count()
        total_blocks = blocks.count()
        total_scan_sessions = scan_sessions.count()

        # Latest scan data across all blocks
        latest_scan = scan_sessions.order_by("-scan_date").first()
        latest_scan_data = None
        if latest_scan:
            latest_scan_data = {
                "id": latest_scan.id,
                "block": latest_scan.block.name,
                "vineyard": latest_scan.block.vineyard.name,
                "scan_date": latest_scan.scan_date,
                "status": latest_scan.status,
                "total_clusters_detected": latest_scan.total_clusters_detected,
                "estimated_yield_tons_per_acre": latest_scan.estimated_yield_tons_per_acre,
            }

        # Average yield estimate (base scenario) across all blocks
        avg_yield = YieldEstimate.objects.filter(
            block__vineyard__producer=producer,
            scenario="base",
        ).aggregate(avg=Avg("estimated_tons_per_acre"))["avg"]

        # Active pest/disease alerts count (moderate, high, or severe)
        active_pest_alerts = PestDiseaseDetection.objects.filter(
            scan_session__block__vineyard__producer=producer,
            severity__in=["moderate", "high", "severe"],
        ).count()

        # Weather forecast summary: next 10 days precipitation total and avg temp
        today = timezone.now().date()
        forecast_end = today + timedelta(days=10)
        forecast_qs = WeatherData.objects.filter(
            vineyard__producer=producer,
            source="forecast",
            date__gte=today,
            date__lte=forecast_end,
        )
        forecast_agg = forecast_qs.aggregate(
            total_precipitation_in=Sum("precipitation_in"),
            avg_temp_high_f=Avg("temp_high_f"),
            avg_temp_low_f=Avg("temp_low_f"),
        )

        weather_forecast_summary = {
            "next_10_days_precipitation_in": (
                float(forecast_agg["total_precipitation_in"])
                if forecast_agg["total_precipitation_in"] is not None
                else 0.0
            ),
            "next_10_days_avg_temp_high_f": (
                round(float(forecast_agg["avg_temp_high_f"]), 1)
                if forecast_agg["avg_temp_high_f"] is not None
                else None
            ),
            "next_10_days_avg_temp_low_f": (
                round(float(forecast_agg["avg_temp_low_f"]), 1)
                if forecast_agg["avg_temp_low_f"] is not None
                else None
            ),
        }

        payload = {
            "total_vineyards": total_vineyards,
            "total_blocks": total_blocks,
            "total_scan_sessions": total_scan_sessions,
            "training_sample_count": VigilTrainingSample.objects.filter(producer=producer).count(),
            "trained_model_count": VigilMLModelVersion.objects.filter(producer=producer, status="ready").count(),
            "prediction_count": VigilInferenceResult.objects.filter(producer=producer).count(),
            "latest_scan": latest_scan_data,
            "avg_yield_estimate_base_tons_per_acre": (
                round(float(avg_yield), 3) if avg_yield is not None else None
            ),
            "active_pest_disease_alerts": active_pest_alerts,
            "weather_forecast_summary": weather_forecast_summary,
        }
        return Response(payload, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# VIGIL ML Training Samples
# ---------------------------------------------------------------------------

class VigilTrainingSampleView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        producer = _get_producer(request)
        if not producer:
            return Response([], status=status.HTTP_200_OK)
        block_id = request.query_params.get("block_id")
        samples = VigilTrainingSample.objects.filter(producer=producer)
        if block_id:
            samples = samples.filter(block_id=block_id)
        serializer = VigilTrainingSampleSerializer(samples, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        producer = _get_producer(request)
        if not producer:
            return Response({"error": "Producer profile required"}, status=status.HTTP_400_BAD_REQUEST)

        block = _get_owned_block(producer, request.data.get("block"))
        if request.data.get("block") and not block:
            return Response({"error": "Block not found or does not belong to you"}, status=status.HTTP_400_BAD_REQUEST)

        scan_session = _get_owned_scan(producer, request.data.get("scan_session"))
        if request.data.get("scan_session") and not scan_session:
            return Response({"error": "Scan session not found or does not belong to you"}, status=status.HTTP_400_BAD_REQUEST)

        uploaded_images = request.FILES.getlist("images")
        if uploaded_images:
            if not request.data.get("target_volume_cm3"):
                return Response(
                    {"error": "target_volume_cm3 is required for batch upload."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            created_samples = []
            for uploaded_image in uploaded_images:
                data = request.data.copy()
                data["image"] = uploaded_image
                data["sample_name"] = data.get("sample_name") or uploaded_image.name
                data["metadata"] = json.dumps(_parse_json_field(request.data, "metadata", {}))
                if not data.get("grape_species") and block:
                    data["grape_species"] = block.grape_species

                serializer = VigilTrainingSampleSerializer(data=data, context={"request": request})
                if not serializer.is_valid():
                    return Response(
                        {
                            "error": f"Invalid sample in batch at file: {uploaded_image.name}",
                            "details": serializer.errors,
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                created_samples.append(serializer.save(producer=producer, block=block, scan_session=scan_session))

            response_data = VigilTrainingSampleSerializer(created_samples, many=True, context={"request": request}).data
            return Response({"created": len(created_samples), "samples": response_data}, status=status.HTTP_201_CREATED)

        data = request.data.copy()
        data["metadata"] = json.dumps(_parse_json_field(request.data, "metadata", {}))
        if not data.get("grape_species") and block:
            data["grape_species"] = block.grape_species

        serializer = VigilTrainingSampleSerializer(data=data, context={"request": request})
        if serializer.is_valid():
            serializer.save(producer=producer, block=block, scan_session=scan_session)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VigilTrainingSampleDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, request, pk):
        producer = _get_producer(request)
        if not producer:
            return None
        return VigilTrainingSample.objects.filter(producer=producer, pk=pk).first()

    def get(self, request, pk):
        sample = self.get_object(request, pk)
        if not sample:
            return Response({"error": "Training sample not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = VigilTrainingSampleSerializer(sample, context={"request": request})
        return Response(serializer.data)

    def delete(self, request, pk):
        sample = self.get_object(request, pk)
        if not sample:
            return Response({"error": "Training sample not found"}, status=status.HTTP_404_NOT_FOUND)
        sample.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# VIGIL ML Models and Inference
# ---------------------------------------------------------------------------

class VigilMLModelVersionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        producer = _get_producer(request)
        if not producer:
            return Response([], status=status.HTTP_200_OK)
        active_only = request.query_params.get("active_only") == "true"
        models = VigilMLModelVersion.objects.filter(producer=producer).order_by("-created_at", "-id")
        if active_only:
            models = models.filter(is_active=True)
        serializer = VigilMLModelVersionSerializer(models, many=True)
        return Response(serializer.data)


class VigilModelTrainView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        producer = _get_producer(request)
        if not producer:
            return Response({"error": "Producer profile required"}, status=status.HTTP_400_BAD_REQUEST)

        model_name = (request.data.get("name") or "Cluster Volume Model").strip()
        block_id = request.data.get("block_id")
        sample_ids = request.data.get("sample_ids") or []
        if isinstance(sample_ids, str):
            try:
                sample_ids = json.loads(sample_ids)
            except ValueError:
                sample_ids = []

        samples = VigilTrainingSample.objects.filter(producer=producer)
        if block_id:
            samples = samples.filter(block_id=block_id)
        if sample_ids:
            samples = samples.filter(id__in=sample_ids)

        sample_count = samples.count()
        if sample_count < VigilMLEngine.min_samples:
            return Response(
                {"error": f"At least {VigilMLEngine.min_samples} training samples are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        model_version = ml_service.create_model_version(
            producer=producer,
            name=model_name,
            notes=(request.data.get("notes", "") or "").strip(),
            is_active=bool(request.data.get("is_active", True)),
            algorithm="yolo-like-cv-ensemble-v2",
        )

        ml_service.start_training_async(model_version_id=model_version.id, sample_ids=list(sample_ids) if sample_ids else None)

        serializer = VigilMLModelVersionSerializer(model_version)
        return Response(serializer.data, status=status.HTTP_202_ACCEPTED)


class VigilModelTrainProgressView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, model_id):
        producer = _get_producer(request)
        if not producer:
            return Response({"error": "Producer profile required"}, status=status.HTTP_400_BAD_REQUEST)

        model_version = VigilMLModelVersion.objects.filter(producer=producer, pk=model_id).first()
        if not model_version:
            return Response({"error": "Model not found"}, status=status.HTTP_404_NOT_FOUND)

        progress = ml_service.get_training_progress(model_version)
        return Response(
            {
                "model_id": model_version.id,
                "status": model_version.status,
                "stage": progress.stage,
                "progress": progress.progress,
                "message": progress.message,
                "trained_at": model_version.trained_at,
            },
            status=status.HTTP_200_OK,
        )


class VigilInferenceView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        producer = _get_producer(request)
        if not producer:
            return Response([], status=status.HTTP_200_OK)
        block_id = request.query_params.get("block_id")
        scan_session_id = request.query_params.get("scan_session_id")
        predictions = VigilInferenceResult.objects.filter(producer=producer)
        if block_id:
            predictions = predictions.filter(block_id=block_id)
        if scan_session_id:
            predictions = predictions.filter(scan_session_id=scan_session_id)
        serializer = VigilInferenceResultSerializer(predictions[:25], many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        producer = _get_producer(request)
        if not producer:
            return Response({"error": "Producer profile required"}, status=status.HTTP_400_BAD_REQUEST)

        model_version_id = request.data.get("model_version")
        if model_version_id:
            model_version = VigilMLModelVersion.objects.filter(
                producer=producer, pk=model_version_id, status="ready"
            ).first()
        else:
            model_version = VigilMLModelVersion.objects.filter(
                producer=producer, status="ready", is_active=True
            ).order_by("-created_at").first()
        if not model_version:
            return Response({"error": "No ready model found. Train a model first."}, status=status.HTTP_400_BAD_REQUEST)

        block = _get_owned_block(producer, request.data.get("block"))
        if request.data.get("block") and not block:
            return Response({"error": "Block not found or does not belong to you"}, status=status.HTTP_400_BAD_REQUEST)

        scan_session = _get_owned_scan(producer, request.data.get("scan_session"))
        if request.data.get("scan_session") and not scan_session:
            return Response({"error": "Scan session not found or does not belong to you"}, status=status.HTTP_400_BAD_REQUEST)

        image = request.FILES.get("image")
        if not image:
            return Response({"error": "An image file is required for prediction."}, status=status.HTTP_400_BAD_REQUEST)

        metadata = _parse_json_field(request.data, "metadata", {})
        payload = {
            "grape_species": request.data.get("grape_species") or (block.grape_species if block else ""),
            "occlusion_percentage": request.data.get("occlusion_percentage"),
            "hanging_height_cm": request.data.get("hanging_height_cm"),
            "bbox_width_px": request.data.get("bbox_width_px"),
            "bbox_height_px": request.data.get("bbox_height_px"),
            "berry_count": request.data.get("berry_count"),
            "row_number": request.data.get("row_number"),
            "vine_number": request.data.get("vine_number"),
            "weather_temp_f": request.data.get("weather_temp_f"),
            "recent_rain_in": request.data.get("recent_rain_in"),
            "soil_moisture_pct": request.data.get("soil_moisture_pct"),
            "metadata": metadata,
        }

        inference = VigilInferenceResult.objects.create(
            producer=producer,
            model_version=model_version,
            block=block,
            scan_session=scan_session,
            sample_name=request.data.get("sample_name", ""),
            image=image,
            grape_species=payload["grape_species"] or "",
            predicted_volume_cm3=0,
            predicted_weight_g=0,
            confidence_score=0,
            input_payload=payload,
        )

        engine = VigilMLEngine()
        try:
            annotated_output = None
            if inference.image and inference.image.name:
                image_path = inference.image.path
                suffix = Path(image_path).suffix or ".jpg"
                annotated_output = str(Path(image_path).with_name(f"{Path(image_path).stem}_annotated{suffix}"))

            prediction = engine.predict(
                model_version,
                image_path=inference.image.path,
                block=block,
                scan_session=scan_session,
                payload=payload,
                annotation_output_path=annotated_output,
            )
        except Exception as exc:
            inference.delete()
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        inference.predicted_volume_cm3 = prediction["predicted_volume_cm3"]
        inference.predicted_weight_g = prediction["predicted_weight_g"]
        inference.confidence_score = prediction["confidence_score"]
        inference.features = {
            **prediction["features"],
            "detections": prediction.get("detections", []),
            "annotated_image_path": prediction.get("annotated_image_path"),
        }
        inference.save()

        serializer = VigilInferenceResultSerializer(inference, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class VigilDatasetSourceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        sources = []
        for importer in DATASET_IMPORTERS.values():
            definition = importer.get_definition()
            definition["bundled_root_available"] = importer.bundled_root_exists() if hasattr(importer, "bundled_root_exists") else False
            sources.append(definition)
        return Response(sources)


class VigilDatasetImportView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, dataset_key):
        producer = _get_producer(request)
        if not producer:
            return Response({"error": "Producer profile required"}, status=status.HTTP_400_BAD_REQUEST)

        importer = get_dataset_importer(dataset_key)
        if not importer:
            return Response({"error": "Unsupported dataset source."}, status=status.HTTP_404_NOT_FOUND)

        train_after_import = str(request.data.get("train_after_import", "false")).lower() == "true"
        model_name = (request.data.get("model_name") or f"{importer.dataset_name} Model").strip()
        notes = (request.data.get("notes", "") or "").strip()
        source_mode = request.data.get("source_mode", "upload")
        max_files = min(int(request.data.get("max_files") or MAX_DATASET_FILES), MAX_DATASET_FILES)

        try:
            if source_mode == "bundled":
                summary = importer.import_from_bundled_root(
                    producer,
                    max_files=max_files,
                    train_after_import=train_after_import,
                    model_name=model_name,
                    notes=notes,
                )
            else:
                uploaded_files = request.FILES.getlist("files")
                if not uploaded_files:
                    return Response({"error": "Upload at least one dataset file."}, status=status.HTTP_400_BAD_REQUEST)
                raw_relative_paths = request.data.get("relative_paths") or "[]"
                try:
                    relative_paths = json.loads(raw_relative_paths)
                except json.JSONDecodeError:
                    relative_paths = []
                if len(relative_paths) != len(uploaded_files):
                    relative_paths = [getattr(file, "name", f"file_{index}") for index, file in enumerate(uploaded_files)]
                summary = importer.import_from_uploaded_files(
                    producer,
                    uploaded_files=uploaded_files,
                    relative_paths=relative_paths,
                    max_files=max_files,
                    train_after_import=train_after_import,
                    model_name=model_name,
                    notes=notes,
                )
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        payload = {
            "dataset_key": dataset_key,
            "dataset_name": importer.dataset_name,
            "source_label": summary.source_label,
            "imported_samples": summary.imported_samples,
            "skipped_samples": summary.skipped_samples,
            "total_candidate_rows": summary.total_candidate_rows,
            "capped_files": summary.capped_files,
            "available_training_samples": VigilTrainingSample.objects.filter(producer=producer).count(),
        }
        if summary.trained_model:
            payload["trained_model"] = VigilMLModelVersionSerializer(summary.trained_model).data
        return Response(payload, status=status.HTTP_201_CREATED)
