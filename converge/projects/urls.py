from django.urls import path
from . import views

app_name = "projects"

urlpatterns = [
	path("embed/", views.generate_project_embedding, name="generate-embedding"),
	path("match/<int:project_id>/", views.match_project, name="match"),
]

