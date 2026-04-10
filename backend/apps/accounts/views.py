from django.utils.crypto import get_random_string
from datetime import timedelta
from django_tenants.utils import schema_context
from django.contrib.auth import authenticate
from django.db import transaction
from django.http import HttpResponseRedirect
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from .google import get_google_auth_url, exchange_code_for_user_info
from .tokens import get_tokens_for_user
from .models import EmailVerification, User, UserTenantIndex
from .serializers import RequestVerificationSerializer, ConfirmVerificationSerializer, RegisterSerializer
from .services import send_verification_email, confirm_verification_code
from .ratelimit import RateLimitedAPIView, email_or_ip_key
from apps.tenants.models import Tenant, Domain


class RequestVerificationView(RateLimitedAPIView):
    """Passo 1: frontend envia o email, backend manda o código."""
    permission_classes = [AllowAny]
    rate_limit_key = email_or_ip_key
    rate_limit_rate = '3/h'
    rate_limit_method = ['POST']

    def post(self, request):
        serializer = RequestVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        send_verification_email(email, EmailVerification.Purpose.REGISTER)
        return Response({"detail": "Código enviado para o email."}, status=status.HTTP_200_OK)


class ConfirmVerificationView(RateLimitedAPIView):
    """Passo 2: frontend envia email + código, recebe token para o próximo passo."""
    permission_classes = [AllowAny]
    rate_limit_key = email_or_ip_key
    rate_limit_rate = '10/h'
    rate_limit_method = ['POST']

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


class RegisterTenantUserView(RateLimitedAPIView):
    """Passo 3: frontend envia todos os dados + token, backend cria tenant + owner."""
    permission_classes = [AllowAny]
    rate_limit_key = email_or_ip_key
    rate_limit_rate = '2/h'
    rate_limit_method = ['POST']

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        with transaction.atomic():
            slug = slugify(data["company_name"])
            if Tenant.objects.filter(slug=slug).exists():
                max_suffix = Tenant.objects.filter(
                    slug__startswith=f"{slug}-",
                    slug__regex=f'^{{slug}}-[0-9]+$'
                ).values_list('slug', flat=True).order_by('-slug').first()
                counter = int(max_suffix.split('-')[-1]) + 1 if max_suffix else 1
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
            with schema_context(tenant.schema_name):
                owner = User.objects.create_user(
                    email=data["email"],
                    password=data["password"],
                    full_name=data["full_name"],
                    role=User.Role.OWNER,
                    email_verified=True,
                    is_staff=True,
                )
            UserTenantIndex.objects.create(
                email=data["email"],
                tenant=tenant,
                user_id=owner.id
            )
            tokens = get_tokens_for_user(owner, tenant)
        return Response(tokens, status=status.HTTP_201_CREATED)


class LoginView(RateLimitedAPIView):
    permission_classes = [AllowAny]
    rate_limit_key = email_or_ip_key
    rate_limit_rate = '10/h'
    rate_limit_method = ['POST']

    def post(self, request):
        email = request.data.get("email", "").lower().strip()
        password = request.data.get("password", "")
        if not email or not password:
            return Response({"detail": "Email e senha são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            index = UserTenantIndex.objects.select_related("tenant").get(email=email)
        except UserTenantIndex.DoesNotExist:
            return Response({"detail": "Credenciais inválidas."}, status=status.HTTP_401_UNAUTHORIZED)
        tenant = index.tenant
        if tenant is None or tenant.schema_name == "public":
            return Response({"detail": "Tenant não encontrado."}, status=status.HTTP_400_BAD_REQUEST)
        with schema_context(tenant.schema_name):
            user = authenticate(request, username=email, password=password)
            if user is None:
                return Response({"detail": "Email ou senha inválidos."}, status=status.HTTP_401_UNAUTHORIZED)
            if not user.is_active:
                return Response({"detail": "Conta desativada."}, status=status.HTTP_403_FORBIDDEN)
            tokens = get_tokens_for_user(user, tenant)
        return Response(tokens, status=status.HTTP_200_OK)


class GoogleAuthView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        state = get_random_string(32)
        request.session['oauth_state'] = state
        url = get_google_auth_url(state=state)
        return HttpResponseRedirect(url)


class GoogleCallbackView(RateLimitedAPIView):
    permission_classes = [AllowAny]
    rate_limit_key = email_or_ip_key
    rate_limit_rate = '5/h'
    rate_limit_method = ['GET']

    def get(self, request):
        code = request.query_params.get("code")
        state = request.query_params.get("state", "")
        if not code:
            return Response({"detail": "Código do Google ausente."}, status=status.HTTP_400_BAD_REQUEST)
        session_state = request.session.get('oauth_state')
        if not session_state or state != session_state:
            return Response({"detail": "Estado inválido ou expirado."}, status=status.HTTP_400_BAD_REQUEST)
        # Invalidate the state in session
        try:
            del request.session['oauth_state']
        except KeyError:
            pass
        try:
            google_user = exchange_code_for_user_info(code)
        except Exception:
            return Response({"detail": "Falha ao autenticar com o Google."}, status=status.HTTP_400_BAD_REQUEST)
        email = google_user["email"]
        try:
            index = UserTenantIndex.objects.select_related("tenant").get(email=email)
            tenant = index.tenant
            if tenant is None or tenant.schema_name == "public":
                return Response({"detail": "Tenant não encontrado para este usuário."}, status=status.HTTP_400_BAD_REQUEST)
        except UserTenantIndex.DoesNotExist:
            return Response({"detail": "Usuário não associado a nenhuma empresa."}, status=status.HTTP_400_BAD_REQUEST)
        with schema_context(tenant.schema_name):
            user = User.objects.filter(email=email).first()
            if user is None:
                user = User.objects.create_user(
                    email=email,
                    password=None,
                    full_name=google_user["full_name"],
                    google_id=google_user["google_id"],
                    email_verified=google_user["verified"],
                    role=User.Role.MEMBER,
                )
                user.set_unusable_password()
                UserTenantIndex.objects.create(
                    email=email,
                    tenant=tenant,
                    user_id=user.id
                )
            else:
                if not user.google_id:
                    user.google_id = google_user["google_id"]
                    user.save(update_fields=["google_id"])
                UserTenantIndex.objects.get_or_create(
                    email=email,
                    tenant=tenant,
                    defaults={"user_id": user.id}
                )
            tokens = get_tokens_for_user(user, tenant)
        return Response(tokens, status=status.HTTP_200_OK)
