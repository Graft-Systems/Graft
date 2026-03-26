from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db.models import Count, Sum, Avg, Q, Subquery, OuterRef, DecimalField
from django.db.models.functions import Coalesce
from rest_framework.views import APIView

from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    RegisterSerializer, ProducerSerializer, WineSerializer, StoreSerializer,
    WholesalePriceSerializer, RetailContactSerializer, LocationRequestSerializer,
    MarketingMaterialSerializer,
)
from .models.wine import Producer, Wine
from .models.store import Store
from .models.insights import StorePlacementStatus
from .models.pricing import WholesalePrice
from .models.contacts import RetailContact, LocationRequest
from .models.marketing import MarketingMaterial
from .models.distribution import Delivery, RetailSale
from .legal_rag import format_citations, retrieve_chunks


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
        # `user.profile` may not exist for legacy users; avoid crashing the login endpoint.
        try:
            role = user.profile.role
        except Exception:
            role = None

        if not role:
            # Provide a useful error for users that exist but have no role/profile set.
            return Response(
                {"error": "User profile role is missing. Please complete registration/profile setup."},
                status=status.HTTP_400_BAD_REQUEST,
            )

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
        try:
            producer = request.user.producer_profile
            wines = Wine.objects.filter(producer=producer)
            serializer = WineSerializer(wines, many=True)
            return Response(serializer.data)
        except Producer.DoesNotExist:
            # Return an empty list instead of a 404 error
            return Response([], status=status.HTTP_200_OK)

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
    
