from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient


class AuthenticationTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.user = get_user_model().objects.create_user(
            username='nutricionista', password='Ficticia-test-2026!')

    def setUp(self):
        self.client = APIClient(enforce_csrf_checks=True)

    def csrf(self):
        return self.client.get('/api/v1/auth/csrf/').json()['csrfToken']

    def login(self, password='Ficticia-test-2026!'):
        return self.client.post('/api/v1/auth/login/',
                                {'username': 'nutricionista', 'password': password},
                                format='json', HTTP_X_CSRFTOKEN=self.csrf())

    def test_anonymous_cannot_read_profile(self):
        self.assertEqual(self.client.get('/api/v1/auth/me/').status_code, 403)

    def test_login_requires_csrf_even_when_anonymous(self):
        response = self.client.post('/api/v1/auth/login/',
                                    {'username': 'nutricionista', 'password': 'Ficticia-test-2026!'},
                                    format='json')
        self.assertEqual(response.status_code, 403)

    def test_login_profile_and_logout(self):
        response = self.login()
        self.assertEqual(response.status_code, 200)
        self.assertNotIn('password', response.json()['user'])
        self.assertEqual(self.client.get('/api/v1/auth/me/').json()['id'], self.user.pk)
        self.assertEqual(self.client.post('/api/v1/auth/logout/').status_code, 403)
        response = self.client.post('/api/v1/auth/logout/',
                                    HTTP_X_CSRFTOKEN=response.json()['csrfToken'])
        self.assertEqual(response.status_code, 204)
        self.assertEqual(self.client.get('/api/v1/auth/me/').status_code, 403)

    def test_invalid_credentials(self):
        self.assertEqual(self.login('incorrecta').status_code, 401)
        self.assertEqual(self.client.get('/api/v1/auth/me/').status_code, 403)

    def test_inactive_user_cannot_login(self):
        self.user.is_active = False
        self.user.save()
        self.assertEqual(self.login().status_code, 401)

    def test_invalid_payloads(self):
        for payload in ([], {}, {'username': 3, 'password': []}):
            with self.subTest(payload=payload):
                response = self.client.post('/api/v1/auth/login/', payload, format='json',
                                            HTTP_X_CSRFTOKEN=self.csrf())
                self.assertEqual(response.status_code, 400)
        response = self.client.post('/api/v1/auth/login/', '{', content_type='application/json',
                                    HTTP_X_CSRFTOKEN=self.csrf())
        self.assertEqual(response.status_code, 400)

    def test_wrong_content_type(self):
        response = self.client.post('/api/v1/auth/login/', {'username': 'nutricionista'},
                                    HTTP_X_CSRFTOKEN=self.csrf())
        self.assertEqual(response.status_code, 415)

    def test_login_rejects_get(self):
        self.assertEqual(self.client.get('/api/v1/auth/login/').status_code, 405)
