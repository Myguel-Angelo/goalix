from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RequestVerificationView,
    ConfirmVerificationView,
    GoogleAuthView,
    GoogleCallbackView,
    RegisterUserOwnerView,
    RegisterTenantByOwnerView,
    LoginView,
)

urlpatterns = [
    # --- Email verification ---
    path("auth/request-verification/", RequestVerificationView.as_view()),
    path("auth/confirm-verification/", ConfirmVerificationView.as_view()),

    # --- Google OAuth ---
    path("auth/google/",          GoogleAuthView.as_view()),
    path("auth/google/callback/", GoogleCallbackView.as_view()),

    # --- Registro ---
    path("auth/register/owner/",  RegisterUserOwnerView.as_view()),
    path("auth/register/tenant/", RegisterTenantByOwnerView.as_view()),

    # --- Login / tokens ---
    path("auth/login/",           LoginView.as_view()),
    path("auth/token/refresh/",   TokenRefreshView.as_view()),
]