from rest_framework_simplejwt.tokens import RefreshToken

def get_tokens_for_user(user, tenant):
    """
    Gerador do par access/refresh tokens com dados customizados
    """
    refresh = RefreshToken.for_user(user)

    refresh["email"] = user.email
    refresh["full_name"] = user.full_name
    refresh["role"] = user.role
    refresh["code"] = user.code
    refresh["tenant_id"]   = str(tenant.id)
    refresh["tenant_name"] = tenant.name
    refresh["tenant_slug"] = tenant.slug
    
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "tenant": {
            "id":   str(tenant.id),
            "slug": tenant.slug,
            "name": tenant.name,
        },
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "code": user.code,
        },
    }