import json
from decimal import Decimal, InvalidOperation

from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render
from django.views.decorators.http import require_POST

from .models import FoodItem
from .recommendation import get_recommendations


def home(request):
    popular_items = FoodItem.objects.filter(available=True).order_by('price')[:3]
    return render(request, 'home.html', {'popular_items': popular_items})


def menu(request):
    food_items = FoodItem.objects.order_by('category', 'name')
    return render(request, 'menu.html', {'food_items': food_items})


def recommendation(request):
    return render(request, 'recommendation.html')


def food_detail(request, slug):
    food_item = get_object_or_404(FoodItem, slug=slug)
    return render(request, 'food_detail.html', {'food_item': food_item})


@require_POST
def recommend_api(request):
    """Return food recommendations for the preferences sent by the web form."""
    try:
        data = json.loads(request.body)
        budget = Decimal(str(data.get('budget', '')))
        available_time = int(data.get('available_time', data.get('time', '')))
    except (AttributeError, json.JSONDecodeError, InvalidOperation, TypeError, ValueError):
        return JsonResponse({'success': False, 'error': 'Please provide a valid budget and available time.'}, status=400)

    if budget <= 0 or available_time < 0:
        return JsonResponse({'success': False, 'error': 'Budget and available time must be positive.'}, status=400)

    def value_for(key):
        value = data.get(key, '')
        return value.strip().lower() if isinstance(value, str) else ''

    result = get_recommendations(
        budget=budget,
        mood=value_for('mood'),
        craving='' if value_for('craving') == 'none' else value_for('craving'),
        diet='' if value_for('diet') == 'none' else value_for('diet'),
        available_time=available_time,
        meal_type=value_for('meal_type'),
    )
    return JsonResponse(result)
