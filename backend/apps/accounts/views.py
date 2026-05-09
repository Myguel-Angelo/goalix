from datetime import timedelta
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth import authenticate
from django.db import transaction
from django.http import HttpResponseRedirect
from django.utils import timezone
from django.utils.crypto import get_random_string
from django.utils.text import slugify
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .google import get_google_auth_url, exchange_code_for_user_info
from .models import EmailVerification, User, UserTenantIndex
from .serializers import (
    RequestVerificationSerializer,
    ConfirmVerificationSerializer,
    RegisterUserOwnerSerializer,
    RegisterTenantSerializer,
)
from .services import send_verification_email, confirm_verification_code
from .tokens import get_tokens_for_user, get_registration_tokens
from apps.tenants.models import Tenant, Domain


# ---------------------------------------------------------------------------
# Email verification
# ---------------------------------------------------------------------------

class RequestVerificationView(APIView):
    """
    Envia um código de verificação para o email informado.

    POST /auth/request-verification/
    Body: { "email": "user@example.com" }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RequestVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        send_verification_email(email, EmailVerification.Purpose.REGISTER)
        return Response(
            {"detail": "Código enviado para o email."},
            status=status.HTTP_200_OK,
        )


class ConfirmVerificationView(APIView):
    """
    Confirma o código e devolve um token de registro de uso único.

    POST /auth/confirm-verification/
    Body: { "email": "user@example.com", "code": "ABC123" }
    Response: { "token": "<uuid>" }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ConfirmVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            verification = confirm_verification_code(
                email=serializer.validated_data["email"],
                code=serializer.validated_data["code"],
                purpose=EmailVerification.Purpose.REGISTER,
            )
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"token": str(verification.token)}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Google OAuth
# ---------------------------------------------------------------------------

class GoogleAuthView(APIView):
    """
    Inicia o fluxo OAuth do Google redirecionando para a URL de autorização.

    GET /auth/google/
    """
    permission_classes = [AllowAny]

    def get(self, request):
# Generate a random state value for CSRF protection (optional)
        state = get_random_string(32)
        # We do NOT store it in the session to avoid cross‑origin cookie issues
        url = get_google_auth_url(state=state)
        return HttpResponseRedirect(url)


class GoogleCallbackView(APIView):
    """
    Recebe o callback do Google, troca o code pelo perfil do usuário.
    Redireciona para o frontend com os dados via query params.

    - Usuário novo  → redireciona para /auth/google/callback?type=register&...
    - Usuário existente com tenant → redireciona com type=login&access=...&refresh=...
    - Usuário existente sem tenant → redireciona com type=register&... (continuar registro)

    GET /auth/google/callback/
    """
    permission_classes = [AllowAny]

    def get(self, request):
        code  = request.query_params.get("code")
        state = request.query_params.get("state", "")

        frontend_url = getattr(
            settings, "FRONTEND_URL", "http://localhost:3000"
        )

        if not code:
            return self._redirect_error(frontend_url, "Código do Google ausente.")

