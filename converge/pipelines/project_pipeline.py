from typing import Optional
import os
from decouple import config

# Note: import external modules lazily inside the function after setting GEMINI_API_KEY


def process_project_instance(project) -> Optional[dict]:
    """
    Build PJ → semantic reduce → embed for a Project instance.
    Stores results back on the model.
    Returns a summary dict or None on failure.
    """
    try:
        # Ensure GEMINI_API_KEY available for external modules
        if not os.getenv("GEMINI_API_KEY"):
            gemini_key = config("GEMINI_API_KEY", default=None)
            if gemini_key:
                os.environ["GEMINI_API_KEY"] = gemini_key
        # Lazy imports after env var is ensured
        from external.create_project import create_project_json
        from external.semantic_project import build_semantic_text_project
        from external.embed_project import embed_semantic_text_project

        # Build a minimal PJ from existing model fields
        pj = create_project_json(
            title=project.title,
            description=project.description,
            required_skills=project.metadata.get("required_skills", []),
            preferred_technologies=project.metadata.get("preferred_technologies", []),
            domains=project.metadata.get("domains", []),
            project_type=project.metadata.get("project_type", "hackathon"),
            team_size=project.metadata.get("team_size", 0),
            project_id=f"proj_{project.pk}"
        )

        print("[project_pipeline] Semantic build starting...")
        semantic_text = build_semantic_text_project(pj)
        print(f"[project_pipeline] Semantic done (chars={len(semantic_text) if semantic_text else 0})")

        print("[project_pipeline] Embedding starting...")
        embedding = embed_semantic_text_project(semantic_text)
        print(f"[project_pipeline] Embedding done (dim={len(embedding) if embedding else 0})")

        # Persist
        project.metadata = pj
        project.semantic_text = semantic_text
        project.embedding = embedding
        project.save(update_fields=["metadata", "semantic_text", "embedding"])
        print("[project_pipeline] Persisted project with embedding length:", len(project.embedding or []))

        return {
            "embedding_dim": len(embedding or []),
        }

    except Exception as e:
        # Log the error for debugging
        import traceback
        print(f"ERROR in project pipeline: {str(e)}")
        print(traceback.format_exc())
        return None