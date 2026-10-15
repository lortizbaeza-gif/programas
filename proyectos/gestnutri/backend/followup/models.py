"""Single Sprint 2 schema source. The data owner generates its migration."""
import uuid
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MaxLengthValidator, RegexValidator
from django.db import models
from django.db.models.functions import Length
from django.utils import timezone
from .fields import WeightField

models.TextField.register_lookup(Length)


def validate_occurred_at(value):
    if timezone.is_naive(value):
        raise ValidationError('La fecha debe incluir zona horaria.')
    if value > timezone.now():
        raise ValidationError('La fecha no puede ser futura.')


def validate_weight(value):
    if not value.is_finite() or not Decimal('0') < value <= Decimal('9999.99'):
        raise ValidationError('El peso debe ser finito, positivo y no mayor que 9999.99 kg.')


class Consultation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey('patients.Patient', on_delete=models.PROTECT,
                                related_name='consultations')
    occurred_at = models.DateTimeField(validators=[validate_occurred_at])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-occurred_at', '-created_at', '-id']


class Measurement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    consultation = models.OneToOneField(Consultation, on_delete=models.PROTECT,
                                       related_name='measurement')
    weight_kg = WeightField(max_digits=6, decimal_places=2,
                                    validators=[validate_weight])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at', 'id']
        constraints = [models.CheckConstraint(
            condition=models.Q(weight_kg__gt=0, weight_kg__lte=Decimal('9999.99')),
            name='followup_weight_valid_range')]


class ManualNote(models.Model):
    class Kind(models.TextChoices):
        NOTE = 'note', 'Nota'
        PREFERENCE = 'preference', 'Preferencia'
        RESTRICTION = 'restriction', 'Restricción'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    consultation = models.ForeignKey(Consultation, on_delete=models.PROTECT,
                                     related_name='notes')
    kind = models.CharField(max_length=11, choices=Kind.choices)
    text = models.TextField(validators=[MaxLengthValidator(2000), RegexValidator(r'\S')])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at', 'id']
        constraints = [
            models.CheckConstraint(condition=models.Q(kind__in=['note', 'preference', 'restriction']),
                                   name='followup_note_kind_valid'),
            models.CheckConstraint(condition=models.Q(text__regex=r'\S'),
                                   name='followup_note_not_blank'),
            models.CheckConstraint(condition=models.Q(text__length__lte=2000),
                                   name='followup_note_max_length'),
        ]

    def clean(self):
        super().clean()
        if isinstance(self.text, str):
            self.text = self.text.strip()
