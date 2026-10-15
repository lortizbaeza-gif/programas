from datetime import timedelta
from uuid import UUID
from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.db.models.deletion import ProtectedError
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from .models import Patient


class PatientAPITests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.owner = get_user_model().objects.create_user(username='profesional1')
        cls.other = get_user_model().objects.create_user(username='profesional2')

    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(self.owner)
        self.payload = {'first_name': 'Ana María', 'last_name': 'Ejemplo Prueba',
                        'phone': '+12025550123'}

    def create(self, **changes):
        return self.client.post('/api/v1/patients/', self.payload | changes, format='json')

    def test_minimal_create_and_retrieve(self):
        response = self.create(first_name='  Ana María  ')
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(UUID(data['id']).version, 4)
        self.assertEqual(len(data), 10)
        self.assertEqual(data['first_name'], 'Ana María')
        self.assertEqual(data['email'], '')
        self.assertEqual(data['allergies'], '')
        self.assertIsNone(data['birth_date'])
        self.assertTrue(data['created_at'].endswith('Z'))
        self.assertEqual(Patient.objects.get(pk=data['id']).owner, self.owner)
        self.assertEqual(self.client.get(f"/api/v1/patients/{data['id']}/").status_code, 200)

    def test_required_fields(self):
        for field in self.payload:
            payload = dict(self.payload)
            del payload[field]
            response = self.client.post('/api/v1/patients/', payload, format='json')
            self.assertEqual(response.status_code, 400)
            self.assertIn(field, response.json())
        self.assertFalse(Patient.objects.exists())

    def test_invalid_values_reject_atomically(self):
        cases = {'first_name': ['', '  ', None, 12, True, [], {}, 'a' * 101],
                 'last_name': [' ', 'a' * 151],
                 'phone': [12025550123, '+012345678', '12025550123', '+1234567',
                           '+1234567890123456', '+1234abcde'],
                 'email': ['invalid', None, 12],
                 'birth_date': ['', '2026-02-30', '2026-1-01', 123,
                                (timezone.localdate() + timedelta(days=1)).isoformat()],
                 'allergies': [None, False, 'a' * 2001],
                 'restrictions': [None, {}, 'a' * 2001]}
        for field, values in cases.items():
            for value in values:
                with self.subTest(field=field, value=str(value)[:30]):
                    response = self.create(**{field: value})
                    self.assertEqual(response.status_code, 400)
                    self.assertIn(field, response.json())
        self.assertEqual(Patient.objects.count(), 0)

    def test_boundaries_and_duplicate_contacts(self):
        values = {'first_name': 'a' * 100, 'last_name': 'b' * 150,
                  'phone': '+123456789012345', 'allergies': 'c' * 2000,
                  'restrictions': 'd' * 2000, 'email': 'fake@example.com'}
        self.assertEqual(self.create(**values).status_code, 201)
        self.assertEqual(self.create(**values).status_code, 201)
        self.assertEqual(self.create(phone='+12345678').status_code, 201)

    def test_rejects_unknown_and_server_fields(self):
        for key in ('id', 'created_at', 'updated_at', 'owner', 'phoneNumber'):
            response = self.create(**{key: 'untrusted'})
            self.assertEqual(response.status_code, 400)
            self.assertIn(key, response.json())

    def test_patch_preserves_and_clears_fields(self):
        initial = self.create(email='fake@example.com', birth_date='1990-04-15',
                              restrictions='Ficticia').json()
        path = f"/api/v1/patients/{initial['id']}/"
        with patch('django.utils.timezone.now', return_value=timezone.now() + timedelta(seconds=1)):
            response = self.client.patch(path, {'email': '', 'birth_date': None,
                                               'restrictions': ''}, format='json')
        self.assertEqual(response.status_code, 200)
        updated = response.json()
        for field in ('id', 'created_at', 'first_name', 'phone'):
            self.assertEqual(updated[field], initial[field])
        self.assertGreater(updated['updated_at'], initial['updated_at'])
        self.assertEqual(updated['email'], '')
        self.assertIsNone(updated['birth_date'])
        self.assertEqual(updated['restrictions'], '')
        self.assertEqual(self.client.patch(path, {'phone': 'bad'}, format='json').status_code, 400)
        self.assertEqual(self.client.get(path).json()['phone'], initial['phone'])

    def test_isolation_even_for_staff(self):
        patient = Patient.objects.create(owner=self.other, **self.payload)
        self.owner.is_staff = True
        self.owner.save()
        path = f'/api/v1/patients/{patient.pk}/'
        self.assertEqual(self.client.get('/api/v1/patients/').json()['count'], 0)
        self.assertEqual(self.client.get(path).status_code, 404)
        self.assertEqual(self.client.patch(path, {'first_name': 'Otro'}, format='json').status_code, 404)
        patient.refresh_from_db()
        self.assertEqual(patient.first_name, self.payload['first_name'])

    def test_anonymous_denied(self):
        patient = Patient.objects.create(owner=self.owner, **self.payload)
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get('/api/v1/patients/').status_code, 403)
        self.assertEqual(self.client.get(f'/api/v1/patients/{patient.pk}/').status_code, 403)
        self.assertEqual(self.create().status_code, 403)

    def test_search_and_pagination(self):
        for i in range(21):
            Patient.objects.create(owner=self.owner, **(self.payload | {'last_name': f'Prueba{i:02}'}))
        first = self.client.get('/api/v1/patients/').json()
        self.assertEqual(first['count'], 21)
        self.assertEqual(len(first['results']), 20)
        self.assertIsNotNone(first['next'])
        self.assertEqual(len(self.client.get('/api/v1/patients/?page=2').json()['results']), 1)
        self.assertEqual(self.client.get('/api/v1/patients/?search=Prueba00').json()['count'], 1)
        self.assertEqual(self.client.get('/api/v1/patients/?search=absent').json()['count'], 0)
        self.assertEqual(self.client.get('/api/v1/patients/', {'search': 'x' * 151}).status_code, 400)

    def test_put_delete_not_exposed(self):
        patient = Patient.objects.create(owner=self.owner, **self.payload)
        path = f'/api/v1/patients/{patient.pk}/'
        self.assertEqual(self.client.put(path, self.payload, format='json').status_code, 405)
        self.assertEqual(self.client.delete(path).status_code, 405)

    def test_session_writes_require_csrf(self):
        client = APIClient(enforce_csrf_checks=True)
        client.force_login(self.owner)
        self.assertEqual(client.post('/api/v1/patients/', self.payload, format='json').status_code, 403)
        token = client.get('/api/v1/auth/csrf/').json()['csrfToken']
        self.assertEqual(client.post('/api/v1/patients/', self.payload, format='json',
                                     HTTP_X_CSRFTOKEN=token).status_code, 201)

    def test_database_constraints(self):
        for values in ({'phone': 'bad'}, {'first_name': ''}, {'first_name': '   '},
                       {'last_name': ''}, {'last_name': '   '},
                       {'allergies': 'x' * 2001}, {'restrictions': 'x' * 2001}):
            with self.subTest(values=str(values)[:40]):
                with self.assertRaises(IntegrityError), transaction.atomic():
                    Patient.objects.create(owner=self.owner, **(self.payload | values))

    def test_owner_cannot_be_deleted_with_patients(self):
        Patient.objects.create(owner=self.owner, **self.payload)
        with self.assertRaises(ProtectedError):
            self.owner.delete()
        self.assertTrue(get_user_model().objects.filter(pk=self.owner.pk).exists())
