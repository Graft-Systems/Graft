from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models.agriculture import IrrigationLog, Vineyard, VineyardBlock, WeatherData
from .models.wine import Producer
from .serializers_agriculture import (
    IrrigationLogSerializer,
    VineyardBlockSerializer,
    VineyardSerializer,
    WeatherDataSerializer,
)


def _get_producer(request):
    try:
        return request.user.producer_profile
    except Producer.DoesNotExist:
        return None


class AgricultureVineyardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        producer = _get_producer(request)
        if not producer:
            return Response([], status=status.HTTP_200_OK)
        vineyards = Vineyard.objects.filter(producer=producer)
        serializer = VineyardSerializer(vineyards, many=True)
        return Response(serializer.data)


class AgricultureBlockView(APIView):
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


class AgricultureWeatherView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        producer = _get_producer(request)
        if not producer:
            return Response([], status=status.HTTP_200_OK)
        vineyard_id = request.query_params.get("vineyard_id")
        weather = WeatherData.objects.filter(vineyard__producer=producer)
        if vineyard_id:
            weather = weather.filter(vineyard_id=vineyard_id)
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


class AgricultureIrrigationLogView(APIView):
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


class AgricultureIrrigationLogDetailView(APIView):
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
