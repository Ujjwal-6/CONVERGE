from rest_framework import serializers
from .models import ResumeEmbedding


class ResumeEmbeddingInputSerializer(serializers.Serializer):
	"""Input for embedding generation"""
	resume_id = serializers.IntegerField(required=True)
	parsed_json = serializers.JSONField(required=True)


class ResumeEmbeddingSerializer(serializers.ModelSerializer):
	"""Output with embedding data"""
	class Meta:
		model = ResumeEmbedding
		fields = ['resume_id', 'semantic_text', 'embedding', 'created_at', 'updated_at']
		read_only_fields = ['created_at', 'updated_at']