class MyStoreView(APIView):
    """
    List and create stores for the logged-in retailer user.
    Mirrors the wine endpoints but for Store objects.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        GET /api/my-stores/
        Return all stores associated with the logged-in user.
        """
        stores = Store.objects.filter(user=request.user)
        serializer = StoreSerializer(stores, many=True)
        return Response(serializer.data)

    def post(self, request):
        """
        POST /api/my-stores/
        Create a new store linked to the logged-in user.
        """
        serializer = StoreSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MyStoreDetailView(APIView):
    """
    Retrieve, update, or delete a specific store belonging to the logged-in user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, request, pk):
        """
        Helper to fetch a store only if it belongs to the current user.
        """
        return Store.objects.filter(user=request.user, pk=pk).first()

    def put(self, request, pk):
        """
        PUT /api/my-stores/<pk>/
        Update fields on a specific store.
        """
        store = self.get_object(request, pk)
        if not store:
            return Response({"error": "Store not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = StoreSerializer(store, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        # Treat PATCH the same as PUT for partial updates
        return self.put(request, pk)

    def delete(self, request, pk):
        """
        DELETE /api/my-stores/<pk>/
        Remove a specific store.
        """
        store = self.get_object(request, pk)
        if not store:
            return Response({"error": "Store not found"}, status=status.HTTP_404_NOT_FOUND)
        store.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PurchasingInsightsView(APIView):
    """
    Return purchasing insights for wines owned by the logged-in producer.
    """
    permission_classes = [permissions.IsAuthenticated]

    STATUS_COPY = {
        "active": "Strong sell-through",
        "low": "Reorder risk",
        "inactive": "Needs activation",
    }

    def get(self, request):
        try:
            producer = request.user.producer_profile
        except Producer.DoesNotExist:
            # Return an empty list instead of a 404 error
            return Response([], status=status.HTTP_200_OK)
        
        statuses = (
            StorePlacementStatus.objects
            .filter(wine__producer=producer)
            .select_related("store", "wine")
            .order_by("status", "-estimated_bottles", "store__name", "wine__name")
        )

        payload = [
            {
                "id": status.id,
                "product": f"{status.store.name} • {status.wine.name}",
                "freq": self.STATUS_COPY.get(status.status, status.status.title()),
            }
            for status in statuses
        ]
        return Response(payload, status=status.HTTP_200_OK)



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
    try:
        user_message = request.data.get("message", "").strip()
        
        if not user_message:
            return Response(
                {"error": "Message cannot be empty"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Prepare context with user info
        context = {
            "user": request.user.username,
            "timestamp": str(__import__('datetime').datetime.now())
        }
        
        # Optional Legal Insight RAG context:
        # frontend sends:
        #   Legal Insight context:
        #   - State: TX
        #   - Unified profile JSON: {...}
        #   User question: ...
        rag_enriched_message = user_message
        retrieved_chunks = []
        cross_state_requested = False
        if "Legal Insight context:" in user_message:
            state_code = None
            question = user_message

            for raw_line in user_message.splitlines():
                line = raw_line.strip()
                if line.lower().startswith("- state:"):
                    state_code = line.split(":", 1)[1].strip().upper()
                elif line.lower().startswith("user question:"):
                    question = line.split(":", 1)[1].strip()

            q_lower = question.lower()
            cross_state_requested = any(
                token in q_lower
                for token in [
                    "compare",
                    "compared",
                    "versus",
                    " vs ",
                    "other state",
                    "other states",
                    "across states",
                    "strictest",
                    "more strict",
                    "less strict",
                    "than california",
                    "than texas",
                    "than florida",
                    "than new york",
                    "than illinois",
                ]
            )

            # Default behavior: retrieve only selected state.
            retrieved_chunks = retrieve_chunks(question, state_code=state_code, top_k=6)

            # Only widen scope when user explicitly asks for cross-state comparison.
            if cross_state_requested:
                cross_candidates = retrieve_chunks(question, state_code=None, top_k=18)
                selected_state = (state_code or "").upper()
                seen_states = {selected_state} if selected_state else set()
                cross_state_chunks = []
                for chunk in cross_candidates:
                    if chunk.state_code in seen_states:
                        continue
                    cross_state_chunks.append(chunk)
                    seen_states.add(chunk.state_code)
                    if len(cross_state_chunks) >= 4:
                        break
                if cross_state_chunks:
                    retrieved_chunks = retrieved_chunks + cross_state_chunks

            if retrieved_chunks:
                retrieval_mode_note = (
                    "Retrieval mode: cross-state comparison requested by user. "
                    "Compare the selected state to the other cited states only."
                    if cross_state_requested
                    else "Retrieval mode: selected-state only."
                )
                retrieved_context = "\n\n".join(
                    [
                        (
                            f"[{chunk.state_code}] {chunk.source_name} "
                            f"(page {chunk.page}, chunk {chunk.chunk_id})\n"
                            f"{chunk.text}"
                        )
                        for chunk in retrieved_chunks
                    ]
                )
                rag_enriched_message = (
                    f"{user_message}\n\n"
                    f"{retrieval_mode_note}\n\n"
                    "Retrieved legal context (use for grounded answer):\n"
                    f"{retrieved_context}\n\n"
                    "Answering rules:\n"
                    "- If cross-state comparison is requested, explicitly compare at least 3 cited states.\n"
                    "- If evidence is insufficient for a ranking, say so clearly and explain why.\n"
                    "- Do not claim facts that are not present in the retrieved excerpts.\n\n"
                    "Citations:\n"
                    f"{format_citations(retrieved_chunks)}"
                )
        
        # Get AI response
        try:
            from .engine import get_ai_engine
            engine = get_ai_engine()
            ai_response = engine.get_statistics_insights(rag_enriched_message, context)
        except Exception as engine_error:
            # Graceful fallback for Legal Insight mode so UI does not receive a hard 500.
            if "Legal Insight context:" in user_message:
                if retrieved_chunks:
                    top = retrieved_chunks[:3]
                    top_citations = format_citations(top)
                    ai_response = (
                        "AI engine is temporarily unavailable, but I found relevant legal excerpts for your question.\n\n"
                        f"Engine error: {str(engine_error)}\n\n"
                        "Suggested next actions:\n"
                        "1) Review the cited excerpts and confirm your current workflow stage.\n"
                        "2) Verify your required uploads/registrations for the selected state.\n"
                        "3) Re-run this question after AI service recovery for a full narrative answer.\n\n"
                        "Top citations:\n"
                        f"{top_citations}"
                    )
                else:
                    ai_response = (
                        "AI engine is temporarily unavailable and no matching legal excerpts were found for this query. "
                        "Please try a more specific question with a state code and workflow step."
                    )
            else:
                raise engine_error
        
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
        error_text = str(e)
        lower_error = error_text.lower()

        if any(token in lower_error for token in ["429", "quota", "rate limit", "resource_exhausted", "too many requests"]):
            return Response(
                {
                    "error": "AI provider rate limit or quota reached. Please wait a minute and try again.",
                    "details": error_text,
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        if any(token in lower_error for token in ["401", "403", "invalid api key", "api key not valid", "permission denied", "unauthorized"]):
            return Response(
                {
                    "error": "AI provider authentication failed. Please verify your AI API key and provider settings.",
                    "details": error_text,
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response(
            {"error": "Failed to get AI response", "details": error_text},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ---------------------------------------------------------------------------
# Producer Summary (SummaryCards)
# ---------------------------------------------------------------------------

class ProducerSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            producer = request.user.producer_profile
        except Producer.DoesNotExist:
            return Response([], status=status.HTTP_200_OK)

        placements = StorePlacementStatus.objects.filter(wine__producer=producer)

        active_count = placements.filter(status="active").count()
        total_bottles = placements.aggregate(total=Coalesce(Sum("estimated_bottles"), 0))["total"]
        reorder_count = placements.filter(
            Q(status="low") | Q(estimated_days_left__isnull=False, estimated_days_left__lte=7)
        ).count()
        avg_days = placements.filter(estimated_days_left__isnull=False).aggregate(
            avg=Avg("estimated_days_left")
        )["avg"]

        payload = [
            {
                "label": "Active Store Placements",
                "value": str(active_count),
                "color": "#9f1239",
            },
            {
                "label": "Estimated Bottles on Shelf",
                "value": f"{total_bottles:,}",
                "color": "#9f1239",
            },
            {
                "label": "Reorders Predicted (7 Days)",
                "value": str(reorder_count),
                "color": "#d97706" if reorder_count > 0 else "#9f1239",
            },
            {
                "label": "Avg. Days on Shelf",
                "value": str(round(avg_days)) if avg_days is not None else "—",
                "color": "#9f1239",
            },
        ]
        return Response(payload, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Ordering Predictions (Reorder Radar)
# ---------------------------------------------------------------------------

class OrderingPredictionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            producer = request.user.producer_profile
        except Producer.DoesNotExist:
            return Response([], status=status.HTTP_200_OK)

        placements = (
            StorePlacementStatus.objects
            .filter(wine__producer=producer, estimated_days_left__isnull=False)
            .select_related("store", "wine")
            .order_by("estimated_days_left")
        )

        def eta_label(days):
            if days <= 7:
                return "< 1 week"
            elif days <= 14:
                return "1–2 weeks"
            elif days <= 21:
                return "2–3 weeks"
            else:
                return "3–4 weeks"

        payload = [
            {
                "id": p.id,
                "store": p.store.name,
                "wine": p.wine.name,
                "eta": eta_label(p.estimated_days_left),
                "days_left": p.estimated_days_left,
                "cases": max(1, (12 - p.estimated_bottles) // 12 + 1) if p.estimated_bottles is not None else 1,
            }
            for p in placements
        ]
        return Response(payload, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Pricing Analytics
# ---------------------------------------------------------------------------

class PricingAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            producer = request.user.producer_profile
        except Producer.DoesNotExist:
            return Response([], status=status.HTTP_200_OK)

        wines = Wine.objects.filter(producer=producer)
        prices = (
            WholesalePrice.objects
            .filter(wine__in=wines)
            .select_related("store", "wine")
            .order_by("wine__name", "-date_effective")
        )

        seen = set()
        payload = []
        for p in prices:
            key = (p.store_id, p.wine_id)
            if key in seen:
                continue
            seen.add(key)

            region_median_qs = (
                WholesalePrice.objects
                .filter(wine=p.wine)
                .order_by("-date_effective")
                .values_list("price", flat=True)
            )
            region_prices = list(region_median_qs)
            if region_prices:
                region_prices.sort()
                mid = len(region_prices) // 2
                median = float(region_prices[mid])
            else:
                median = float(p.price)

            payload.append({
                "id": p.id,
                "account": p.store.name,
                "wine": p.wine.name,
                "price": float(p.price),
                "median": round(median, 2),
            })
        return Response(payload, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Targeting Insights (Submarket & Demographic)
# ---------------------------------------------------------------------------

class TargetingInsightsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            producer = request.user.producer_profile
        except Producer.DoesNotExist:
            return Response([], status=status.HTTP_200_OK)

        placements = (
            StorePlacementStatus.objects
            .filter(wine__producer=producer)
            .select_related("store")
        )

        neighborhood_map = {}
        for p in placements:
            nb = p.store.neighborhood or p.store.city or "Unknown"
            if nb not in neighborhood_map:
                neighborhood_map[nb] = {"bottles": 0, "stores": set()}
            neighborhood_map[nb]["bottles"] += p.estimated_bottles or 0
            neighborhood_map[nb]["stores"].add(p.store_id)

        sale_totals = {}
        sales = RetailSale.objects.filter(wine__producer=producer).select_related("store")
        for s in sales:
            nb = s.store.neighborhood or s.store.city or "Unknown"
            sale_totals[nb] = sale_totals.get(nb, 0) + s.bottles_sold

        payload = []
        for nb, data in sorted(neighborhood_map.items(), key=lambda x: -x[1]["bottles"]):
            total_sales = sale_totals.get(nb, 0)
            payload.append({
                "name": nb,
                "stores": len(data["stores"]),
                "bottles": data["bottles"],
                "sales": total_sales,
            })
        return Response(payload, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Location Requests (CRUD)
# ---------------------------------------------------------------------------

class LocationRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _get_producer(self, request):
        try:
            return request.user.producer_profile
        except Producer.DoesNotExist:
            return None

    def get(self, request):
        producer = self._get_producer(request)
        if not producer:
            return Response([], status=status.HTTP_200_OK)
        requests_qs = LocationRequest.objects.filter(producer=producer)
        serializer = LocationRequestSerializer(requests_qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        producer = self._get_producer(request)
        if not producer:
            return Response({"error": "Producer profile required"}, status=status.HTTP_400_BAD_REQUEST)
        serializer = LocationRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(producer=producer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LocationRequestDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, request, pk):
        try:
            producer = request.user.producer_profile
        except Producer.DoesNotExist:
            return None
        return LocationRequest.objects.filter(producer=producer, pk=pk).first()

    def put(self, request, pk):
        obj = self.get_object(request, pk)
        if not obj:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = LocationRequestSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        return self.put(request, pk)

    def delete(self, request, pk):
        obj = self.get_object(request, pk)
        if not obj:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Retail Contacts (CRUD)
# ---------------------------------------------------------------------------

class RetailContactView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _get_producer(self, request):
        try:
            return request.user.producer_profile
        except Producer.DoesNotExist:
            return None

    def get(self, request):
        producer = self._get_producer(request)
        if not producer:
            return Response([], status=status.HTTP_200_OK)
        contacts = RetailContact.objects.filter(producer=producer)
        serializer = RetailContactSerializer(contacts, many=True)
        return Response(serializer.data)

    def post(self, request):
        producer = self._get_producer(request)
        if not producer:
            return Response({"error": "Producer profile required"}, status=status.HTTP_400_BAD_REQUEST)
        serializer = RetailContactSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(producer=producer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RetailContactDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, request, pk):
        try:
            producer = request.user.producer_profile
        except Producer.DoesNotExist:
            return None
        return RetailContact.objects.filter(producer=producer, pk=pk).first()

    def put(self, request, pk):
        obj = self.get_object(request, pk)
        if not obj:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = RetailContactSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        return self.put(request, pk)

    def delete(self, request, pk):
        obj = self.get_object(request, pk)
        if not obj:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Marketing Material Generator (AI-powered)
# ---------------------------------------------------------------------------

MARKETING_PROMPTS = {
    "email": (
        "Write a professional email campaign for a wine producer to send to retail buyers. "
        "The email should highlight the wine's qualities, suggest food pairings, and include "
        "a clear call-to-action for placing an order. Keep it concise and engaging."
    ),
    "instagram": (
        "Write an engaging Instagram post for a wine brand. Include a catchy caption with "
        "relevant hashtags. The tone should be warm, lifestyle-oriented, and appealing to "
        "wine enthusiasts. Keep it under 2200 characters."
    ),
    "shelf_talker": (
        "Write a shelf talker (small card placed next to a wine bottle on a store shelf). "
        "Include a brief wine description, tasting notes, food pairings, and any awards. "
        "Keep it under 80 words so it fits on a standard 2x3 inch card."
    ),
    "one_sheet": (
        "Write a one-sheet sales document for a wine producer to give to retail buyers. "
        "Include producer story, wine descriptions, pricing tiers, and distribution details. "
        "Format with clear sections and professional tone."
    ),
    "tasting_card": (
        "Write a tasting card for a wine tasting event. Include the wine name, vintage, "
        "varietal, region, tasting notes (appearance, nose, palate), food pairings, and "
        "a brief producer story. Format for easy reading during a tasting."
    ),
}


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def generate_marketing(request):
    from .engine import get_ai_engine

    try:
        producer = request.user.producer_profile
    except Producer.DoesNotExist:
        return Response({"error": "Producer profile required"}, status=status.HTTP_400_BAD_REQUEST)

    category = request.data.get("category", "").strip()
    wine_id = request.data.get("wine_id")
    extra_notes = request.data.get("notes", "").strip()

    if category not in MARKETING_PROMPTS:
        return Response(
            {"error": f"Invalid category. Choose from: {', '.join(MARKETING_PROMPTS.keys())}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    wine_context = ""
    if wine_id:
        wine = Wine.objects.filter(producer=producer, pk=wine_id).first()
        if wine:
            wine_context = (
                f"\n\nWine Details:\n"
                f"- Name: {wine.name}\n"
                f"- Varietal: {wine.varietal}\n"
                f"- Vintage: {wine.vintage or 'NV'}\n"
                f"- Region: {wine.region}\n"
                f"- Producer: {producer.name}\n"
            )

    base_prompt = MARKETING_PROMPTS[category]
    full_prompt = base_prompt + wine_context
    if extra_notes:
        full_prompt += f"\n\nAdditional notes from the producer: {extra_notes}"

    try:
        engine = get_ai_engine()
        context = {
            "user": request.user.username,
            "producer": producer.name,
            "category": category,
        }
        content = engine.get_statistics_insights(full_prompt, context)

        material = MarketingMaterial.objects.create(
            producer=producer,
            category=category,
            prompt_used=full_prompt,
            generated_content=content,
        )
        serializer = MarketingMaterialSerializer(material)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        return Response(
            {"error": "Failed to generate content", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


class MarketingHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            producer = request.user.producer_profile
        except Producer.DoesNotExist:
            return Response([], status=status.HTTP_200_OK)
        materials = MarketingMaterial.objects.filter(producer=producer)[:20]
        serializer = MarketingMaterialSerializer(materials, many=True)
        return Response(serializer.data)
