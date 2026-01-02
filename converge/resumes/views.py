from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import ResumeEmbedding
from .serializers import ResumeEmbeddingInputSerializer, ResumeEmbeddingSerializer
from external.semantic import build_semantic_text
from external.embed_resume import embed_semantic_text


@api_view(['POST'])
def generate_resume_embedding(request):
	"""
	Generate semantic text and embedding from parsed resume JSON.
	
	POST /api/embed/resume/
	Body: {
		"resume_id": 123,
		"parsed_json": { ... parsed resume data from Spring Boot ... }
	}
	
	Returns: {
		"resume_id": 123,
		"semantic_text": "...",
		"embedding": [768 floats],
		"created_at": "...",
		"updated_at": "..."
	}
	"""
	input_serializer = ResumeEmbeddingInputSerializer(data=request.data)
	
	if not input_serializer.is_valid():
		return Response(input_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
	
	resume_id = input_serializer.validated_data['resume_id']
	parsed_json = input_serializer.validated_data['parsed_json']
	
	try:
		# Generate semantic text
		semantic_text = build_semantic_text(parsed_json)
		
		# Generate embedding
		embedding = embed_semantic_text(semantic_text)
		
		# Store or update
		resume_embedding, created = ResumeEmbedding.objects.update_or_create(
			resume_id=resume_id,
			defaults={
				'semantic_text': semantic_text,
				'embedding': embedding
			}
		)
		#No need to retuern, only store
		output_serializer = ResumeEmbeddingSerializer(resume_embedding)
		return Response(
			{
				"message": "Embedding generated successfully",
				"data": output_serializer.data
			},
			status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
		)
		
	except Exception as e:
		return Response(
			{"error": f"Embedding generation failed: {str(e)}"},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)


