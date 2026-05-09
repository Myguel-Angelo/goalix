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


def get_registration_tokens(user):
    """
    Gerador de tokens para o fluxo de registro (sem tenant).
    Usado após criar o owner, antes do tenant existir.
    O JWT gerado NÃO contém tenant_id — será trocado por um
    token completo após a criação do tenant.
    """
    refresh = RefreshToken.for_user(user)

    refresh["email"] = user.email
    refresh["full_name"] = user.full_name
    refresh["role"] = user.role
    refresh["code"] = user.code
    # Sem tenant_id — será preenchido após criação do tenant

    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "code": user.code,
        },
    }