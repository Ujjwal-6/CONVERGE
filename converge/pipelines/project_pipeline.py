from typing import Optional

from external.create_project import create_project_json
from external.semantic_project import build_semantic_text_project
from external.embed_project import embed_semantic_text_project


def process_project_instance(project) -> Optional[dict]:
    """
    Build PJ → semantic reduce → embed for a Project instance.
    Stores results back on the model.
    Returns a summary dict or None on failure.
    """
    try:
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

        # Semantic reduce
        semantic_text = build_semantic_text_project(pj)

        # Embed
        embedding = embed_semantic_text_project(semantic_text)

        # Persist
        project.metadata = pj
        project.semantic_text = semantic_text
        project.embedding = embedding
        project.save(update_fields=["metadata", "semantic_text", "embedding"])

        return {
            "embedding_dim": len(embedding or []),
        }

    except Exception:
        return None