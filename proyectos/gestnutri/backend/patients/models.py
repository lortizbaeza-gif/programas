import uuid
from django.conf import settings
from django.core.validators import MaxLengthValidator, RegexValidator
from django.db import models
from django.db.models.functions import Length

models.TextField.register_lookup(Length)


class Patient(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
                              related_name='patients', editable=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=16, validators=[RegexValidator(r'^\+[1-9][0-9]{7,14}$')])
    email = models.EmailField(max_length=254, blank=True, default='')
    birth_date = models.DateField(null=True, blank=True)
    allergies = models.TextField(blank=True, default='', validators=[MaxLengthValidator(2000)])
    restrictions = models.TextField(blank=True, default='', validators=[MaxLengthValidator(2000)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['last_name', 'first_name', 'id']
        constraints = [
            models.CheckConstraint(condition=models.Q(first_name__regex=r'\S'), name='patient_first_name_not_empty'),
            models.CheckConstraint(condition=models.Q(last_name__regex=r'\S'), name='patient_last_name_not_empty'),
            models.CheckConstraint(condition=models.Q(phone__regex=r'^\+[1-9][0-9]{7,14}$'),
                                   name='patient_phone_international'),
            models.CheckConstraint(condition=models.Q(allergies__length__lte=2000),
                                   name='patient_allergies_max_length'),
            models.CheckConstraint(condition=models.Q(restrictions__length__lte=2000),
                                   name='patient_restrictions_max_length'),
        ]
