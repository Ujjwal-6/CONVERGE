from django.contrib import admin

from .models import ResumeEmbedding, ResumeJSON


@admin.register(ResumeEmbedding)
class ResumeEmbeddingAdmin(admin.ModelAdmin):
	list_display = ("resume_id", "created_at", "updated_at")
	search_fields = ("resume_id",)


@admin.register(ResumeJSON)
class ResumeJSONAdmin(admin.ModelAdmin):
	list_display = ("resume_id", "created_at", "updated_at")
	search_fields = ("resume_id",)
