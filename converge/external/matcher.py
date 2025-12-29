import numpy as np
from typing import List, Dict
from sklearn.metrics.pairwise import cosine_similarity


# -----------------------------
# Utility functions
# -----------------------------

def cosine_sim(vec1, vec2) -> float:
    return cosine_similarity(
        np.array(vec1).reshape(1, -1),
        np.array(vec2).reshape(1, -1)
    )[0][0]


def normalize(value, min_val=0.0, max_val=1.0):
    return max(min_val, min(max_val, value))


# -----------------------------
# Individual scoring components
# -----------------------------

def skill_match_score(project_skills: List[str], user_skills: List[str]) -> float:
    if not project_skills:
        return 1.0
    intersection = set(project_skills).intersection(set(user_skills))
    return len(intersection) / len(project_skills)


def experience_alignment_score(user_level: str, project_type: str) -> float:
    mapping = {
        "beginner": 0.6,
        "intermediate": 1.0,
        "advanced": 0.9
    }
    base = mapping.get(user_level, 0.6)

    if project_type == "research" and user_level == "beginner":
        return 0.4
    return base


def year_compatibility_score(user_year: int, preferred_year: int = None) -> float:
    if preferred_year is None:
        return 1.0
    diff = abs(user_year - preferred_year)
    return normalize(1 - 0.25 * diff)


def reputation_score(avg_rating: float, completed_projects: int) -> float:
    if completed_projects == 0:
        return 0.5
    confidence = min(1.0, completed_projects / 5)
    return normalize((avg_rating / 5) * confidence)


def availability_score(availability: str) -> float:
    mapping = {
        "high": 1.0,
        "medium": 0.7,
        "low": 0.4
    }
    return mapping.get(availability.lower(), 0.7)


# -----------------------------
# Main matching function
# -----------------------------

def match_users_to_project(
    project_json: Dict,
    project_embedding: List[float],
    users: List[Dict],
    semantic_threshold: float = 0.35,
    top_k: int = 5
) -> List[Dict]:

    results = []

    project_skills = project_json["requirements"].get("required_skills", [])
    project_type = project_json["metadata"].get("project_type", "hackathon")

    for user in users:
        user_embedding = user["embedding"]

        # ---- Phase 1: Semantic gate ----
        semantic_score = cosine_sim(project_embedding, user_embedding)

        if semantic_score < semantic_threshold:
            continue  # DISCARD USER

        # ---- Phase 2: Structured scoring ----
        user_skills = (
            user["skills"]["programming_languages"]
            + user["skills"]["frameworks_libraries"]
            + user["skills"]["domain_skills"]
        )

        skill_score = skill_match_score(project_skills, user_skills)

        experience_score = experience_alignment_score(
            user["experience_level"]["overall"],
            project_type
        )

        year_score = year_compatibility_score(
            int(user["profile"].get("year", 0))
        )

        reputation = reputation_score(
            user["reputation_signals"]["average_rating"],
            user["reputation_signals"]["completed_projects"]
        )

        availability = availability_score(
            user["profile"].get("availability", "medium")
        )

        # ---- Final weighted score ----
        final_score = (
            0.50 * semantic_score +
            0.18 * skill_score +
            0.12 * experience_score +
            0.08 * year_score +
            0.07 * reputation +
            0.05 * availability
        )

        results.append({
            "user_id": user["profile"]["user_id"],
            "name": user["profile"]["name"],
            "final_score": round(final_score, 4),
            "semantic_score": round(semantic_score, 4),
            "skill_score": round(skill_score, 4),
            "experience_score": round(experience_score, 4)
        })

    # Sort and return top K
    results.sort(key=lambda x: x["final_score"], reverse=True)
    return results[:top_k]
