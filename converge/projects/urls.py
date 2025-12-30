from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = "projects"
router = DefaultRouter()
router.register(r"", views.ProjectViewSet, basename="project")

urlpatterns = [
    path("create/", views.create_project, name="create"),
    path("<int:project_id>/matches/", views.project_matches, name="matches"),
    path("", include(router.urls)),
]
