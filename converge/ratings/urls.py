from django.urls import path
from . import views

app_name = "ratings"

urlpatterns = [
	path("submit/", views.submit_rating, name="submit"),
	path("user/<str:ratee_id>/", views.user_rating, name="user-rating"),
]
