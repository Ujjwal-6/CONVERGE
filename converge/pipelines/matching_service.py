from typing import List, Dict

from external.match_users_to_projects import (
    compute_semantic_similarity,
    semantic_gate,
    score_skill_match,
    score_experience_alignment,
    score_year_compatibility,
    score_reputation,
    score_availability,
    compute_final_score,
)

from projects.models import Project
from resumes.models import Resume


def match_users_for_project(project_id: int, top_n: int = 5) -> List[Dict]:
    """
    Use external matching components with DB data to rank candidates.
    Returns a list of dicts with score breakdowns.
    """
    project = Project.objects.filter(pk=project_id).first()
    if not project or not project.embedding:
        return []

    proj_emb = project.embedding
    proj_json = project.metadata or {}

    results = []

    # Consider all resumes that have embeddings
    for resume in Resume.objects.select_related("profile").all():
        if not resume.embedding:
            continue

        # Phase 1: semantic gate
        passes, sem_score = semantic_gate(proj_emb, resume.embedding)
        if not passes:
            continue

        # Phase 2: composite scoring
        user_json = resume.parsed_json or {}
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

        results.append({
            "user_id": resume.profile.registration_number,
            "name": resume.profile.name or resume.profile.registration_number,
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
    return results[:top_n]