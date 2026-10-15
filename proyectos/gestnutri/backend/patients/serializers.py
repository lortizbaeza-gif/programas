from collections.abc import Mapping
import re
from django.utils import timezone
from rest_framework import serializers
from .models import Patient


class StrictText(serializers.CharField):
    def to_internal_value(self, data):
        if not isinstance(data, str):
            self.fail('invalid')
        return super().to_internal_value(data)


class StrictEmail(serializers.EmailField):
    def to_internal_value(self, data):
        if not isinstance(data, str):
            self.fail('invalid')
        return super().to_internal_value(data)


class StrictDate(serializers.DateField):
    def to_internal_value(self, data):
        if not isinstance(data, str) or not re.fullmatch(r'[0-9]{4}-[0-9]{2}-[0-9]{2}', data):
            self.fail('invalid', format='AAAA-MM-DD')
        return super().to_internal_value(data)


class PatientSerializer(serializers.ModelSerializer):
    first_name = StrictText(max_length=100)
    last_name = StrictText(max_length=150)
    phone = StrictText(max_length=16)
    email = StrictEmail(max_length=254, required=False, allow_blank=True)
    allergies = StrictText(max_length=2000, required=False, allow_blank=True)
    restrictions = StrictText(max_length=2000, required=False, allow_blank=True)
    birth_date = StrictDate(required=False, allow_null=True, input_formats=['%Y-%m-%d'])

    class Meta:
        model = Patient
        fields = ['id', 'first_name', 'last_name', 'phone', 'email', 'birth_date',
                  'allergies', 'restrictions', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_internal_value(self, data):
        if isinstance(data, Mapping):
            forbidden = set(data) - (set(self.fields) - set(self.Meta.read_only_fields))
            if forbidden:
                raise serializers.ValidationError({key: ['Campo desconocido o de solo lectura.']
                                                   for key in sorted(forbidden)})
        return super().to_internal_value(data)

    def validate_phone(self, value):
        if not re.fullmatch(r'\+[1-9][0-9]{7,14}', value):
            raise serializers.ValidationError('Usa formato internacional, por ejemplo +12025550123.')
        return value

    def validate_birth_date(self, value):
        if value is not None and value > timezone.localdate():
            raise serializers.ValidationError('La fecha no puede ser futura.')
        return value
