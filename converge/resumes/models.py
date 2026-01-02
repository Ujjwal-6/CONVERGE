from django.db import models


class ResumeEmbedding(models.Model):
	"""
	Stores embeddings for resumes parsed by Spring Boot backend.
	Django generates semantic_text + embedding from parsed JSON.
	"""
	resume_id = models.IntegerField(unique=True, db_index=True, help_text="Foreign key to Spring Boot resume table")
	semantic_text = models.TextField(blank=True, help_text="Reduced semantic representation")
	embedding = models.JSONField(default=list, help_text="768-dim embedding vector")
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		db_table = "resume_embeddings"
		indexes = [
			models.Index(fields=['resume_id']),
		]

	def __str__(self):
		return f"ResumeEmbedding(resume_id={self.resume_id})"


class ResumeJSON(models.Model):
	"""
	Stores canonical resume JSON provided by the Spring Boot backend.
	Used for downstream matching without depending on shared DB access.
	"""
	resume_id = models.IntegerField(unique=True, db_index=True, help_text="Foreign key to Spring Boot resume table")
	resume_json = models.JSONField(default=dict, help_text="Canonical resume JSON payload")
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		db_table = "resume_json_store"
		indexes = [
			models.Index(fields=['resume_id']),
		]

	def __str__(self):
		return f"ResumeJSON(resume_id={self.resume_id})"
