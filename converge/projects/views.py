from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import ProjectEmbedding
from .serializers import ProjectEmbeddingInputSerializer, ProjectEmbeddingSerializer
from resumes.models import ResumeEmbedding
from external.semantic_project import build_semantic_text_project
from external.embed_project import embed_semantic_text_project
from external.match_users_to_projects import semantic_gate, score_skill_match, score_experience_alignment, score_year_compatibility, score_reputation, score_availability, compute_final_score


@api_view(['POST'])
def generate_project_embedding(request):
	"""
	Generate semantic text and embedding from parsed project JSON.
	
	POST /api/embed/project/
	Body: {
		"project_id": 456,
		"parsed_json": { ... parsed project data from Spring Boot ... }
	}
	
	Returns: {
		"project_id": 456,
		"semantic_text": "...",
		"embedding": [768 floats],
		"created_at": "...",
		"updated_at": "..."
	}
	"""
	input_serializer = ProjectEmbeddingInputSerializer(data=request.data)
	
	if not input_serializer.is_valid():
		return Response(input_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
	
	project_id = input_serializer.validated_data['project_id']
	parsed_json = input_serializer.validated_data['parsed_json']
	
	try:
		# Generate semantic text
		semantic_text = build_semantic_text_project(parsed_json)
		
		# Generate embedding
		embedding = embed_semantic_text_project(semantic_text)
		
		# Store or update
		project_embedding, created = ProjectEmbedding.objects.update_or_create(
			project_id=project_id,
			defaults={
				'semantic_text': semantic_text,
				'embedding': embedding
			}
		)
		
		output_serializer = ProjectEmbeddingSerializer(project_embedding)
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


@api_view(['POST'])
def match_project(request, project_id):
	"""
	Find top-N matching resumes for a project.
	
	POST /api/match/{project_id}/?top=5
	
	Returns: {
		"project_id": 456,
		"matches": [
			{
				"resume_id": 123,
				"final_score": 0.85,
				"semantic_score": 0.72,
				"skill_score": 0.90,
				...
			},
			...
		],
		"count": 5
	}
	"""
	try:
		top_n = int(request.query_params.get('top', 5))
	except ValueError:
		top_n = 5
	
	try:
		# Get project embedding
		project_embedding_obj = ProjectEmbedding.objects.get(project_id=project_id)
		proj_emb = project_embedding_obj.embedding
		
		if not proj_emb:
			return Response(
				{"error": f"Project {project_id} has no embedding"},
				status=status.HTTP_400_BAD_REQUEST
			)
		
		# You need to fetch the full project JSON from Spring Boot's DB
		# For now, we'll use metadata if available
		# TODO: Query Spring Boot's project table via shared DB
		proj_json = {}  # Placeholder - fetch from Spring Boot table
		
		results = []
		total_resumes = ResumeEmbedding.objects.count()
		resumes_with_embeddings = 0
		passed_gate = 0
		
		print(f"\n{'='*60}")
		print(f"[matching] Starting match for project_id={project_id}, top_n={top_n}")
		print(f"{'='*60}")
		
		# Consider all resume embeddings
		for idx, resume_emb in enumerate(ResumeEmbedding.objects.all(), 1):
			if not resume_emb.embedding:
				print(f"[{idx}/{total_resumes}] resume_id={resume_emb.resume_id}: ❌ No embedding")
				continue
			
			resumes_with_embeddings += 1
			
			# Phase 1: semantic gate->vector similarity
			passes, sem_score = semantic_gate(proj_emb, resume_emb.embedding)
			
			print(f"[{idx}/{total_resumes}] resume_id={resume_emb.resume_id}: semantic={sem_score:.4f}, passes={passes}")
			
			if not passes:
				continue
			
			passed_gate += 1
			
			# Phase 2: composite scoring
			# TODO: Fetch resume parsed_json from Spring Boot's resume table
			user_json = {}  # Placeholder
			profile = user_json.get("profile", {})
			skills = user_json.get("skills", {})
			experience = user_json.get("experience_level", {})
			reputation = user_json.get("reputation_signals", {})
			
			required_skills = proj_json.get("required_skills", [])
			project_type = proj_json.get("project_type", "hackathon")
			
			skill_score = score_skill_match(required_skills, skills)
			experience_score = score_experience_alignment(
				project_type,
				experience.get("overall", "beginner"),
				experience.get("by_domain", {})
			)
			year_score = score_year_compatibility(profile.get("year", ""))
			reputation_score = score_reputation(
				reputation.get("average_rating", 0),
				reputation.get("completed_projects", 0)
			)
			availability_score = score_availability(profile.get("availability", "medium"))
			
			final_score = compute_final_score(
				sem_score,
				skill_score,
				experience_score,
				year_score,
				reputation_score,
				availability_score,
			)
			
			print(f"    └─ Final: {final_score:.4f}")
			
			results.append({
				"resume_id": resume_emb.resume_id,
				"final_score": round(final_score, 4),
				"semantic_score": round(sem_score, 4),
				"skill_score": round(skill_score, 4),
				"experience_score": round(experience_score, 4),
				"year_score": round(year_score, 4),
				"reputation_score": round(reputation_score, 4),
				"availability_score": round(availability_score, 4),
			})
		
		# Sort and return top-n
		results.sort(key=lambda r: r["final_score"], reverse=True)
		
		print(f"\n{'='*60}")
		print(f"[matching] Summary:")
		print(f"  Total resumes: {total_resumes}")
		print(f"  With embeddings: {resumes_with_embeddings}")
		print(f"  Passed semantic gate: {passed_gate}")
		print(f"  Final matches: {len(results[:top_n])}")
		print(f"{'='*60}\n")
		
		return Response({
			"project_id": project_id,
			"matches": results[:top_n],
			"count": len(results[:top_n])
		}, status=status.HTTP_200_OK)
		
	except ProjectEmbedding.DoesNotExist:
		return Response(
			{"error": f"Project {project_id} not found or has no embedding"},
			status=status.HTTP_404_NOT_FOUND
		)
	except Exception as e:
		import traceback
		print(traceback.format_exc())
		return Response(
			{"error": f"Matching failed: {str(e)}"},
			status=status.HTTP_500_INTERNAL_SERVER_ERROR
		)


