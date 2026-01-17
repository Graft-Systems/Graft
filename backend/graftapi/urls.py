from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import RegisterView, login_user, ProducerProfileView, ProducerWineView, ProducerWineDetailView, StoreProfileView, StoreProfileView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", login_user, name="login"),
    path("producer-profile/", ProducerProfileView.as_view(), name="producer_profile"),
    path("store-profile/", StoreProfileView.as_view(), name="store_profile"),
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # Mounted under /api/ at the project level, so this should be /my-wines/
    path('my-wines/', ProducerWineView.as_view(), name='my-wines'),
    path('my-wines/<int:pk>/', ProducerWineDetailView.as_view(), name='my-wines-detail'),
]
