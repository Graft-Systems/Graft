import csv
import io
from datetime import datetime, timedelta

from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from rest_framework import permissions, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .irrigation_engine import IrrigationAdvisorEngine
from .models.agriculture import Vineyard, VineyardBlock
from .models.irrigation import (
    BlockMoistureTarget,
    IrrigationRecommendation,
    SoilMoistureReading,
)
from .models.wine import Producer
from .serializers_irrigation import (
    BlockMoistureTargetSerializer,
    IrrigationRecommendationSerializer,
    SoilMoistureReadingSerializer,
)


def _get_producer(request):
    try:
        return request.user.producer_profile
    except Producer.DoesNotExist:
        return None


def _get_owned_block(producer, block_id):
    if not block_id:
        return None
    return VineyardBlock.objects.filter(pk=block_id, vineyard__producer=producer).first()


def _parse_recorded_at(raw_value):
    if not raw_value:
        return None
    parsed = parse_datetime(raw_value)
    if parsed:
        if timezone.is_naive(parsed):
            return timezone.make_aware(parsed, timezone.get_current_timezone())
        return parsed
    parsed_date = parse_date(raw_value)
    if parsed_date:
        return timezone.make_aware(
            datetime.combine(parsed_date, datetime.min.time()),
            timezone.get_current_timezone(),
        )
    return None


