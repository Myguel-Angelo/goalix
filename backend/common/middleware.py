from django_tenants.utils import schema_context, get_public_schema_name
from django.db import connection
from apps.tenants.models import Tenant

PUBLIC_PATHS = [
    "/api/v1/auth/request-verification/",
    "/api/v1/auth/confirm-verification/",
    "/api/v1/auth/register/",
    "/api/v1/auth/login/",
    "/api/v1/auth/google/",
    "/api/v1/auth/google/callback/",
    "/admin/",
]

class JWTTenantMiddleware:
    """
    Reads the tenant_id from the JWT and configures the PostgreSQL schema
    before running any views.
    """
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        if any(request.path.startswith(p) for p in PUBLIC_PATHS):
            connection.set_schema_to_public()
            return self.get_response(request)
        
        tenant = self._get_tenant_from_jwt(request)

        if tenant:
            connection.set_tenant(tenant)
            request.tenant = tenant
        else:
            connection.set_schema_to_public()
        
        return self.get_response(request)
    
    def _get_tenant_from_jwt(self, request):
        auth_header:str = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith("Bearer "):
            return None
        
        token_str = auth_header.split(" ")[1]

        try:
            from rest_framework_simplejwt.tokens import AccessToken
            token = AccessToken(token_str)
            tenant_id = token.get("tenant_id")
            if not tenant_id:
                return None
            return Tenant.objects.get(id=tenant_id)
        except Exception:
            return None
