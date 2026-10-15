import json
from datetime import date
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.test import TestCase, Client
from rest_framework.test import APIClient
from .models import Patient, Consultation, Measurement

class ClinicTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user('nutri', password='DemoTestPassword!26')
        self.other = get_user_model().objects.create_user('other', password='AnotherPassword!26')
        self.client = APIClient()
        self.patient = Patient.objects.create(owner=self.user, name='Paciente ficticio')
        self.foreign = Patient.objects.create(owner=self.other, name='Otro expediente ficticio')
    def sign_in(self):
        self.client.force_authenticate(self.user)
    def visit(self, day, value='70.00', unit='kg', method='Instrumento A', kind='weight', patient=None):
        c = Consultation.objects.create(patient=patient or self.patient, date=date(2026,9,day))
        Measurement.objects.create(consultation=c, kind=kind, value=None if value is None else Decimal(value), unit=unit, method=method)
        return c
    def compare(self, a, b):
        return self.client.get(f'/api/patients/{self.patient.pk}/compare/?before={a.pk}&after={b.pk}')
    def test_requires_session(self):
        self.assertEqual(self.client.get('/api/patients/').status_code,403)
        self.assertEqual(self.client.post('/api/consultations/',{}).status_code,403)
    def test_patient_creation_and_search(self):
        self.sign_in()
        response=self.client.post('/api/patients/', {'name':'Ejemplo ficticio D','allergies':'Ejemplo'},format='json')
        self.assertEqual(response.status_code,201)
        self.assertEqual(Patient.objects.get(pk=response.data['id']).owner,self.user)
        result=self.client.get('/api/patients/?search=Ejemplo')
        self.assertEqual(result.data['count'],1)
    def test_patient_invalid_and_update(self):
        self.sign_in()
        self.assertEqual(self.client.post('/api/patients/',{'name':' '},format='json').status_code,400)
        result=self.client.patch(f'/api/patients/{self.patient.pk}/',{'restrictions':'Ejemplo ficticio'},format='json')
        self.assertEqual(result.status_code,200)
        self.patient.refresh_from_db();self.assertEqual(self.patient.restrictions,'Ejemplo ficticio')
    def test_patient_isolation(self):
        self.sign_in()
        self.assertEqual(self.client.get('/api/patients/').data['count'],1)
        self.assertEqual(self.client.get(f'/api/patients/{self.foreign.pk}/').status_code,404)
        result=self.client.post('/api/consultations/',{'patient':self.foreign.pk,'date':'2026-09-10','measurements':[]},format='json')
        self.assertEqual(result.status_code,400)
    def test_store_null_and_zero(self):
        self.sign_in()
        result=self.client.post('/api/consultations/',{'patient':self.patient.pk,'date':'2026-09-10','notes':'Nota ficticia','measurements':[{'kind':'weight','value':None,'unit':'kg','method':''},{'kind':'fat','value':'0','unit':'%','method':'A'}]},format='json')
        self.assertEqual(result.status_code,201)
        self.assertIsNone(Measurement.objects.get(kind='weight').value)
        self.assertEqual(Measurement.objects.get(kind='fat').value,Decimal('0'))
        history=self.client.get(f'/api/patients/{self.patient.pk}/history/').data
        self.assertEqual(history[0]['notes'],'Nota ficticia')
    def test_invalid_measurements_are_atomic(self):
        self.sign_in()
        body={'patient':self.patient.pk,'date':'2026-09-10','measurements':[{'kind':'weight','value':'70','unit':'%'},{'kind':'fat','value':'105','unit':'%'}]}
        self.assertEqual(self.client.post('/api/consultations/',body,format='json').status_code,400)
        self.assertEqual(Consultation.objects.count(),0)
        self.assertEqual(Measurement.objects.count(),0)
    def test_duplicate_indicator_rejected(self):
        self.sign_in()
        row={'kind':'weight','value':'70','unit':'kg'}
        body={'patient':self.patient.pk,'date':'2026-09-10','measurements':[row,row]}
        self.assertEqual(self.client.post('/api/consultations/',body,format='json').status_code,400)
        self.assertEqual(Consultation.objects.count(),0)
    def test_history_orders_and_empty(self):
        self.sign_in();a=self.visit(2);b=self.visit(20)
        data=self.client.get(f'/api/patients/{self.patient.pk}/history/').data
        self.assertEqual([v['id'] for v in data],[b.pk,a.pk])
        patient=Patient.objects.create(owner=self.user,name='Sin consultas')
        self.assertEqual(self.client.get(f'/api/patients/{patient.pk}/history/').data,[])
    def test_decimal_comparison(self):
        self.sign_in();a=self.visit(2,'70.10');b=self.visit(20,'69.80')
        response=self.compare(a,b)
        self.assertEqual(response.status_code,200)
        self.assertEqual(response.data['results'][0]['delta'],'-0.30')
    def test_null_is_not_zero_in_comparison(self):
        self.sign_in();a=self.visit(2,None);b=self.visit(20,'0')
        result=self.compare(a,b).data['results'][0]
        self.assertIsNone(result['delta']);self.assertIsNone(result['before']);self.assertEqual(result['after'],'0.00')
    def test_units_and_methods_not_comparable(self):
        self.sign_in();a=self.visit(2,'25','%',kind='fat');b=self.visit(20,'25','kg',kind='fat')
        self.assertEqual(self.compare(a,b).data['results'][1]['reason'],'Unidades diferentes.')
        a=self.visit(3,method='A');b=self.visit(21,method='B')
        self.assertIsNone(self.compare(a,b).data['results'][0]['delta'])
    def test_missing_method_is_not_comparable(self):
        self.sign_in();a=self.visit(2,method='');b=self.visit(20,method='')
        self.assertIsNone(self.compare(a,b).data['results'][0]['delta'])
    def test_same_reverse_and_foreign_consultation_rejected(self):
        self.sign_in();a=self.visit(2);b=self.visit(20);c=self.visit(22,patient=self.foreign)
        for x,y in [(a,a),(b,a),(a,c)]:
            self.assertEqual(self.compare(x,y).status_code,400)
    def test_csrf_required_for_login(self):
        client=Client(enforce_csrf_checks=True)
        response=client.post('/api/login/',json.dumps({'username':'nutri','password':'DemoTestPassword!26'}),content_type='application/json')
        self.assertEqual(response.status_code,403)
    def test_login_session_logout_and_csrf(self):
        client=Client(enforce_csrf_checks=True)
        token=client.get('/api/csrf/').json()['csrfToken']
        response=client.post('/api/login/',json.dumps({'username':'nutri','password':'DemoTestPassword!26'}),content_type='application/json',HTTP_X_CSRFTOKEN=token)
        self.assertEqual(response.status_code,200)
        self.assertEqual(client.get('/api/me/').json()['username'],'nutri')
        token=response.json()['csrfToken']
        self.assertEqual(client.post('/api/patients/',json.dumps({'name':'CSRF ficticio'}),content_type='application/json').status_code,403)
        self.assertEqual(client.post('/api/patients/',json.dumps({'name':'CSRF ficticio'}),content_type='application/json',HTTP_X_CSRFTOKEN=token).status_code,201)
        self.assertEqual(client.post('/api/logout/',HTTP_X_CSRFTOKEN=token).status_code,200)
        self.assertEqual(client.get('/api/patients/').status_code,403)
    def test_invalid_json_and_future_date(self):
        client=Client()
        self.assertEqual(client.post('/api/login/','[]',content_type='application/json').status_code,400)
        self.sign_in()
        self.assertEqual(self.client.post('/api/consultations/',{'patient':self.patient.pk,'date':'2999-01-01','measurements':[]},format='json').status_code,400)