class SoilMoistureReadingView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        producer = _get_producer(request)
        if not producer:
            return Response([], status=status.HTTP_200_OK)
        block_id = request.query_params.get("block_id")
        readings = SoilMoistureReading.objects.filter(block__vineyard__producer=producer)
        if block_id:
            readings = readings.filter(block_id=block_id)
        serializer = SoilMoistureReadingSerializer(readings, many=True)
        return Response(serializer.data)

    def post(self, request):
        producer = _get_producer(request)
        if not producer:
            return Response({"error": "Producer profile required"}, status=status.HTTP_400_BAD_REQUEST)
        block = _get_owned_block(producer, request.data.get("block"))
        if not block:
            return Response({"error": "Block not found or does not belong to you"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = SoilMoistureReadingSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(block=block, source=request.data.get("source") or "manual")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SoilMoistureUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        producer = _get_producer(request)
        if not producer:
            return Response({"error": "Producer profile required"}, status=status.HTTP_400_BAD_REQUEST)
        block = _get_owned_block(producer, request.data.get("block"))
        if not block:
            return Response({"error": "Block not found or does not belong to you"}, status=status.HTTP_400_BAD_REQUEST)

        upload = request.FILES.get("file")
        if not upload:
            return Response({"error": "A CSV file is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            text = upload.read().decode("utf-8-sig")
        except UnicodeDecodeError:
            return Response({"error": "The CSV file must be UTF-8 encoded."}, status=status.HTTP_400_BAD_REQUEST)

        reader = csv.DictReader(io.StringIO(text))
        if not reader.fieldnames or "recorded_at" not in reader.fieldnames or "moisture_pct" not in reader.fieldnames:
            return Response(
                {"error": "CSV must include recorded_at and moisture_pct columns."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        imported = 0
        skipped = 0
        errors = []
        for index, row in enumerate(reader, start=2):
            recorded_at = _parse_recorded_at((row.get("recorded_at") or "").strip())
            if not recorded_at:
                errors.append(f"Row {index}: invalid recorded_at")
                continue
            try:
                moisture_pct = float((row.get("moisture_pct") or "").strip())
            except ValueError:
                errors.append(f"Row {index}: invalid moisture_pct")
                continue

            _, created = SoilMoistureReading.objects.get_or_create(
                block=block,
                recorded_at=recorded_at,
                moisture_pct=moisture_pct,
                source="csv",
                defaults={
                    "source_label": (row.get("source_label") or upload.name).strip(),
                    "notes": (row.get("notes") or "").strip(),
                },
            )
            if created:
                imported += 1
            else:
                skipped += 1

        payload = {"imported": imported, "skipped": skipped, "errors": errors[:10]}
        status_code = status.HTTP_201_CREATED if imported else status.HTTP_200_OK
        return Response(payload, status=status_code)


class BlockMoistureTargetView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, block_id):
        producer = _get_producer(request)
        if not producer:
            return Response({"error": "Producer profile required"}, status=status.HTTP_400_BAD_REQUEST)
        block = _get_owned_block(producer, block_id)
        if not block:
            return Response({"error": "Block not found"}, status=status.HTTP_404_NOT_FOUND)
        target, _ = BlockMoistureTarget.objects.get_or_create(block=block)
        serializer = BlockMoistureTargetSerializer(target)
        return Response(serializer.data)

    def put(self, request, block_id):
        producer = _get_producer(request)
        if not producer:
            return Response({"error": "Producer profile required"}, status=status.HTTP_400_BAD_REQUEST)
        block = _get_owned_block(producer, block_id)
        if not block:
            return Response({"error": "Block not found"}, status=status.HTTP_404_NOT_FOUND)
        target, _ = BlockMoistureTarget.objects.get_or_create(block=block)
        serializer = BlockMoistureTargetSerializer(target, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(block=block)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class IrrigationRecommendationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        producer = _get_producer(request)
        if not producer:
            return Response([], status=status.HTTP_200_OK)
        block_id = request.query_params.get("block_id")
        recommendations = IrrigationRecommendation.objects.filter(block__vineyard__producer=producer)
        if block_id:
            recommendations = recommendations.filter(block_id=block_id)
        serializer = IrrigationRecommendationSerializer(recommendations[:20], many=True)
        return Response(serializer.data)


class IrrigationRecommendationGenerateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        producer = _get_producer(request)
        if not producer:
            return Response({"error": "Producer profile required"}, status=status.HTTP_400_BAD_REQUEST)
        block = _get_owned_block(producer, request.data.get("block"))
        if not block:
            return Response({"error": "Block not found or does not belong to you"}, status=status.HTTP_400_BAD_REQUEST)

        engine = IrrigationAdvisorEngine()
        try:
            payloads = engine.generate_for_block(block)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        today = timezone.now().date()
        horizons = [payload.horizon_days for payload in payloads]
        IrrigationRecommendation.objects.filter(
            block=block,
            horizon_days__in=horizons,
            generated_at__date=today,
        ).delete()

        recommendations = []
        for payload in payloads:
            recommendation = IrrigationRecommendation.objects.create(
                block=block,
                horizon_days=payload.horizon_days,
                action=payload.action,
                recommended_total_gallons=payload.recommended_total_gallons,
                recommended_gallons_per_acre=payload.recommended_gallons_per_acre,
                next_irrigation_date=payload.next_irrigation_date,
                target_moisture_pct=payload.target_moisture_pct,
                confidence_score=payload.confidence_score,
                drivers=payload.drivers,
                explanation=payload.explanation,
            )
            recommendations.append(recommendation)

        serializer = IrrigationRecommendationSerializer(recommendations, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class IrrigationSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        producer = _get_producer(request)
        if not producer:
            return Response({"error": "Producer profile required"}, status=status.HTTP_400_BAD_REQUEST)

        vineyards = Vineyard.objects.filter(producer=producer)
        blocks = VineyardBlock.objects.filter(vineyard__producer=producer)
        readings = SoilMoistureReading.objects.filter(block__vineyard__producer=producer)
        recommendations = IrrigationRecommendation.objects.filter(block__vineyard__producer=producer)

        latest_reading = readings.order_by("-recorded_at", "-id").first()
        latest_recommendation = recommendations.order_by("-generated_at", "horizon_days").first()

        payload = {
            "total_vineyards": vineyards.count(),
            "total_blocks": blocks.count(),
            "readings_last_7_days": readings.filter(
                recorded_at__gte=timezone.now() - timedelta(days=7)
            ).count(),
            "recommendation_count": recommendations.count(),
            "latest_reading": (
                {
                    "block_name": latest_reading.block.name,
                    "moisture_pct": float(latest_reading.moisture_pct),
                    "recorded_at": latest_reading.recorded_at,
                }
                if latest_reading
                else None
            ),
            "latest_recommendation": (
                {
                    "block_name": latest_recommendation.block.name,
                    "action": latest_recommendation.action,
                    "horizon_days": latest_recommendation.horizon_days,
                    "generated_at": latest_recommendation.generated_at,
                }
                if latest_recommendation
                else None
            ),
            "blocks_with_readings": readings.values("block_id").distinct().count(),
            "blocks_with_recommendations": recommendations.values("block_id").distinct().count(),
            "blocks_below_target": self._blocks_below_target(blocks),
        }
        return Response(payload)

    def _blocks_below_target(self, blocks):
        count = 0
        for block in blocks:
            latest = block.soil_moisture_readings.order_by("-recorded_at", "-id").first()
            if not latest:
                continue
            target = getattr(block, "moisture_target", None)
            target_min = float(getattr(target, "target_min_pct", IrrigationAdvisorEngine.default_target_min_pct))
            if float(latest.moisture_pct) < target_min:
                count += 1
        return count
