import json
import os
from typing import Dict, List, Tuple
from datetime import datetime

# -------- CONFIG --------
RATING_CATEGORIES = {
    "technical": {
        "name": "Technical Contribution",
        "weight": 0.30,
        "questions": [
            "This teammate made meaningful technical contributions to the project.",
            "The quality of this teammate's work met or exceeded project expectations."
        ]
    },
    "reliability": {
        "name": "Reliability and Execution",
        "weight": 0.25,
        "questions": [
            "This teammate consistently met deadlines and commitments.",
            "This teammate followed through on assigned responsibilities without repeated reminders."
        ]
    },
    "communication": {
        "name": "Communication and Teamwork",
        "weight": 0.20,
        "questions": [
            "This teammate communicated clearly and responded in a timely manner.",
            "This teammate was respectful, cooperative, and supportive of the team."
        ]
    },
    "initiative": {
        "name": "Ownership and Initiative",
        "weight": 0.15,
        "questions": [
            "This teammate took initiative beyond their assigned tasks when needed."
        ]
    },
    "overall": {
        "name": "Overall Collaboration Quality",
        "weight": 0.10,
        "questions": [
            "I would be happy to collaborate with this teammate again on a future project."
        ]
    }
}

# Global rating constants
GLOBAL_PRIOR_MEAN = 3.5
CONFIDENCE_CONSTANT = 5

# Storage files
RATINGS_FILE = "ratings_data.json"
RATER_RELIABILITY_FILE = "rater_reliability.json"

# -------- DATA STRUCTURES --------
def initialize_ratings_data():
    """Initialize or load ratings data structure."""
    if os.path.exists(RATINGS_FILE):
        with open(RATINGS_FILE, "r") as f:
            return json.load(f)
    
    return {
        "ratings": []  # List of rating records
    }

def initialize_rater_reliability():
    """Initialize or load rater reliability coefficients."""
    if os.path.exists(RATER_RELIABILITY_FILE):
        with open(RATER_RELIABILITY_FILE, "r") as f:
            return json.load(f)
    
    return {
        "raters": {}  # {rater_id: {"alpha": 1.0, "ratings_count": 0}}
    }

# -------- RATER RELIABILITY MANAGEMENT --------
def get_rater_reliability(rater_id: str, reliability_data: Dict = None) -> float:
    """
    Get rater reliability coefficient (alpha).
    
    Args:
        rater_id: ID of the rater
        reliability_data: Rater reliability data structure
    
    Returns:
        float: Rater reliability coefficient (default: 1.0)
    """
    if reliability_data is None:
        reliability_data = initialize_rater_reliability()
    
    if rater_id not in reliability_data["raters"]:
        # New rater - initialize with alpha = 1.0
        reliability_data["raters"][rater_id] = {
            "alpha": 1.0,
            "ratings_count": 0,
            "created_at": datetime.now().isoformat()
        }
        save_rater_reliability(reliability_data)
    
    return reliability_data["raters"][rater_id].get("alpha", 1.0)

def update_rater_reliability(rater_id: str, new_alpha: float, reliability_data: Dict = None):
    """
    Update rater reliability coefficient.
    
    Args:
        rater_id: ID of the rater
        new_alpha: New alpha value (should be in [0.7, 1.0])
        reliability_data: Rater reliability data structure
    """
    if reliability_data is None:
        reliability_data = initialize_rater_reliability()
    
    # Clamp alpha to [0.7, 1.0]
    new_alpha = max(0.7, min(1.0, new_alpha))
    
    if rater_id not in reliability_data["raters"]:
        reliability_data["raters"][rater_id] = {
            "alpha": 1.0,
            "ratings_count": 0,
            "created_at": datetime.now().isoformat()
        }
    
    reliability_data["raters"][rater_id]["alpha"] = new_alpha
    reliability_data["raters"][rater_id]["ratings_count"] += 1
    
    save_rater_reliability(reliability_data)

# -------- RATING CALCULATION --------
def calculate_raw_rating(ratings_dict: Dict[str, float]) -> float:
    """
    Calculate raw rating from category scores.
    
    Formula:
        R_raw = sum(w_i * r_i) for all categories
    
    Args:
        ratings_dict: Dict with category scores {category: score (1-5)}
    
    Returns:
        float: Weighted raw rating (1-5 scale)
    """
    raw_rating = 0.0
    
    for category, score in ratings_dict.items():
        if category in RATING_CATEGORIES:
            weight = RATING_CATEGORIES[category]["weight"]
            raw_rating += weight * score
    
    return round(raw_rating, 3)

