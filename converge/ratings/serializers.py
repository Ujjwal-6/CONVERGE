from rest_framework import serializers
from .models import Rating


class RatingSerializer(serializers.ModelSerializer):
	class Meta:
		model = Rating
		fields = [
			"id",
			"rater_id",
			"ratee_id",
			"project_id",
			"category_scores",
			"raw_rating",
			"adjusted_rating",
			"created_at",
		]
		read_only_fields = ["id", "raw_rating", "adjusted_rating", "created_at"]


class SubmitRatingSerializer(serializers.Serializer):
	rater_id = serializers.CharField(max_length=64)
	ratee_id = serializers.CharField(max_length=64)
	project_id = serializers.CharField(max_length=64)
	category_scores = serializers.JSONField()