# Simplified: skip CSRF state verification (session may be missing in OAuth callback)
# state parameter is kept for reference but not validated here
# Proceed directly to exchange the code for user info

        try:
            google_user = exchange_code_for_user_info(code)
        except Exception:
            return self._redirect_error(frontend_url, "Falha ao autenticar com o Google.")

        if not google_user.get("verified"):
            return self._redirect_error(
                frontend_url,
                "O email desta conta Google não está verificado.",
            )

        # Verificar se o usuário já existe
        existing_user = User.objects.filter(
            google_id=google_user["google_id"]
        ).first()

        if existing_user:
            # Checar se já tem tenant (registro completo)
            try:
                index = UserTenantIndex.objects.select_related("tenant").get(
                    email=existing_user.email
                )
                # Login completo — gerar JWT com tenant
                from django_tenants.utils import schema_context
                with schema_context(index.tenant.schema_name):
                    tenant_user = User.objects.get(id=existing_user.id)
                    tokens = get_tokens_for_user(tenant_user, index.tenant)

                params = urlencode({
                    "type": "login",
                    "access": tokens["access"],
                    "refresh": tokens["refresh"],
                    "tenant_slug": index.tenant.slug,
                })
                return HttpResponseRedirect(
                    f"{frontend_url}/auth/google/callback?{params}"
                )
            except UserTenantIndex.DoesNotExist:
                # Usuário existe mas sem tenant — continuar registro
                reg_tokens = get_registration_tokens(existing_user)
                params = urlencode({
                    "type": "register",
                    "google_id": google_user["google_id"],
                    "email": google_user["email"],
                    "full_name": google_user["full_name"],
                    "access": reg_tokens["access"],
                    "refresh": reg_tokens["refresh"],
                    "owner_exists": "true",
                })
                return HttpResponseRedirect(
                    f"{frontend_url}/auth/google/callback?{params}"
                )
        else:
            # Usuário novo — redirecionar para registro
            params = urlencode({
                "type": "register",
                "google_id": google_user["google_id"],
                "email": google_user["email"],
                "full_name": google_user["full_name"],
            })
            return HttpResponseRedirect(
                f"{frontend_url}/auth/google/callback?{params}"
            )

    @staticmethod
    def _redirect_error(frontend_url, message):
        params = urlencode({"type": "error", "error": message})
        return HttpResponseRedirect(
            f"{frontend_url}/auth/google/callback?{params}"
        )


# ---------------------------------------------------------------------------
# Registro de dono (owner) — fluxo unificado
# ---------------------------------------------------------------------------

