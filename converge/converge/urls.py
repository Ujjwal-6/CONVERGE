"""
Converge Embedding & Matching Microservice

Receives parsed JSONs from Spring Boot backend.
Generates semantic text + embeddings.
Performs candidate matching for projects.
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from converge import views as core_views

urlpatterns = [
	path("admin/", admin.site.urls),
	path("api/", core_views.api_info, name="api-info"),
	path("api/resume/", include("resumes.urls")),
	path("api/project/", include("projects.urls")),
]

if settings.DEBUG:
	urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
