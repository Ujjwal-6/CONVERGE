from django.contrib import admin
from .models import Rating


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
	list_display = ("rater_id", "ratee_id", "project_id", "raw_rating", "created_at")
	search_fields = ("rater_id", "ratee_id", "project_id")
