from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(['GET'])
def api_info(request):
	"""
	API health check and endpoint documentation.
	"""
	return Response({
		"status": "ok",
		"service": "Converge Embedding & Matching Microservice",
		"description": "Generates embeddings and performs candidate matching",
		"endpoints": {
			"resume_embed": "POST /api/resume/embed/ - Generate resume embedding",
			"project_embed": "POST /api/project/embed/ - Generate project embedding",
			"project_match": "POST /api/project/match/{project_id}/?top=5 - Match candidates to project"
		},
		"shared_db": "PostgreSQL - shares data with Spring Boot backend"
	})