def calculate_adjusted_rating(
    raw_rating: float,
    rater_id: str,
    reliability_data: Dict = None
) -> float:
    """
    Adjust raw rating by rater reliability coefficient.
    
    Formula:
        R_adj = α_j * R_raw
    
    Args:
        raw_rating: Raw rating from categories
        rater_id: ID of the rater
        reliability_data: Rater reliability data
    
    Returns:
        float: Adjusted rating (1-5 scale)
    """
    if reliability_data is None:
        reliability_data = initialize_rater_reliability()
    
    alpha = get_rater_reliability(rater_id, reliability_data)
    adjusted_rating = alpha * raw_rating
    
    return round(adjusted_rating, 3)

# -------- RATING SUBMISSION --------
def submit_rating(
    rater_id: str,
    ratee_id: str,
    project_id: str,
    category_scores: Dict[str, float],
    ratings_data: Dict = None,
    reliability_data: Dict = None
) -> Dict:
    """
    Submit a rating from one teammate to another.
    
    Args:
        rater_id: ID of the person giving the rating
        ratee_id: ID of the person being rated
        project_id: ID of the project
        category_scores: Dict with scores for each category {category: 1-5}
        ratings_data: Ratings data structure
        reliability_data: Rater reliability data
    
    Returns:
        dict: Rating record
    """
    if ratings_data is None:
        ratings_data = initialize_ratings_data()
    if reliability_data is None:
        reliability_data = initialize_rater_reliability()
    
    # Validate scores
    for category, score in category_scores.items():
        if category not in RATING_CATEGORIES:
            raise ValueError(f"Invalid category: {category}")
        if not (1 <= score <= 5):
            raise ValueError(f"Score must be 1-5, got {score}")
    
    # Calculate raw rating
    raw_rating = calculate_raw_rating(category_scores)
    
    # Get rater reliability coefficient
    alpha = get_rater_reliability(rater_id, reliability_data)
    
    # Calculate adjusted rating
    adjusted_rating = calculate_adjusted_rating(raw_rating, rater_id, reliability_data)
    
    # Create rating record
    rating_record = {
        "rating_id": f"{rater_id}_{ratee_id}_{project_id}_{len(ratings_data['ratings'])}",
        "rater_id": rater_id,
        "ratee_id": ratee_id,
        "project_id": project_id,
        "category_scores": category_scores,
        "raw_rating": raw_rating,
        "rater_alpha": alpha,
        "adjusted_rating": adjusted_rating,
        "created_at": datetime.now().isoformat()
    }
    
    # Store rating
    ratings_data["ratings"].append(rating_record)
    save_ratings_data(ratings_data)
    
    return rating_record

# -------- PROJECT LEVEL AGGREGATION --------
def calculate_project_rating(
    ratee_id: str,
    project_id: str,
    ratings_data: Dict = None
) -> Tuple[float, int]:
    """
    Calculate user's rating for a specific project (average of adjusted ratings).
    
    Formula:
        R_project = (1/M) * sum(R_adj_i) for all raters
    
    Args:
        ratee_id: ID of user being rated
        project_id: ID of project
        ratings_data: Ratings data structure
    
    Returns:
        Tuple[rating, count]: Project rating and number of raters
    """
    if ratings_data is None:
        ratings_data = initialize_ratings_data()
    
    project_ratings = [
        record["adjusted_rating"]
        for record in ratings_data["ratings"]
        if record["ratee_id"] == ratee_id and record["project_id"] == project_id
    ]
    
    if not project_ratings:
        return None, 0
    
    avg_rating = sum(project_ratings) / len(project_ratings)
    
    return round(avg_rating, 3), len(project_ratings)

