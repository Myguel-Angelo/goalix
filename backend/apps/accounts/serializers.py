import re
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

class RequestVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()

class ConfirmVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6, min_length=6)

class RegisterSerializer(serializers.Serializer):
    # dados do owner
    full_name = serializers.CharField(max_length=200)
    email = serializers.EmailField()
    password = serializers.CharField(max_length=128, min_length=8)
    token = serializers.UUIDField()
    
    # dados da empresa
    company_name = serializers.CharField(max_length=200)
    company_sector = serializers.ChoiceField(choices=[
        "technology","retail","health",
        "education","finance","logistics", 
        "construction","other"
    ])
    company_size   = serializers.ChoiceField(choices=["micro","small","medium","large"])
    company_country = serializers.CharField(max_length=2)
    company_cnpj   = serializers.CharField(max_length=14, required=False, allow_blank=True)

    def validate_password(self, value):
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError("Deve conter ao menos uma letra maiúscula.")
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError("Deve conter ao menos um número.")
        return value

    def validate_token(self, value):
        from .models import EmailVerification
        try:
            v = EmailVerification.objects.get(
                token=value,
                purpose=EmailVerification.Purpose.REGISTER,
                is_used=True,   # já foi confirmado na etapa anterior
            )
            self._verified_email = v.email
        except EmailVerification.DoesNotExist:
            raise serializers.ValidationError("Token inválido.")
        return value

    def validate(self, data):
        if data["email"] != self._verified_email:
            raise serializers.ValidationError(
                {"email": "Email não corresponde ao token de verificação."}
            )
        return data
