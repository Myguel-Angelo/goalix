import requests
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from django.conf import settings
from urllib.parse import urlencode

GOOGLE_TOKEN_URL  = "https://oauth2.googleapis.com/token"
GOOGLE_AUTH_URL   = "https://accounts.google.com/o/oauth2/v2/auth"

def get_google_auth_url(state: str = "") -> str:
    """Construir a URL de autorização do Google e retornar a string pronta."""
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "state": state,
    }
    query = urlencode(params)
    return f"{GOOGLE_AUTH_URL}?{query}"

def exchange_code_for_user_info(code: str) -> dict:
    """Construir a URL de autorização do Google e retornar a string pronta."""

    response = requests.post(GOOGLE_TOKEN_URL, data={
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    })
    response.raise_for_status()
    token_data = response.json()

    info = id_token.verify_oauth2_token(
        token_data["id_token"],
        google_requests.Request(),
        settings.GOOGLE_CLIENT_ID,
    )

    return {
        "email": info["email"],
        "full_name": info.get("name", ""),
        "google_id": info["sub"],
        "avatar_url": info.get("picture", ""),
        "verified": info.get("email_verified", False),
    }
