from django.contrib import admin

from .models import FoodItem


@admin.register(FoodItem)
class FoodItemAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'category',
        'meal_type',
        'price',
        'vegetarian',
        'vegan',
        'available',
    )
    list_filter = (
        'category',
        'meal_type',
        'vegetarian',
        'vegan',
        'jain',
        'high_protein',
        'low_oil',
        'available',
    )
    search_fields = ('name', 'description', 'ingredients', 'tags', 'suitable_moods')
    prepopulated_fields = {'slug': ('name',)}
