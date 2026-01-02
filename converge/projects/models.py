from django.db import models


class ProjectEmbedding(models.Model):
	"""
	Stores embeddings for projects parsed by Spring Boot backend.
	Django generates semantic_text + embedding from parsed JSON.
	"""
	project_id = models.IntegerField(unique=True, db_index=True, help_text="Foreign key to Spring Boot project table")
	semantic_text = models.TextField(blank=True, help_text="Reduced semantic representation")
	embedding = models.JSONField(default=list, help_text="768-dim embedding vector")
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		db_table = "project_embeddings"
		indexes = [
			models.Index(fields=['project_id']),
		]

	def __str__(self):
		return f"ProjectEmbedding(project_id={self.project_id})"


class ProjectJSON(models.Model):
	"""Stores canonical project JSON provided by the Spring Boot backend."""
	project_id = models.IntegerField(unique=True, db_index=True, help_text="Foreign key to Spring Boot project table")
	project_json = models.JSONField(default=dict, help_text="Canonical project JSON payload")
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		db_table = "project_json_store"
		indexes = [
			models.Index(fields=['project_id']),
		]

	def __str__(self):
		return f"ProjectJSON(project_id={self.project_id})"
