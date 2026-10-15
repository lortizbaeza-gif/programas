from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from clinic import views

router = DefaultRouter()
router.register('patients', views.PatientViewSet, basename='patient')
router.register('consultations', views.ConsultationViewSet, basename='consultation')
urlpatterns = [path('admin/', admin.site.urls), path('api/csrf/', views.csrf_token),
    path('api/login/', views.sign_in), path('api/logout/', views.sign_out),
    path('api/me/', views.me), path('api/', include(router.urls))]
