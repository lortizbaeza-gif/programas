from django.db.models import Q
from rest_framework import mixins, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from .models import Patient
from .serializers import PatientSerializer


class PatientPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class PatientViewSet(mixins.ListModelMixin, mixins.CreateModelMixin,
                     mixins.RetrieveModelMixin, mixins.UpdateModelMixin,
                     viewsets.GenericViewSet):
    serializer_class = PatientSerializer
    pagination_class = PatientPagination
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        queryset = Patient.objects.filter(owner=self.request.user)
        search = self.request.query_params.get('search', '').strip()
        if len(search) > 150:
            raise ValidationError({'search': ['Máximo 150 caracteres.']})
        if search:
            queryset = queryset.filter(Q(first_name__icontains=search) |
                                       Q(last_name__icontains=search) |
                                       Q(phone__icontains=search) |
                                       Q(email__icontains=search))
        return queryset

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
