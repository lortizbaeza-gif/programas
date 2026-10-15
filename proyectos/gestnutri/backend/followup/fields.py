from django.core.exceptions import ValidationError
from django.db import models


class WeightField(models.DecimalField):
    def to_python(self, value):
        if isinstance(value, (bool, float)):
            raise ValidationError('Usa un decimal exacto, no booleanos ni float.')
        return super().to_python(value)
