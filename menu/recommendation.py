"""Simple rule-based food recommendations for CanteenAI."""

from decimal import Decimal, InvalidOperation

from .models import FoodItem


MAX_SCORE = 140

# These are intentionally simple, fixed canteen combinations. A combo is only
# returned when every item is available and its total is within the budget.
COMBO_OPTIONS = [
    ('Noodles Snack Combo', ['veg-noodles', 'lemon-juice', 'samosa']),
    ('Paneer Roll Combo', ['paneer-roll', 'lemon-juice']),
    ('South Indian Combo', ['masala-dosa', 'tea']),
    ('Burger Combo', ['veg-burger', 'french-fries', 'coffee']),
]


def _to_decimal(value):
    """Return a usable budget value, or None when no budget was supplied."""
    if value in (None, ''):
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError):
        return None


def _to_int(value):
    """Return an integer time value, or None when no time was supplied."""
    try:
        return int(value) if value not in (None, '') else None
    except (TypeError, ValueError):
        return None


def _split_values(value):
    return {part.strip().lower() for part in value.split(',') if part.strip()}


def _matches_diet(food_item, diet):
    """Return True when an item satisfies the selected dietary restriction."""
    diet = (diet or '').strip().lower()
    if diet in ('vegetarian', 'veg'):
        return food_item.vegetarian
    if diet == 'vegan':
        return food_item.vegan
    if diet == 'jain':
        return food_item.jain
    if diet in ('high protein', 'high_protein'):
        return food_item.high_protein
    if diet in ('low oil', 'low_oil'):
        return food_item.low_oil
    return True


def _matches_craving(food_item, craving):
    """Match common craving choices against tags and food attributes."""
    craving = (craving or '').strip().lower()
    if not craving:
        return False

    if craving == 'spicy':
        return food_item.spice_level >= 3
    if craving == 'sweet':
        return food_item.sweetness_level >= 3
    if craving in ('healthy', 'light'):
        return food_item.low_oil
    if craving in ('protein', 'high protein'):
        return food_item.high_protein

    searchable_text = ' '.join(
        [food_item.name, food_item.category, food_item.ingredients, food_item.tags]
    ).lower()
    return craving in searchable_text


def _food_data(food_item, score, explanations):
    """Convert a model instance into plain data suitable for a future JSON API."""
    dietary_info = []
    if food_item.vegetarian:
        dietary_info.append('Vegetarian')
    if food_item.vegan:
        dietary_info.append('Vegan')
    if food_item.jain:
        dietary_info.append('Jain')
    if food_item.high_protein:
        dietary_info.append('High protein')
    if food_item.low_oil:
        dietary_info.append('Low oil')

    return {
        'id': food_item.id,
        'name': food_item.name,
        'slug': food_item.slug,
        'description': food_item.description,
        'price': float(food_item.price),
        'category': food_item.category,
        'meal_type': food_item.meal_type,
        'preparation_time': food_item.preparation_time,
        'available': food_item.available,
        'image_url': food_item.image.url if food_item.image else '',
        'dietary_info': dietary_info,
        'score': score,
        'match_percentage': round((score / MAX_SCORE) * 100),
        'explanation': explanations,
    }


def score_food_item(food_item, budget=None, mood='', craving='', diet='',
                    available_time=None, meal_type=''):
    """Score one available FoodItem and return its structured recommendation."""
    score = 30  # This function is called only for available items.
    explanations = ['Available now']
    budget = _to_decimal(budget)
    available_time = _to_int(available_time)

    # Food within budget is best; an item up to 15% over gets partial credit.
    if budget is not None:
        if food_item.price <= budget:
            score += 30
            explanations.append('Within your budget')
        elif food_item.price <= budget * Decimal('1.15'):
            score += 15
            explanations.append('Only slightly above your budget')

    if available_time is not None and food_item.preparation_time <= available_time:
        score += 20
        explanations.append('Ready within your available time')

    if (diet or '').strip().lower() in (
        'vegetarian', 'veg', 'vegan', 'jain', 'high protein', 'high_protein', 'low oil', 'low_oil'
    ) and _matches_diet(
        food_item, diet
    ):
        score += 25
        explanations.append(f'Matches your {diet} diet')

    if _matches_craving(food_item, craving):
        score += 15
        explanations.append(f'Matches your {craving} craving')

    requested_meal = (meal_type or '').strip().lower()
    if requested_meal == 'beverage':
        meal_matches = food_item.category.lower() == 'beverages'
    else:
        meal_matches = food_item.meal_type == requested_meal
    if requested_meal and meal_matches:
        score += 10
        explanations.append(f'Good for {meal_type}')

    if mood and mood.strip().lower() in _split_values(food_item.suitable_moods):
        score += 10
        explanations.append(f'Suits your {mood} mood')

    return _food_data(food_item, score, explanations)


def get_combo_recommendations(budget):
    """Return up to three available combos that never cost more than budget."""
    budget = _to_decimal(budget)
    if budget is None or budget < 0:
        return []

    foods_by_slug = {
        food.slug: food
        for food in FoodItem.objects.filter(available=True)
    }
    combos = []

    for combo_name, slugs in COMBO_OPTIONS:
        foods = [foods_by_slug.get(slug) for slug in slugs]
        if None in foods:
            continue

        total_price = sum((food.price for food in foods), Decimal('0'))
        if total_price <= budget:
            combos.append({
                'name': combo_name,
                'items': [
                    {'name': food.name, 'slug': food.slug, 'price': float(food.price)}
                    for food in foods
                ],
                'total_price': float(total_price),
                'savings_from_budget': float(budget - total_price),
            })

    return sorted(combos, key=lambda combo: combo['total_price'], reverse=True)[:3]


def get_recommendations(budget, mood='', craving='', diet='', available_time=None,
                        meal_type=''):
    """Return the top three available foods and budget-safe combo suggestions."""
    # Unavailable items are excluded so they can never be a primary suggestion.
    available_foods = FoodItem.objects.filter(available=True)
    possible_foods = [
        food for food in available_foods
        if _matches_diet(food, diet)
    ]

    recommendations = [
        score_food_item(
            food,
            budget=budget,
            mood=mood,
            craving=craving,
            diet=diet,
            available_time=available_time,
            meal_type=meal_type,
        )
        for food in possible_foods
    ]
    recommendations.sort(key=lambda item: (-item['score'], item['price']))

    recommendations = recommendations[:3]
    alternatives = []
    if not recommendations:
        # The primary list always excludes unavailable items and honours dietary
        # restrictions. These are deliberately labelled alternatives, never picks.
        alternatives = [
            _food_data(food, 0, ['Closest available option — adjust a preference to match it.'])
            for food in FoodItem.objects.filter(available=True).order_by('price')[:3]
        ]

    message = 'Here are your best available matches.' if recommendations else (
        'No exact match was found. Try increasing your budget, time, or changing one preference.'
    )
    return {
        'success': True,
        'recommendations': recommendations,
        'combos': get_combo_recommendations(budget),
        'alternatives': alternatives,
        'message': message,
    }