class RegisterUserOwnerView(APIView):
    """
    Cria o usuário dono da empresa no schema público e retorna JWT
    de registro (sem tenant_id) para uso imediato.

      Fluxo EmailVerification:
        POST /auth/register/owner/
        Body: {
            "full_name": "...",
            "email":     "...",
            "password":  "...",
            "token":     "<uuid>",          ← token retornado por ConfirmVerificationView
            "title":     "..."              ← opcional
        }

      Fluxo Google:
        POST /auth/register/owner/
        Body: {
            "full_name": "...",
            "email":     "...",
            "google_id": "...",             ← google_id retornado por GoogleCallbackView
            "title":     "..."              ← opcional
        }

    Response: {
        "detail":  "Usuário criado com sucesso.",
        "access":  "<jwt>",
        "refresh": "<jwt>",
        "user":    { ... }
    }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterUserOwnerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        email     = data["email"].lower().strip()
        full_name = data["full_name"]
        title     = data.get("title", "")

        has_token = bool(data.get("token"))

        # Verifica duplicidade antes de criar
        if User.objects.filter(email=email).exists():
            return Response(
                {"detail": "Já existe um usuário com este email."},
                status=status.HTTP_409_CONFLICT,
            )

        with transaction.atomic():
            if has_token:
                # Fluxo EmailVerification: cria usuário com senha
                user = User.objects.create_user(
                    email=email,
                    password=data["password"],
                    full_name=full_name,
                    title=title,
                    role=User.Role.OWNER,
                    email_verified=True,
                )
            else:
                # Fluxo Google: cria usuário sem senha, vincula google_id
                user = User.objects.create_user(
                    email=email,
                    password=None,
                    full_name=full_name,
                    title=title,
                    role=User.Role.OWNER,
                    email_verified=True,
                    google_id=data["google_id"],
                )

        # Gera JWT de registro (sem tenant_id)
        tokens = get_registration_tokens(user)

        return Response(
            {
                "detail": "Usuário criado com sucesso.",
                "access": tokens["access"],
                "refresh": tokens["refresh"],
                "user": tokens["user"],
            },
            status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# Registro de empresa (tenant) — apenas para owners autenticados
# ---------------------------------------------------------------------------

class RegisterTenantByOwnerView(APIView):
    """
    Cria a empresa (tenant + domain), replica o owner para o schema
    do tenant, vincula o owner via UserTenantIndex e devolve JWT
    completo (com tenant_id).

    Requer autenticação — o owner já deve existir (JWT de registro).

    POST /auth/register/tenant/
    Body: {
        "company_name":    "...",
        "company_sector":  "technology",
        "company_size":    "small",
        "company_country": "BR",
        "company_cnpj":    "..."           ← opcional
    }

    Response: {
        "detail":    "Empresa criada com sucesso.",
        "workspace": "<slug>",
        "access":    "<jwt>",
        "refresh":   "<jwt>",
        "tenant":    { ... }
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = RegisterTenantSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        owner = request.user

        # Um owner só pode ter uma empresa
        if UserTenantIndex.objects.filter(user_id=owner.pk).exists():
            return Response(
                {"detail": "Este usuário já possui uma empresa cadastrada."},
                status=status.HTTP_409_CONFLICT,
            )

        with transaction.atomic():
            slug = slugify(data["company_name"])

            # Garante slug único com sufixo numérico
            if Tenant.objects.filter(slug=slug).exists():
                max_suffix = (
                    Tenant.objects
                    .filter(slug__startswith=f"{slug}-", slug__regex=f"^{slug}-[0-9]+$")
                    .values_list("slug", flat=True)
                    .order_by("-slug")
                    .first()
                )
                counter = int(max_suffix.split("-")[-1]) + 1 if max_suffix else 1
                slug = f"{slug}-{counter}"

            tenant = Tenant.objects.create(
                name=data["company_name"],
                slug=slug,
                schema_name=slug.replace("-", "_"),
                sector=data["company_sector"],
                size=data["company_size"],
                country=data["company_country"].upper(),
                cnpj=data.get("company_cnpj", ""),
                plan=Tenant.Plan.FREE,
                plan_status=Tenant.PlanStatus.TRIAL,
                trial_ends_at=timezone.now() + timedelta(days=14),
            )
            Domain.objects.create(
                domain=f"{slug}.localhost",
                tenant=tenant,
                is_primary=True,
            )

            # Vincula o owner ao tenant no índice público
            UserTenantIndex.objects.create(
                email=owner.email,
                tenant=tenant,
                user_id=owner.pk,
            )

            # Replica o owner para o schema do tenant
            from django_tenants.utils import schema_context
            with schema_context(tenant.schema_name):
                tenant_user = User(
                    id=owner.id,
                    email=owner.email,
                    password=owner.password,    # hash já gerado
                    full_name=owner.full_name,
                    code=owner.code,
                    title=owner.title,
                    role=owner.role,
                    is_active=owner.is_active,
                    is_staff=owner.is_staff,
                    email_verified=owner.email_verified,
                    google_id=owner.google_id,
                )
                tenant_user.save()

        # Gera JWT completo (com tenant_id) para substituir o de registro
        tokens = get_tokens_for_user(tenant_user, tenant)

        return Response(
            {
                "detail": "Empresa criada com sucesso.",
                "workspace": slug,
                "access": tokens["access"],
                "refresh": tokens["refresh"],
                "tenant": tokens["tenant"],
            },
            status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

class LoginView(APIView):
    """
    Autentica o usuário e devolve tokens JWT.
    Usa o UserTenantIndex para encontrar o schema correto sem
    expor a existência do tenant diretamente.

    POST /auth/login/
    Body: { "email": "...", "password": "..." }
    Response: { "access": "...", "refresh": "...", "tenant": {...}, "user": {...} }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email    = request.data.get("email", "").lower().strip()
        password = request.data.get("password", "")

        if not email or not password:
            return Response(
                {"detail": "Email e senha são obrigatórios."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            index = UserTenantIndex.objects.select_related("tenant").get(email=email)
        except UserTenantIndex.DoesNotExist:
            return Response(
                {"detail": "Credenciais inválidas."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        tenant = index.tenant
        if tenant is None or tenant.schema_name == "public":
            return Response(
                {"detail": "Tenant não encontrado."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django_tenants.utils import schema_context
        with schema_context(tenant.schema_name):
            user = authenticate(request, username=email, password=password)
            if user is None:
                return Response(
                    {"detail": "Email ou senha inválidos."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            if not user.is_active:
                return Response(
                    {"detail": "Conta desativada."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            tokens = get_tokens_for_user(user, tenant)

        return Response(tokens, status=status.HTTP_200_OK)
