import json
from django.contrib.auth import authenticate, login, logout
from django.db.models import Q
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.views.decorators.http import require_GET, require_POST
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from .models import Patient, Consultation, Measurement
from .serializers import PatientSerializer, ConsultationSerializer

@require_GET
@ensure_csrf_cookie
def csrf_token(request):
    return JsonResponse({'csrfToken': get_token(request)})

@require_POST
@csrf_protect
def sign_in(request):
    try:
        data = json.loads(request.body)
        if not isinstance(data, dict):
            raise ValueError()
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({'detail': 'Solicitud inválida.'}, status=400)
    username, password = data.get('username'), data.get('password')
    if not isinstance(username, str) or not isinstance(password, str):
        return JsonResponse({'detail': 'Usuario y contraseña requeridos.'}, status=400)
    user = authenticate(request, username=username, password=password)
    if not user:
        return JsonResponse({'detail': 'Usuario o contraseña incorrectos.'}, status=400)
    login(request, user)
    return JsonResponse({'username': user.username, 'csrfToken': get_token(request)})

@require_POST
@csrf_protect
def sign_out(request):
    logout(request)
    return JsonResponse({'detail': 'Sesión cerrada.'})

@require_GET
def me(request):
    if not request.user.is_authenticated:
        return JsonResponse({'detail': 'Inicia sesión.'}, status=403)
    return JsonResponse({'username': request.user.username})

class PatientViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin,
                     mixins.UpdateModelMixin, viewsets.GenericViewSet):
    serializer_class = PatientSerializer
    def get_queryset(self):
        qs = Patient.objects.filter(owner=self.request.user)
        term = self.request.query_params.get('search', '').strip()
        return qs.filter(Q(name__icontains=term) | Q(phone__icontains=term)) if term else qs
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        patient = self.get_object()
        rows = patient.consultations.prefetch_related('measurements')
        return Response(ConsultationSerializer(rows, many=True, context={'request': request}).data)
    @action(detail=True, methods=['get'])
    def compare(self, request, pk=None):
        patient = self.get_object()
        try:
            before_id = int(request.query_params['before'])
            after_id = int(request.query_params['after'])
        except (KeyError, ValueError):
            raise ValidationError('Selecciona dos consultas válidas.')
        if before_id == after_id:
            raise ValidationError('Selecciona consultas diferentes.')
        qs = patient.consultations.prefetch_related('measurements')
        before = qs.filter(pk=before_id).first()
        after = qs.filter(pk=after_id).first()
        if not before or not after:
            raise ValidationError('Las dos consultas deben pertenecer al expediente.')
        if before.date > after.date:
            raise ValidationError('La consulta de referencia debe ser anterior o del mismo día.')
        old = {m.kind: m for m in before.measurements.all()}
        new = {m.kind: m for m in after.measurements.all()}
        results = []
        for kind, label in Measurement.Kind.choices:
            a, b = old.get(kind), new.get(kind)
            reason = None
            if not a or not b or a.value is None or b.value is None:
                reason = 'Falta una medición.'
            elif a.unit != b.unit:
                reason = 'Unidades diferentes.'
            elif not a.method.strip() or not b.method.strip() or a.method.strip().casefold() != b.method.strip().casefold():
                reason = 'Método no informado o diferente.'
            results.append({'kind': kind, 'label': label, 'before': str(a.value) if a and a.value is not None else None,
                'after': str(b.value) if b and b.value is not None else None,
                'unit': b.unit if b else None, 'delta': str(b.value - a.value) if not reason else None,
                'reason': reason})
        return Response({'before': before.id, 'after': after.id, 'results': results})

class ConsultationViewSet(mixins.CreateModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = ConsultationSerializer
    def get_queryset(self):
        return Consultation.objects.filter(patient__owner=self.request.user).prefetch_related('measurements')
