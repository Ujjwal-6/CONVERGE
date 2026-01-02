import json
import numpy as np
import math
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Tuple
from ratings.services import get_global_rating_data

# -------- CONFIG --------

# Semantic relevance thresholds (empirical)
SEMANTIC_THRESHOLDS = {
    "unrelated": 0.30,           # < 0.30
    "meaningful": (0.35, 0.55),  # 0.35 - 0.55
    "strong": 0.55               # > 0.55
}

# Capability and Alignment Score weights
C_WEIGHTS = {
    "semantic": 0.45,
    "skills": 0.35,
    "experience": 0.20
}

# Trust and Execution Score weights
T_WEIGHTS = {
    "rating": 0.55,
    "reliability": 0.45
}

# Reliability calculation constants
COMPLETION_CONFIDENCE_CONSTANT = 3  # t parameter
RELIABILITY_PRIOR = 0.6  # R_o
EPSILON = 1e-6  # Avoid division by zero

# Project type to preferred experience mapping
PROJECT_TYPE_EXPERIENCE = {
    "hackathon": ["beginner", "intermediate"],
    "research": ["intermediate", "advanced"],
    "startup": ["intermediate", "advanced"],
    "open_source": ["beginner", "intermediate"]
}

# Project type to alpha mapping
PROJECT_TYPE_ALPHA = {
    "hackathon": 0.65,
    "research": 0.70,
    "startup": 0.65,
    "open_source": 0.60
}

# Experience level mapping
EXPERIENCE_LEVELS = {
    "beginner": 1,
    "intermediate": 2,
    "advanced": 3
}

# -------- DATA LOADING --------
def load_project_embeddings() -> Dict:
    """Load project embeddings from file."""
    try:
        with open("project_embeddings.json", "r") as f:
            data = json.load(f)
            return {proj["project_id"]: proj for proj in data}
    except FileNotFoundError:
        print("❌ project_embeddings.json not found")
        return {}

def load_user_embeddings() -> Dict:
    """Load user embeddings from file."""
    try:
        with open("user_embeddings.json", "r") as f:
            data = json.load(f)
            return {user["user_id"]: user for user in data}
    except FileNotFoundError:
        print("❌ user_embeddings.json not found")
        return {}

