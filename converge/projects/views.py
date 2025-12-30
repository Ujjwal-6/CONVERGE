from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Project
from .serializers import ProjectSerializer
from pipelines.project_pipeline import process_project_instance
from pipelines.matching_service import match_users_for_project
import json


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    def perform_create(self, serializer):
        project = serializer.save()
        process_project_instance(project)

    def perform_update(self, serializer):
        project = serializer.save()
        process_project_instance(project)

    @action(detail=True, methods=["get"], url_path="matches")
    def matches(self, request, pk=None):
        try:
            top_n = int(request.query_params.get("top", 5))
        except ValueError:
            top_n = 5
        results = match_users_for_project(pk, top_n=top_n)
        return Response(results)


def create_project(request):
    """HTML form handler for creating a new project"""
    if request.method == "POST":
        try:
            title = request.POST.get("title", "").strip()
            description = request.POST.get("description", "").strip()
            skills = request.POST.get("required_skills", "").strip()
            tech = request.POST.get("preferred_technologies", "").strip()
            domains = request.POST.get("domains", "").strip()
            project_type = request.POST.get("project_type", "campus_closed")
            team_size = request.POST.get("team_size", "").strip()

            if not title or not description:
                messages.error(request, "Title and description are required.")
                return redirect("projects:create")

            # Build metadata
            metadata = {
                "required_skills": [s.strip() for s in skills.split(",") if s.strip()] if skills else [],
                "preferred_technologies": [t.strip() for t in tech.split(",") if t.strip()] if tech else [],
                "domains": [d.strip() for d in domains.split(",") if d.strip()] if domains else [],
                "project_type": project_type,
                "team_size": team_size or "Not specified",
            }

            # Create project
            project = Project.objects.create(
                title=title,
                description=description,
                project_type=project_type,
                metadata=metadata
            )

            # Process embeddings
            process_project_instance(project)

            messages.success(request, f"Project '{title}' created successfully! View matches here.")
            return redirect("projects:matches", project_id=project.id)

        except Exception as e:
            messages.error(request, f"Error creating project: {str(e)}")
            return redirect("projects:create")

    return render(request, "create_project.html")


def project_matches(request, project_id):
    """Display top matches for a given project"""
    try:
        project = get_object_or_404(Project, id=project_id)
        matches = match_users_for_project(project_id, top_n=5)
        
        context = {
            "project": project,
            "matches": matches,
        }
        return render(request, "project_matches.html", context)
    except Project.DoesNotExist:
        return render(request, "project_matches.html", {"error": "Project not found."})
    except Exception as e:
        return render(request, "project_matches.html", {"error": f"Error retrieving matches: {str(e)}"})

