from django.urls import path
from .views import (
    RequestVerificationView,
    ConfirmVerificationView, 
    RegisterTenantUserView,
    LoginView,
    GoogleAuthView, 
    GoogleCallbackView,
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # Registro
    path("auth/request-verification/", RequestVerificationView.as_view()),
    path("auth/confirm-verification/", ConfirmVerificationView.as_view()),
    path("auth/register-tenant-user/", RegisterTenantUserView.as_view()),

    # Login
    path("auth/login/", LoginView.as_view()),
    path("auth/token/refresh/", TokenRefreshView.as_view()),

    # Google OAuth
    path("auth/google/", GoogleAuthView.as_view()),
    path("auth/google/callback/", GoogleCallbackView.as_view()),
]