import re
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import User

class RequestVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()

class ConfirmVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6, min_length=6)

class RegisterUserOwnerSerializer(serializers.Serializer):
    """
    Serializer unificado para registro de dono de empresa.
    Detecta o método pelo campo presente:
      - `token`     → fluxo EmailVerification
      - `google_id` → fluxo Google OAuth
    Os dois campos são mutuamente exclusivos.
    """
    full_name = serializers.CharField(max_length=200)
    email     = serializers.EmailField()
    title     = serializers.CharField(max_length=100, required=False, allow_blank=True)

    # --- campos mutuamente exclusivos ---
    token     = serializers.UUIDField(required=False)
    google_id = serializers.CharField(max_length=255, required=False)

    # campo interno preenchido pela validação do token
    _verified_email = None

    def validate_token(self, value):
        from .models import EmailVerification
        try:
            v = EmailVerification.objects.get(
                token=value,
                purpose=EmailVerification.Purpose.REGISTER,
                is_used=True,   # já confirmado na etapa anterior
            )
            self._verified_email = v.email
        except EmailVerification.DoesNotExist:
            raise serializers.ValidationError("Token inválido ou não confirmado.")
        return value

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Deve conter ao menos 8 caracteres.")
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError("Deve conter ao menos uma letra maiúscula.")
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError("Deve conter ao menos um número.")
        if not re.search(r'[^A-Za-z0-9]', value):
            raise serializers.ValidationError("Deve conter ao menos um caractere especial.")
        return value

    def validate(self, data):
        has_token     = bool(data.get("token"))
        has_google_id = bool(data.get("google_id"))

        if has_token and has_google_id:
            raise serializers.ValidationError(
                "Informe apenas um método: 'token' (email) ou 'google_id' (Google)."
            )
        if not has_token and not has_google_id:
            raise serializers.ValidationError(
                "É necessário informar 'token' ou 'google_id' para o registro."
            )

        # fluxo email: a senha é obrigatória e o email deve bater com o token
        if has_token:
            password = data.get("password")
            if not password:
                raise serializers.ValidationError({"password": "Senha obrigatória para registro por email."})
            self.validate_password(password)
            if self._verified_email and data["email"] != self._verified_email:
                raise serializers.ValidationError(
                    {"email": "Email não corresponde ao token de verificação."}
                )

        return data

    # senha só é relevante no fluxo email — declarada aqui para ser validada
    password = serializers.CharField(max_length=128, min_length=8, required=False, write_only=True)


class RegisterTenantSerializer(serializers.Serializer):
    company_name    = serializers.CharField(max_length=200)
    company_sector  = serializers.ChoiceField(choices=[
        "technology", "retail", "health",
        "education",  "finance", "logistics",
        "construction", "other",
    ])
    company_size    = serializers.ChoiceField(choices=["micro", "small", "medium", "large", "extra-large"])
    company_country = serializers.CharField(max_length=2)
    company_cnpj    = serializers.CharField(max_length=14, required=False, allow_blank=True)
