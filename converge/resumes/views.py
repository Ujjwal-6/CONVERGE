from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import ResumeEmbedding, ResumeJSON
from .serializers import (
	ResumeEmbeddingSerializer,
	ResumeJSONInputSerializer,
	ResumeJSONSerializer,
)
from external.semantic import build_semantic_text
from external.embed_resume import embed_semantic_text


@api_view(['POST'])
def upsert_resume_json(request):
	"""
	Store/update canonical resume JSON and generate/update its embedding in one step.
	Accepts either `resume_json` or `parsed_json` for convenience.

	POST /api/resume/json/
	Body: {
		"resume_id": 123,
		"resume_json" | "parsed_json": { ... }
	}
	"""
	input_serializer = ResumeJSONInputSerializer(data=request.data)

	if not input_serializer.is_valid():
		return Response(input_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

	resume_id = input_serializer.validated_data['resume_id']
	resume_json = input_serializer.validated_data['resume_json']

	try:
		resume_record, created = ResumeJSON.objects.update_or_create(
			resume_id=resume_id,
			defaults={"resume_json": resume_json}
		)

		# Generate semantic text and embedding immediately
		semantic_text = build_semantic_text(resume_json)
		embedding = embed_semantic_text(semantic_text)

		resume_embedding, emb_created = ResumeEmbedding.objects.update_or_create(
			resume_id=resume_id,
			defaults={
				"semantic_text": semantic_text,
				"embedding": embedding,
			}
		)

		output_serializer = ResumeJSONSerializer(resume_record)
		embedding_serializer = ResumeEmbeddingSerializer(resume_embedding)
		return Response(
			{
				"message": "Resume JSON and embedding stored successfully",
				"json_record": output_serializer.data,
				"embedding_record": embedding_serializer.data
			},
			status=status.HTTP_201_CREATED if created or emb_created else status.HTTP_200_OK
		)
	except Exception as e:
		return Response(
			{"error": f"Resume JSON storage failed: {str(e)}"},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)


