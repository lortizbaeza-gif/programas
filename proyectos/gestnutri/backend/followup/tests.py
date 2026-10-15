from datetime import datetime, timedelta
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db.models import PROTECT
from django.test import SimpleTestCase
from django.utils import timezone

from .models import Consultation, ManualNote, Measurement, validate_occurred_at


class FollowupModelContractTests(SimpleTestCase):
    def test_dates_require_timezone_and_cannot_be_future(self):
        validate_occurred_at(timezone.now() - timedelta(days=1))
        for value in (datetime(2020, 1, 1), timezone.now() + timedelta(days=1)):
            with self.subTest(value=value), self.assertRaises(ValidationError):
                validate_occurred_at(value)

    def test_weight_precision_range_and_finite_values(self):
        field = Measurement._meta.get_field('weight_kg')
        self.assertEqual(field.clean('70.00', None), Decimal('70.00'))
        self.assertEqual(field.clean('9999.99', None), Decimal('9999.99'))
        for value in ('0', '-1', '10000', '70.001', 'NaN', 'Infinity', None, True):
            with self.subTest(value=value), self.assertRaises(ValidationError):
                field.clean(value, None)

    def test_notes_validate_categories_and_nonblank_length(self):
        kind = ManualNote._meta.get_field('kind')
        text = ManualNote._meta.get_field('text')
        for value in ('note', 'preference', 'restriction'):
            self.assertEqual(kind.clean(value, None), value)
        with self.assertRaises(ValidationError):
            kind.clean('diagnosis', None)
        for value in ('', '   ', 'x' * 2001):
            with self.subTest(value=value[:10]), self.assertRaises(ValidationError):
                text.clean(value, None)
        note = ManualNote(text='  Dato ficticio  ')
        note.clean()
        self.assertEqual(note.text, 'Dato ficticio')

    def test_cardinality_protection_and_ownership(self):
        for model, relation in ((Consultation, 'patient'), (Measurement, 'consultation'),
                                (ManualNote, 'consultation')):
            self.assertIs(model._meta.get_field(relation).remote_field.on_delete, PROTECT)
            self.assertNotIn('owner', [field.name for field in model._meta.fields])
        self.assertTrue(Measurement._meta.get_field('consultation').unique)
