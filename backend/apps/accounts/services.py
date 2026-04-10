import random
from datetime import timedelta
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from .models import EmailVerification

def generate_verification_code() -> str:
    return str(random.randint(100000, 999999))

def send_verification_email(email: str, purpose: str) -> EmailVerification:
    """
    Invalida verificações anteriores do mesmo email/propósito,
    cria uma nova e envia o código por email.
    """
    EmailVerification.objects.filter(
        email=email,
        purpose=purpose,
        is_used=False,
    ).update(is_used=True)
    
    verification = EmailVerification.objects.create(
        email=email,
        purpose=purpose,
        code=generate_verification_code(),
        expires_at=timezone.now() + timedelta(minutes=10),
    )
    
    subject = {
        EmailVerification.Purpose.REGISTER: "GOALIX - Seu código de confirmação",
        EmailVerification.Purpose.PASSWORD_RESET: "GOALIX - Código para redefinir senha",
    }.get(purpose, "Código de verificação")

    message = f"""
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2>Seu código de verificação</h2>
                <p style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#534AB7">
                    {verification.code}
                </p>
                <p>Este código expira em <strong>10 minutos</strong>.</p>
                <p style="color:#888;font-size:12px">
                    Se você não solicitou esse código, ignore este email.
                </p>
        </div>
    """

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        html_message=message,
    )

    return verification

def confirm_verification_code(code: str, email: str, purpose: str) -> EmailVerification | None:
    """
    Confirma um código de verificação.
    Retorna o objeto EmailVerification se válido, None caso contrário.
    """
    try:
        verification = EmailVerification.objects.get(
            code=code,
            email=email,
            purpose=purpose,
            is_used=False,
        )
    except EmailVerification.DoesNotExist:
        raise ValueError("Código inválido")
    if not verification.is_valid():
        raise ValueError("Código expirado")

    verification.is_used = True
    verification.save(update_fields=["is_used"])
    return verification