# -------- GLOBAL USER RATING AGGREGATION --------
def calculate_global_rating(
    ratee_id: str,
    ratings_data: Dict = None
) -> Dict:
    """
    Calculate user's global rating across all projects (Bayesian prior adjustment).
    
    Formula:
        R_GLOBAL = (C * μ + sum(R_project_i)) / (C + P)
    
    Where:
        - μ = GLOBAL_PRIOR_MEAN (3.5)
        - C = CONFIDENCE_CONSTANT (5)
        - P = number of completed projects
    
    Args:
        ratee_id: ID of user
        ratings_data: Ratings data structure
    
    Returns:
        dict: Aggregated rating with metadata
    """
    if ratings_data is None:
        ratings_data = initialize_ratings_data()
    
    # Get all projects for this user
    projects = set()
    for record in ratings_data["ratings"]:
        if record["ratee_id"] == ratee_id:
            projects.add(record["project_id"])
    
    if not projects:
        # No ratings yet - new user gets prior mean
        return {
            "global_rating": GLOBAL_PRIOR_MEAN,
            "projects_completed": 0,
            "total_ratings": 0,
            "methodology": "Bayesian prior (new user)",
            "formula_parts": {
                "prior_contribution": CONFIDENCE_CONSTANT * GLOBAL_PRIOR_MEAN,
                "ratings_sum": 0,
                "denominator": CONFIDENCE_CONSTANT
            }
        }
    
    # Calculate rating for each project
    project_ratings_sum = 0.0
    for project_id in projects:
        project_rating, _ = calculate_project_rating(ratee_id, project_id, ratings_data)
        if project_rating is not None:
            project_ratings_sum += project_rating
    
    # Get total number of ratings
    total_ratings = sum(
        1 for record in ratings_data["ratings"]
        if record["ratee_id"] == ratee_id
    )
    
    # Apply Bayesian formula
    P = len(projects)  # Number of completed projects
    numerator = (CONFIDENCE_CONSTANT * GLOBAL_PRIOR_MEAN) + project_ratings_sum
    denominator = CONFIDENCE_CONSTANT + P
    
    global_rating = numerator / denominator
    
    return {
        "global_rating": round(global_rating, 3),
        "projects_completed": P,
        "total_ratings": total_ratings,
        "methodology": "Bayesian prior adjustment",
        "formula_parts": {
            "prior_mean": GLOBAL_PRIOR_MEAN,
            "confidence_constant": CONFIDENCE_CONSTANT,
            "prior_contribution": round(CONFIDENCE_CONSTANT * GLOBAL_PRIOR_MEAN, 3),
            "ratings_sum": round(project_ratings_sum, 3),
            "denominator": denominator
        }
    }

# -------- RATING HISTORY & ANALYSIS --------
def get_user_ratings_summary(ratee_id: str, ratings_data: Dict = None) -> Dict:
    """
    Get comprehensive rating summary for a user.
    
    Args:
        ratee_id: ID of user
        ratings_data: Ratings data structure
    
    Returns:
        dict: Complete rating summary
    """
    if ratings_data is None:
        ratings_data = initialize_ratings_data()
    
    # Get all ratings for this user
    user_ratings = [
        record for record in ratings_data["ratings"]
        if record["ratee_id"] == ratee_id
    ]
    
    if not user_ratings:
        return {
            "user_id": ratee_id,
            "total_ratings": 0,
            "projects": [],
            "global_rating": calculate_global_rating(ratee_id, ratings_data)
        }
    
    # Group by project
    projects = {}
    for rating in user_ratings:
        proj_id = rating["project_id"]
        if proj_id not in projects:
            projects[proj_id] = []
        projects[proj_id].append(rating)
    
    # Calculate per-category averages
    category_averages = {cat: [] for cat in RATING_CATEGORIES.keys()}
    for rating in user_ratings:
        for cat, score in rating["category_scores"].items():
            category_averages[cat].append(score)
    
    category_stats = {}
    for cat, scores in category_averages.items():
        if scores:
            category_stats[cat] = {
                "average": round(sum(scores) / len(scores), 3),
                "count": len(scores),
                "min": min(scores),
                "max": max(scores)
            }
    
    # Calculate project summaries
    project_summaries = {}
    for proj_id, proj_ratings in projects.items():
        proj_rating, count = calculate_project_rating(ratee_id, proj_id, ratings_data)
        project_summaries[proj_id] = {
            "rating": proj_rating,
            "raters": count,
            "raters_detail": [
                {
                    "rater_id": r["rater_id"],
                    "adjusted_rating": r["adjusted_rating"],
                    "rater_alpha": r["rater_alpha"]
                }
                for r in proj_ratings
            ]
        }
    
    return {
        "user_id": ratee_id,
        "total_ratings": len(user_ratings),
        "category_stats": category_stats,
        "projects": project_summaries,
        "global_rating": calculate_global_rating(ratee_id, ratings_data)
    }

