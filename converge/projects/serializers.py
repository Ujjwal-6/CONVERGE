from rest_framework import serializers
from .models import ProjectEmbedding, ProjectJSON


class ProjectEmbeddingInputSerializer(serializers.Serializer):
	"""Input for embedding generation"""
	project_id = serializers.IntegerField(required=True)
	parsed_json = serializers.JSONField(required=True)
	
#This is a simple serializer for input data when generating project embeddings.
#it simply takes project_id and parsed_json as input fields
#from the incoming request in json format.

class ProjectEmbeddingSerializer(serializers.ModelSerializer):
	"""Output with embedding data"""
	class Meta:
		model = ProjectEmbedding
		fields = ['project_id', 'semantic_text', 'embedding', 'created_at', 'updated_at']
		read_only_fields = ['created_at', 'updated_at']


class ProjectJSONSerializer(serializers.ModelSerializer):
	"""Output serializer for stored project JSON"""
	class Meta:
		model = ProjectJSON
		fields = ['project_id', 'project_json', 'created_at', 'updated_at']
		read_only_fields = ['created_at', 'updated_at']

#this is a model serializer for project embedidngs.
#it outputs project_id, semantic_text, embedding, created_at, updated_at fields
#in json format, taking data from ProjectEmbedding model(table)