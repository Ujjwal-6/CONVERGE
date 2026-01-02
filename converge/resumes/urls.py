from django.urls import path
from . import views

app_name = "resumes"

urlpatterns = [
	path("embed/", views.generate_resume_embedding, name="generate-embedding"),
]

