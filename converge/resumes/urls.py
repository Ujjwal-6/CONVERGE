from django.urls import path
from . import views

app_name = "resumes"

urlpatterns = [
	path("json/", views.upsert_resume_json, name="upsert-json"),
]

