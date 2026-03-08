from datetime import timedelta

from django.db.models import Avg, Count, Sum, Q
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework import status, permissions
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
)
from .models.wine import Producer


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_producer(request):
    """Return the producer profile for the authenticated user, or None."""
    try:
        return request.user.producer_profile
    except Producer.DoesNotExist:
        return None


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
            "latest_scan": latest_scan_data,
            "avg_yield_estimate_base_tons_per_acre": (
                round(float(avg_yield), 3) if avg_yield is not None else None
            ),
            "active_pest_disease_alerts": active_pest_alerts,
            "weather_forecast_summary": weather_forecast_summary,
        }
        return Response(payload, status=status.HTTP_200_OK)
