from django.contrib import admin
from .models import Patient, Consultation, Measurement
admin.site.register([Patient, Consultation, Measurement])