# -------- PERSISTENCE --------
def save_ratings_data(ratings_data: Dict):
    """Save ratings data to file."""
    with open(RATINGS_FILE, "w") as f:
        json.dump(ratings_data, f, indent=2)
    print(f"✅ Ratings data saved to {RATINGS_FILE}")

def save_rater_reliability(reliability_data: Dict):
    """Save rater reliability data to file."""
    with open(RATER_RELIABILITY_FILE, "w") as f:
        json.dump(reliability_data, f, indent=2)
    print(f"✅ Rater reliability data saved to {RATER_RELIABILITY_FILE}")

# -------- DISPLAY FUNCTIONS --------
def display_rating_record(record: Dict):
    """Display a single rating record in human-readable format."""
    print(f"\n{'='*70}")
    print(f"RATING RECORD: {record['rating_id']}")
    print(f"{'='*70}")
    print(f"Rater: {record['rater_id']}")
    print(f"Ratee: {record['ratee_id']}")
    print(f"Project: {record['project_id']}")
    print(f"Submitted: {record['created_at']}")
    print(f"\nCategory Scores:")
    for cat, score in record['category_scores'].items():
        print(f"  {RATING_CATEGORIES[cat]['name']}: {score}/5")
    print(f"\nRaw Rating: {record['raw_rating']}")
    print(f"Rater Alpha (α): {record['rater_alpha']:.3f}")
    print(f"Adjusted Rating: {record['adjusted_rating']}")
    print(f"{'='*70}\n")

def display_user_summary(summary: Dict):
    """Display user rating summary in human-readable format."""
    print(f"\n{'='*70}")
    print(f"USER RATING SUMMARY: {summary['user_id']}")
    print(f"{'='*70}")
    print(f"Total Ratings Received: {summary['total_ratings']}")
    
    if summary['category_stats']:
        print(f"\nCategory Performance:")
        for cat, stats in summary['category_stats'].items():
            print(f"  {RATING_CATEGORIES[cat]['name']}:")
            print(f"    Average: {stats['average']:.3f} (min: {stats['min']}, max: {stats['max']})")
    
    if summary['projects']:
        print(f"\nProject Ratings:")
        for proj_id, proj_data in summary['projects'].items():
            print(f"  {proj_id}: {proj_data['rating']} (from {proj_data['raters']} raters)")
    
    global_data = summary['global_rating']
    print(f"\nGlobal Rating: {global_data['global_rating']}")
    print(f"Projects Completed: {global_data['projects_completed']}")
    print(f"Formula: ({CONFIDENCE_CONSTANT} × {GLOBAL_PRIOR_MEAN} + {global_data['formula_parts']['ratings_sum']}) / {global_data['formula_parts']['denominator']} = {global_data['global_rating']}")
    print(f"{'='*70}\n")

# -------- MAIN --------
if __name__ == "__main__":
    print("Rating System - Example Usage\n")
    
    # Initialize
    ratings_data = initialize_ratings_data()
    reliability_data = initialize_rater_reliability()
    
    # Example: Submit some ratings
    print("Submitting example ratings...\n")
    
    # Rating 1: Alice rates Bob
    rating1 = submit_rating(
        rater_id="alice_user",
        ratee_id="bob_user",
        project_id="proj_001",
        category_scores={
            "technical": 5,
            "reliability": 4,
            "communication": 5,
            "initiative": 4,
            "overall": 5
        },
        ratings_data=ratings_data,
        reliability_data=reliability_data
    )
    display_rating_record(rating1)
    
    # Rating 2: Carol rates Bob
    rating2 = submit_rating(
        rater_id="carol_user",
        ratee_id="bob_user",
        project_id="proj_001",
        category_scores={
            "technical": 4,
            "reliability": 3,
            "communication": 4,
            "initiative": 3,
            "overall": 4
        },
        ratings_data=ratings_data,
        reliability_data=reliability_data
    )
    display_rating_record(rating2)
    
    # Get Bob's summary
    summary = get_user_ratings_summary("bob_user", ratings_data)
    display_user_summary(summary)
    
    # Test new user (no ratings)
    print("\nNew User (No Ratings Yet):")
    new_user_global = calculate_global_rating("new_user_xyz", ratings_data)
    print(f"Global Rating: {new_user_global['global_rating']} (Bayesian prior for new users)")