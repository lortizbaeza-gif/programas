from django.utils import timezone
from rest_framework import serializers
from .models import Patient, Consultation, Measurement

class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ['id', 'name', 'birth_date', 'phone', 'allergies', 'preferences', 'restrictions', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    def validate_birth_date(self, value):
        if value and value > timezone.localdate():
            raise serializers.ValidationError('La fecha de nacimiento no puede ser futura.')
        return value

class MeasurementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Measurement
        fields = ['kind', 'value', 'unit', 'method']
    def validate(self, attrs):
        if attrs.get('kind') == 'weight' and attrs.get('unit') != 'kg':
            raise serializers.ValidationError('El peso se registra en kg.')
        if attrs.get('unit') == '%' and attrs.get('value') is not None and attrs['value'] > 100:
            raise serializers.ValidationError('Un porcentaje no puede superar 100.')
        return attrs

class ConsultationSerializer(serializers.ModelSerializer):
    measurements = MeasurementSerializer(many=True)
    class Meta:
        model = Consultation
        fields = ['id', 'patient', 'date', 'notes', 'measurements', 'created_at']
        read_only_fields = ['id', 'created_at']
    def validate_patient(self, value):
        if value.owner_id != self.context['request'].user.id:
            raise serializers.ValidationError('Expediente no disponible.')
        return value
    def validate_date(self, value):
        if value > timezone.localdate():
            raise serializers.ValidationError('La consulta no puede tener fecha futura.')
        return value
    def validate_measurements(self, rows):
        kinds = [r['kind'] for r in rows]
        if len(kinds) != len(set(kinds)):
            raise serializers.ValidationError('Cada indicador puede registrarse una sola vez por consulta.')
        return rows
    def create(self, validated_data):
        from django.db import transaction
        rows = validated_data.pop('measurements')
        with transaction.atomic():
            consultation = Consultation.objects.create(**validated_data)
            Measurement.objects.bulk_create([Measurement(consultation=consultation, **row) for row in rows])
        return consultation
