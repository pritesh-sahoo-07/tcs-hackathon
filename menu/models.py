from django.db import models


class FoodItem(models.Model):
    class MealType(models.TextChoices):
        BREAKFAST = 'breakfast', 'Breakfast'
        LUNCH = 'lunch', 'Lunch'
        SNACK = 'snack', 'Snack'
        DINNER = 'dinner', 'Dinner'
        DESSERT = 'dessert', 'Dessert'

    name = models.CharField(max_length=150)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    category = models.CharField(max_length=100)
    meal_type = models.CharField(max_length=20, choices=MealType.choices)
    ingredients = models.TextField(blank=True)
    vegetarian = models.BooleanField(default=False)
    vegan = models.BooleanField(default=False)
    jain = models.BooleanField(default=False)
    high_protein = models.BooleanField(default=False)
    low_oil = models.BooleanField(default=False)
    spice_level = models.PositiveSmallIntegerField(default=0)
    sweetness_level = models.PositiveSmallIntegerField(default=0)
    preparation_time = models.PositiveIntegerField(
        help_text='Preparation time in minutes.'
    )
    available = models.BooleanField(default=True)
    tags = models.TextField(blank=True, help_text='Comma-separated tags.')
    suitable_moods = models.TextField(
        blank=True,
        help_text='Comma-separated moods this item suits.'
    )
    image = models.ImageField(
        upload_to='food/',
        blank=True,
        null=True,
        help_text='Optional food photograph used in the menu.'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