def load_project_json(project_id: str) -> Dict:
    """Load individual project JSON file."""
    try:
        with open(f"project_jsons/{project_id}.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

def load_user_json(resume_file: str) -> Dict:
    """Load individual user JSON file."""
    try:
        with open(f"resume_jsons/{resume_file}.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

# -------- LAYER 1: CAPABILITY AND ALIGNMENT SCORE --------

def compute_semantic_similarity(project_embedding: list, user_embedding: list) -> float:
    """
    Compute cosine similarity between project and user embeddings.
    
    Args:
        project_embedding: Project embedding vector
        user_embedding: User embedding vector
    
    Returns:
        float: Cosine similarity score (0-1)
    """
    proj_vec = np.array(project_embedding).reshape(1, -1)
    user_vec = np.array(user_embedding).reshape(1, -1)
    
    similarity = cosine_similarity(proj_vec, user_vec)[0][0]
    return float(similarity)

def semantic_relevance_filter(
    project_embedding: list,
    user_embedding: list
) -> Tuple[bool, float, str]:
    """
    Apply semantic relevance filter with empirical thresholds.
    
    Interpretation:
    - < 0.30 → unrelated
    - 0.35-0.55 → meaningful alignment
    - > 0.55 → strong match
    
    Args:
        project_embedding: Project embedding vector
        user_embedding: User embedding vector
    
    Returns:
        Tuple[passes_filter, similarity, interpretation]
    """
    similarity = compute_semantic_similarity(project_embedding, user_embedding)
    
    if similarity < SEMANTIC_THRESHOLDS["unrelated"]:
        return False, similarity, "unrelated"
    elif SEMANTIC_THRESHOLDS["meaningful"][0] <= similarity <= SEMANTIC_THRESHOLDS["meaningful"][1]:
        return True, similarity, "meaningful"
    elif similarity > SEMANTIC_THRESHOLDS["strong"]:
        return True, similarity, "strong"
    else:
        # 0.30-0.35: borderline, reject
        return False, similarity, "borderline"

def score_skill_match(
    required_skills: List[str],
    user_skills: Dict[str, list]
) -> float:
    """
    Score skill match with partial credit for related skills.
    
    Formula:
        S_skills = |Required_Skills ∩ User_Skills| / |Required_Skills|
    
    Args:
        required_skills: List of required skills
        user_skills: Dict of user's skills by category
    
    Returns:
        float: Skill match score (0-1)
    """
    if not required_skills:
        return 1.0  # No requirements = perfect match
    
    # Flatten all user skills
    all_user_skills = set()
    for skill_list in user_skills.values():
        if isinstance(skill_list, list):
            all_user_skills.update([s.lower() for s in skill_list])
    
    # Normalize required skills
    required_normalized = set([s.lower() for s in required_skills])
    
    # Compute exact matches
    exact_matches = len(required_normalized & all_user_skills)
    
    # Compute score
    score = exact_matches / len(required_normalized)
    
    return min(1.0, score)

def score_experience_alignment(
    project_type: str,
    user_overall_experience: str
) -> float:
    """
    Score experience alignment based on project type preference.
    
    CRITICAL: Best match = closest experience level, not "more = better"
    
    Args:
        project_type: Type of project
        user_overall_experience: User's overall experience level
    
    Returns:
        float: Experience alignment score (0-1)
    """
    preferred_levels = PROJECT_TYPE_EXPERIENCE.get(project_type, ["intermediate"])
    user_level = user_overall_experience.lower()
    
    # Perfect match if user is in preferred list
    if user_level in preferred_levels:
        return 1.0
    
    # Partial credit if adjacent to preferred
    user_value = EXPERIENCE_LEVELS.get(user_level, 2)
    preferred_values = [EXPERIENCE_LEVELS.get(level, 2) for level in preferred_levels]
    
    # Calculate distance to nearest preferred level
    min_distance = min(abs(user_value - pref) for pref in preferred_values)
    
    if min_distance == 0:
        return 1.0
    elif min_distance == 1:
        return 0.7  # Adjacent level
    else:
        return 0.3  # Far from preferred

def compute_capability_score(
    project_embedding: list,
    user_embedding: list,
    project_type: str,
    required_skills: List[str],
    user_skills: Dict[str, list],
    user_experience: str
) -> Dict:
    """
    LAYER 1: Compute Capability and Alignment Score
    
    Formula:
        C(u,p) = 0.45 * S_semantic + 0.35 * S_skills + 0.20 * S_experience
    
    Args:
        project_embedding: Project embedding
        user_embedding: User embedding
        project_type: Type of project
        required_skills: Required skills for project
        user_skills: User's available skills
        user_experience: User's overall experience level
    
    Returns:
        dict: Capability score components
    """
    # Semantic component
    s_semantic = compute_semantic_similarity(project_embedding, user_embedding)
    
    # Skills component
    s_skills = score_skill_match(required_skills, user_skills)
    
    # Experience component
    s_experience = score_experience_alignment(project_type, user_experience)
    
    # Weighted combination
    capability_score = (
        C_WEIGHTS["semantic"] * s_semantic +
        C_WEIGHTS["skills"] * s_skills +
        C_WEIGHTS["experience"] * s_experience
    )
    
    return {
        "capability_score": round(min(1.0, capability_score), 4),
        "s_semantic": round(s_semantic, 4),
        "s_skills": round(s_skills, 4),
        "s_experience": round(s_experience, 4)
    }

# -------- LAYER 2: TRUST AND EXECUTION SCORE --------

def score_rating(global_rating: float) -> float:
    """
    Convert global rating (1-5 scale) to score (0-1).
    
    Args:
        global_rating: Global rating from rating system (1-5)
    
    Returns:
        float: Rating score (0-1)
    """
    if global_rating == 0:
        return 0.5  # No rating = neutral
    
    # Normalize 1-5 to 0-1
    normalized = (global_rating - 1.0) / 4.0
    return min(1.0, max(0.0, normalized))

def score_reliability(
    completed_projects: int,
    dropped_projects: int,
    availability: str
) -> float:
    """
    Calculate reliability score.
    
    Formula:
        C = P_c / (P_c + P_d + ε)  [completion ratio]
        r_base = 0.7 * C + 0.3 * A
        γ = 1 - e^(-n/t)  [confidence factor]
        S_reliability = γ * r_base + (1-γ) * R_o
    
    Args:
        completed_projects: Number of completed projects
        dropped_projects: Number of dropped/abandoned projects
        availability: Availability level (low, medium, high)
    
    Returns:
        float: Reliability score (0-1)
    """
    # Availability signal
    availability_map = {"low": 0.3, "medium": 0.6, "high": 1.0}
    A = availability_map.get(availability.lower(), 0.6)
    
    # Completion ratio (with epsilon to avoid division by zero)
    C = completed_projects / (completed_projects + dropped_projects + EPSILON)
    
    # Base reliability
    r_base = 0.7 * C + 0.3 * A
    
    # Total projects for confidence
    n = completed_projects + dropped_projects
    
    # Confidence factor (exponential)
    gamma = 1.0 - math.exp(-n / COMPLETION_CONFIDENCE_CONSTANT)
    
    # Final reliability score
    s_reliability = (gamma * r_base) + ((1.0 - gamma) * RELIABILITY_PRIOR)
    
    return round(min(1.0, max(0.0, s_reliability)), 4)

def compute_trust_score(
    global_rating: float,
    completed_projects: int,
    dropped_projects: int,
    availability: str
) -> Dict:
    """
    LAYER 2: Compute Trust and Execution Score
    
    Formula:
        T(u) = 0.55 * S_rating + 0.45 * S_reliability
    
    Args:
        global_rating: User's global rating (1-5, or 3.5 for new users)
        completed_projects: Number of completed projects
        dropped_projects: Number of dropped projects
        availability: Availability level
    
    Returns:
        dict: Trust score with components
    """
    s_rating = score_rating(global_rating)
    s_reliability = score_reliability(completed_projects, dropped_projects, availability)
    
    trust_score = (
        T_WEIGHTS["rating"] * s_rating +
        T_WEIGHTS["reliability"] * s_reliability
    )
    
    return {
        "trust_score": round(min(1.0, trust_score), 4),
        "s_rating": round(s_rating, 4),
        "s_reliability": s_reliability,
        "completion_ratio": round(completed_projects / (completed_projects + dropped_projects + EPSILON), 3)
    }

# -------- FINAL SCORING --------

def compute_final_score(
    capability_score: float,
    trust_score: float,
    project_type: str
) -> Dict:
    """
    Compute final match score with project-type-dependent weighting.
    
    Formula:
        Final_score = α * C(u,p) + (1-α) * T(u)
    
    Where α depends on project type:
    - Hackathon → 0.65
    - Research → 0.70
    
    Args:
        capability_score: Capability and Alignment score
        trust_score: Trust and Execution score
        project_type: Type of project
    
    Returns:
        dict: Final score with metadata
    """
    alpha = PROJECT_TYPE_ALPHA.get(project_type, 0.65)
    
    final_score = (alpha * capability_score) + ((1.0 - alpha) * trust_score)
    
    return {
        "final_score": round(min(1.0, final_score), 4),
        "alpha": alpha,
        "formula": f"{alpha:.2f} × {capability_score:.4f} + {(1-alpha):.2f} × {trust_score:.4f}"
    }

# -------- MAIN MATCHING ENGINE --------

def match_users_to_project(project_id: str, top_n: int = 5) -> List[Dict]:
    """
    Two-layer matching algorithm:
    1. Semantic Relevance Filter (hard gate)
    2. Two-layer Scoring:
       - Capability and Alignment
       - Trust and Execution
    
    Args:
        project_id: Project ID to match users for
        top_n: Number of top matches to return (default: 5)
    
    Returns:
        List[Dict]: Top N ranked matches with full score breakdown
    """
    
    # Load data
    project_embeddings = load_project_embeddings()
    user_embeddings = load_user_embeddings()
    
    if project_id not in project_embeddings:
        print(f"❌ Project {project_id} not found")
        return []
    
    project_data = project_embeddings[project_id]
    project_json = load_project_json(project_id)
    project_embedding = project_data["embedding"]
    project_type = project_json.get("project_type", "hackathon")
    required_skills = project_json.get("required_skills", [])
    
    matches = []
    
    print(f"\n{'='*90}")
    print(f"TWO-LAYER MATCHING ENGINE - ROBUST COLLABORATION MATCHING")
    print(f"{'='*90}")
    print(f"Project: {project_id}")
    print(f"Title: {project_data['title']}")
    print(f"Type: {project_type} | Required Skills: {', '.join(required_skills)}")
    print(f"{'='*90}\n")
    
    # -------- PHASE 1: SEMANTIC RELEVANCE FILTER --------
    print("PHASE 1: SEMANTIC RELEVANCE FILTER")
    print("Thresholds:")
    print(f"  • < 0.30: Unrelated (REJECT)")
    print(f"  • 0.35-0.55: Meaningful alignment (PASS)")
    print(f"  • > 0.55: Strong match (PASS)\n")
    
    phase1_passes = []
    
    for user_id, user_data in user_embeddings.items():
        user_embedding = user_data["embedding"]
        resume_file = user_data.get("resume_file", user_id)
        
        # Apply semantic filter
        passes_filter, similarity, interpretation = semantic_relevance_filter(
            project_embedding, user_embedding
        )
        
        if passes_filter:
            phase1_passes.append({
                "user_id": user_id,
                "resume_file": resume_file,
                "semantic_score": similarity,
                "interpretation": interpretation,
                "user_data": user_data,
                "user_json": load_user_json(resume_file)
            })
            print(f"  ✓ {user_id:<20} {similarity:.4f} ({interpretation})")
        else:
            print(f"  ✗ {user_id:<20} {similarity:.4f} ({interpretation})")
    
    print(f"\nPhase 1 Result: {len(phase1_passes)} / {len(user_embeddings)} users passed\n")
    
    if not phase1_passes:
        print("⚠️  No users passed semantic relevance filter")
        return []
    
    # -------- PHASE 2: TWO-LAYER SCORING --------
    print("PHASE 2: TWO-LAYER SCORING")
    print("Layer 1: Capability & Alignment | Layer 2: Trust & Execution\n")
    
    for candidate in phase1_passes:
        user_id = candidate["user_id"]
        resume_file = candidate["resume_file"]
        user_json = candidate["user_json"]
        
        # Extract user data
        profile = user_json.get("profile", {})
        skills = user_json.get("skills", {})
        experience = user_json.get("experience_level", {})
        reputation = user_json.get("reputation_signals", {})
        
        # -------- LAYER 1: CAPABILITY AND ALIGNMENT --------
        capability_data = compute_capability_score(
            project_embedding,
            candidate["user_data"]["embedding"],
            project_type,
            required_skills,
            skills,
            experience.get("overall", "beginner")
        )
        
        # -------- LAYER 2: TRUST AND EXECUTION --------
        # Get user's global rating from rating system
        global_rating_data = get_global_rating_data(user_id)
        global_rating = global_rating_data["global_rating"]
        
        # Reliability: estimate from reputation signals
        completed_projects = reputation.get("completed_projects", 0)
        dropped_projects = 0  # Would come from project history
        availability = profile.get("availability", "medium")
        
        trust_data = compute_trust_score(
            global_rating,
            completed_projects,
            dropped_projects,
            availability
        )
        
        # -------- FINAL SCORE --------
        final_score_data = compute_final_score(
            capability_data["capability_score"],
            trust_data["trust_score"],
            project_type
        )
        
        match_record = {
            "user_id": user_id,
            "resume_file": resume_file,
            "final_score": final_score_data["final_score"],
            "profile": {
                "name": profile.get("name", "Unknown"),
                "year": profile.get("year", "Unknown"),
                "availability": availability
            },
            "layer1_capability": capability_data,
            "layer2_trust": trust_data,
            "scoring_formula": final_score_data
        }
        
        matches.append(match_record)
    
    # Sort by final score
    matches.sort(key=lambda x: x["final_score"], reverse=True)
    
    return matches[:top_n]

# -------- MAIN --------
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("❌ Usage: python match_users_to_projects.py <project_id> [top_n]")
        print("Example: python match_users_to_projects.py proj_694740e0 10")
        sys.exit(1)
    
    project_id = sys.argv[1]
    top_n = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    
    # Run matching algorithm
    matches = match_users_to_project(project_id, top_n=top_n)
    
    print(f"\n✅ Found {len(matches)} matches for project {project_id}")
    for idx, match in enumerate(matches, 1):
        print(f"  {idx}. {match['user_id']}: {match['final_score']:.4f}")