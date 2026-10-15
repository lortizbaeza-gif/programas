import json
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST
from rest_framework.decorators import api_view
from rest_framework.response import Response


def user_payload(user):
    return {'id': user.pk, 'username': user.username, 'first_name': user.first_name,
            'last_name': user.last_name}


def csrf_failure(request, reason=''):
    return JsonResponse({'detail': 'Token CSRF ausente o inválido.'}, status=403)


@require_GET
@ensure_csrf_cookie
def csrf_token(request):
    return JsonResponse({'csrfToken': get_token(request)})


@require_POST
@csrf_protect
def login_view(request):
    if request.content_type != 'application/json':
        return JsonResponse({'detail': 'Se requiere application/json.'}, status=415)
    try:
        payload = json.loads(request.body)
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({'detail': 'JSON inválido.'}, status=400)
    if not isinstance(payload, dict) or any(
        not isinstance(payload.get(field), str) or not payload[field]
        for field in ('username', 'password')
    ):
        return JsonResponse({'detail': 'username y password son obligatorios.'}, status=400)
    user = authenticate(request, username=payload['username'], password=payload['password'])
    if user is None:
        return JsonResponse({'detail': 'Credenciales inválidas.'}, status=401)
    login(request, user)
    return JsonResponse({'user': user_payload(user), 'csrfToken': get_token(request)})


@api_view(['POST'])
def logout_view(request):
    logout(request)
    return Response(status=204)


@api_view(['GET'])
def me(request):
    return Response(user_payload(request.user))
