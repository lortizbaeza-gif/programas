from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class Patient(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    name = models.CharField(max_length=150)
    birth_date = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=25, blank=True)
    allergies = models.TextField(blank=True)
    preferences = models.TextField(blank=True)
    restrictions = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ['name', 'id']
    def __str__(self):
        return self.name

class Consultation(models.Model):
    patient = models.ForeignKey(Patient, related_name='consultations', on_delete=models.PROTECT)
    date = models.DateField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['-date', '-id']

class Measurement(models.Model):
    class Kind(models.TextChoices):
        WEIGHT = 'weight', 'Peso'
        FAT = 'fat', 'Grasa corporal'
        MUSCLE = 'muscle', 'Músculo'
    consultation = models.ForeignKey(Consultation, related_name='measurements', on_delete=models.CASCADE)
    kind = models.CharField(max_length=12, choices=Kind.choices)
    value = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True,
                                validators=[MinValueValidator(0), MaxValueValidator(9999)])
    unit = models.CharField(max_length=10, choices=[('kg', 'kg'), ('%', '%')])
    method = models.CharField(max_length=100, blank=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=['consultation', 'kind'], name='unique_measurement_kind')]
