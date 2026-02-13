from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.views import APIView

from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer, ProducerSerializer, WineSerializer, StoreSerializer
from .models.wine import Producer, Wine
from .models.store import Store


class RegisterView(generics.CreateAPIView):
    """
    Handles user registration.
    Creates a new Django User and returns serialized data.
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


@api_view(["POST"])
@permission_classes([AllowAny])
def login_user(request):
    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(username=username, password=password)
    if user is not None:
        refresh = RefreshToken.for_user(user)
        role = getattr(user.profile, "role", None)

        return Response(
            {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "is_staff": user.is_staff,
                "username": user.username,
                "role": role,
            },
            status=status.HTTP_200_OK,
        )

    return Response({"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)


class ProducerProfileView(generics.CreateAPIView):
    """
    Handles producer profile creation.
    """
    queryset = Producer.objects.all()
    serializer_class = ProducerSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        # Upsert: if a producer profile already exists for this user, update it instead of throwing a 500.
        existing = Producer.objects.filter(user=request.user).first()
        if existing:
            serializer = self.get_serializer(existing, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class StoreProfileView(generics.CreateAPIView):
    """
    Handles store profile creation.
    """
    queryset = Store.objects.all()
    serializer_class = StoreSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        # Upsert store profile for this user to avoid UNIQUE constraint failures on re-run.
        existing = Store.objects.filter(user=request.user).first()
        if existing:
            serializer = self.get_serializer(existing, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ProducerWineView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Fetch wines belonging to the logged-in user's producer profile
        try:
            producer = request.user.producer_profile
            wines = Wine.objects.filter(producer=producer)
            serializer = WineSerializer(wines, many=True)
            return Response(serializer.data)
        except Producer.DoesNotExist:
            return Response({"error": "Producer profile not found"}, status=404)

    def post(self, request):
        producer = request.user.producer_profile
        serializer = WineSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(producer=producer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProducerWineDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_producer(self, request):
        try:
            return request.user.producer_profile
        except Producer.DoesNotExist:
            return None

    def get_object(self, request, pk):
        producer = self.get_producer(request)
        if not producer:
            return None
        return Wine.objects.filter(producer=producer, pk=pk).first()

    def put(self, request, pk):
        wine = self.get_object(request, pk)
        if not wine:
            return Response({"error": "Wine not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = WineSerializer(wine, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        return self.put(request, pk)

    def delete(self, request, pk):
        wine = self.get_object(request, pk)
        if not wine:
            return Response({"error": "Wine not found"}, status=status.HTTP_404_NOT_FOUND)
        wine.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def ai_chat(request):
    """
    Handle AI chat requests for statistics and insights
    Endpoint: POST /api/ai/chat/
    
    Request body:
    {
        "message": "user message here"
    }
    
    Response:
    {
        "message": "ai response here"
    }
    """
    from .engine import get_ai_engine
    
    try:
        user_message = request.data.get("message", "").strip()
        
        if not user_message:
            return Response(
                {"error": "Message cannot be empty"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the AI engine
        engine = get_ai_engine()
        
        # Prepare context with user info
        context = {
            "user": request.user.username,
            "timestamp": str(__import__('datetime').datetime.now())
        }
        
        # Get AI response
        ai_response = engine.get_statistics_insights(user_message, context)
        
        return Response(
            {"message": ai_response},
            status=status.HTTP_200_OK
        )
    
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        return Response(
            {"error": "Failed to get AI response", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
