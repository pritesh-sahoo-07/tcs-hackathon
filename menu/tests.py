import json

from django.test import Client, TestCase

from .models import FoodItem


class RecommendationApiTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        FoodItem.objects.create(
            name='Quick Veg Wrap', slug='quick-veg-wrap',
            description='A quick vegetarian wrap.', price='60.00',
            category='Rolls', meal_type='snack', ingredients='Roti, vegetables',
            vegetarian=True, vegan=True, low_oil=True, spice_level=3,
            preparation_time=5, available=True, tags='spicy, quick',
            suitable_moods='tired, hungry',
        )
        FoodItem.objects.create(
            name='Unavailable Burger', slug='unavailable-burger',
            description='Not available today.', price='40.00',
            category='Fast Food', meal_type='snack', ingredients='Bread',
            vegetarian=True, preparation_time=5, available=False,
        )

    def post_recommendation(self, payload):
        client = Client()
        return client.post(
            '/api/recommend/', data=json.dumps(payload),
            content_type='application/json',
        )

    def test_recommendation_response_has_safe_available_matches(self):
        response = self.post_recommendation({
            'budget': 100, 'mood': 'tired', 'craving': 'spicy',
            'diet': 'vegetarian', 'available_time': 10, 'meal_type': 'snack',
        })
        data = response.json()
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data['success'])
        self.assertTrue(data['recommendations'])
        self.assertTrue(all(item['available'] for item in data['recommendations']))
        self.assertIn('image_url', data['recommendations'][0])

    def test_recommendation_rejects_missing_budget(self):
        response = self.post_recommendation({'available_time': 10})
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.json()['success'])
