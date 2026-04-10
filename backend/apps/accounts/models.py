import uuid
import random
import string
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models


def generate_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError("Email obrigatório")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        extra.setdefault("role", User.Role.OWNER)
        extra.setdefault("email_verified", True)
        return self.create_user(email, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        OWNER   = "owner",   "Owner"
        ADMIN   = "admin",   "Admin"
        MANAGER = "manager", "Manager"
        MEMBER  = "member",  "Member"

    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code           = models.CharField(max_length=8, default=generate_code, unique=True, editable=False)
    full_name      = models.CharField(max_length=200)
    email          = models.EmailField(unique=True)
    role           = models.CharField(max_length=10, choices=Role.choices, default=Role.MEMBER)
    title          = models.CharField(max_length=100, blank=True)
    avatar         = models.ImageField(upload_to="avatars/", null=True, blank=True)
    bio            = models.CharField(max_length=300, blank=True)
    is_active      = models.BooleanField(default=True)
    is_staff       = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    last_login     = models.DateTimeField(null=True, blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)
    google_id      = models.CharField(max_length=128, blank=True, db_index=True)

    USERNAME_FIELD  = "email"
    REQUIRED_FIELDS = ["full_name"]

    objects = UserManager()

    class Meta:
        verbose_name = "Usuário"

    def __str__(self):
        return f"{self.full_name} <{self.email}>"


class EmailVerification(models.Model):
    class Purpose(models.TextChoices):
        REGISTER       = "register",       "Registro"
        PASSWORD_RESET = "password_reset", "Reset de senha"

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email      = models.EmailField(db_index=True)
    code       = models.CharField(max_length=6)    # código numérico exibido ao usuário
    token      = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    purpose    = models.CharField(max_length=20, choices=Purpose.choices)
    is_used    = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Verificação de email"

    def is_valid(self):
        from django.utils import timezone
        return not self.is_used and self.expires_at > timezone.now()


class UserTenantIndex(models.Model):
    """"""
    email = models.EmailField(db_index=True, unique=True)
    tenant = models.ForeignKey(
        "tenants.Tenant",
        on_delete=models.CASCADE,
        related_name="user_index",
    )
    user_id = models.UUIDField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Índice de usuário"
