from rest_framework import serializers
from .models import ResumeEmbedding, ResumeJSON


class ResumeEmbeddingSerializer(serializers.ModelSerializer):
	"""Output with embedding data"""
	class Meta:
		model = ResumeEmbedding
		fields = ['resume_id', 'semantic_text', 'embedding', 'created_at', 'updated_at']
		read_only_fields = ['created_at', 'updated_at']


class ResumeJSONInputSerializer(serializers.Serializer):
	"""Input serializer for storing canonical resume JSON (or parsed_json alias)."""
	resume_id = serializers.IntegerField(required=True)
	resume_json = serializers.JSONField(required=False)
	parsed_json = serializers.JSONField(required=False)

	def validate(self, attrs):
		# Allow either resume_json or parsed_json; prefer resume_json if both.
		resume_json = attrs.get("resume_json") or attrs.get("parsed_json")
		if resume_json is None:
			raise serializers.ValidationError({"resume_json": "resume_json or parsed_json is required"})
		attrs["resume_json"] = resume_json
		attrs.pop("parsed_json", None)
		# Coerce resume_id to int for consistency
		try:
			attrs["resume_id"] = int(attrs["resume_id"])
		except (TypeError, ValueError):
			raise serializers.ValidationError({"resume_id": "resume_id must be an integer"})
		return attrs


class ResumeJSONSerializer(serializers.ModelSerializer):
	"""Output serializer for stored resume JSON"""
	class Meta:
		model = ResumeJSON
		fields = ['resume_id', 'resume_json', 'created_at', 'updated_at']
		read_only_fields = ['created_at', 'updated_at']

