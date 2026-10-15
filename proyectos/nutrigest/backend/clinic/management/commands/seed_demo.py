import os
from datetime import date
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from clinic.models import Patient, Consultation, Measurement

class Command(BaseCommand):
    help = 'Crea una cuenta y registros ficticios de demostración sin alterar cuentas existentes.'
    @transaction.atomic
    def handle(self, *args, **options):
        password = os.getenv('DEMO_PASSWORD')
        if not password or len(password) < 12:
            raise CommandError('Define DEMO_PASSWORD con al menos 12 caracteres.')
        user, created = get_user_model().objects.get_or_create(username='demo')
        if created:
            user.set_password(password)
            user.save()
        if Patient.objects.filter(owner=user).exists():
            self.stdout.write('Los datos demo ya existen; no se modificaron.')
            return
        for name in ['Paciente ficticio A', 'Paciente ficticio B', 'Paciente ficticio C']:
            patient = Patient.objects.create(owner=user, name=name, allergies='Sin registro', preferences='Sin registro')
            for day, weight, fat, muscle in [(date(2026, 9, 1), '72.50', '28.00', '31.00'), (date(2026, 10, 1), '71.80', '27.50', '31.40')]:
                consultation = Consultation.objects.create(patient=patient, date=day, notes='Ejemplo académico ficticio.')
                for kind, value, unit in [('weight', weight, 'kg'), ('fat', fat, '%'), ('muscle', muscle, '%')]:
                    Measurement.objects.create(consultation=consultation, kind=kind, value=Decimal(value), unit=unit, method='Instrumento demo')
        self.stdout.write(self.style.SUCCESS('Cuenta demo y tres expedientes ficticios creados.'))
