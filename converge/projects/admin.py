from django.contrib import admin

from .models import ProjectEmbedding


@admin.register(ProjectEmbedding)
class ProjectEmbeddingAdmin(admin.ModelAdmin):
	list_display = ("project_id", "created_at", "updated_at")
	search_fields = ("project_id",)
