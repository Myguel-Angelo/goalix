import uuid
from django_tenants.models import TenantMixin, DomainMixin
from django.db import models


class Tenant(TenantMixin):
    class Sector(models.TextChoices):
        TECHNOLOGY = "technology", "Tecnologia"
        RETAIL = "retail", "Varejo"
        HEALTH = "health", "Saúde"
        EDUCATION = "education", "Educação"
        FINANCE = "finance", "Finanças"
        LOGISTICS = "logistics", "Logística"
        CONSTRUCTION = "construction", "Construção"
        OTHER        = "other",        "Outro"
    
    class Size(models.TextChoices):
        MICRO = "micro", "Até 10 funcionários"
        SMALL = "small", "De 11 a 50 funcionários"
        MEDIUM = "medium", "De 51 a 200 funcionários"
        LARGE = "large", "De 201 a 1000 funcionários"
        EXTRA_LARGE = "extra_large", "Acima de 1000 funcionários"

    class Plan(models.TextChoices):
        FREE = "free", "Free"
        STARTER = "starter", "Starter"
        PRO = "pro", "Pro"
        ENTERPRISE = "enterprise", "Enterprise"
    
    class PlanStatus(models.TextChoices):
        TRIAL = "trial", "Trial"
        ACTIVE = "active", "Ativo"
        INACTIVE = "inactive", "Inativo"
        PAST_DUE = "past_due", "Pagamento pendente"
        CANCELED = "canceled", "Cancelado"
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    slug = models.SlugField()
    sector = models.CharField(max_length=30, choices=Sector.choices)
    size = models.CharField(max_length=15, choices=Size.choices)
    country = models.CharField(max_length=2)          # ISO 3166-1 alpha-2 ex: "BR"
    cnpj = models.CharField(max_length=14, blank=True)
    plan = models.CharField(max_length=20, choices=Plan.choices, default=Plan.FREE)
    plan_status = models.CharField(max_length=20, choices=PlanStatus.choices, default=PlanStatus.TRIAL)
    contact = models.JSONField(default=dict, blank=True)  # {email, phone, address}
    is_active = models.BooleanField(default=True)
    trial_ends_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    auto_create_schema = True

    class Meta:
        verbose_name = "Empresa"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self.name.lower().replace(" ", "-")
        super().save(*args, **kwargs)

class Domain(DomainMixin):
    pass