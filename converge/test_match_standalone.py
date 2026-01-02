#!/usr/bin/env python3
"""
Standalone test script for matching logic without Django.
Run with sample resume and project JSONs to check similarity scores.
"""
import os
import sys
import django

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'converge.settings')
django.setup()

import json
import numpy as np
from external.semantic import build_semantic_text
from external.embed_resume import embed_semantic_text
from external.semantic_project import build_semantic_text_project
from external.embed_project import embed_semantic_text_project
from external.match_users_to_projects import (
    semantic_relevance_filter,
    compute_capability_score,
    compute_trust_score,
    compute_final_score,
    PROJECT_TYPE_ALPHA,
)

def test_matching(project_json_path, resume_json_paths):
    """
    Load project and resume JSONs, generate embeddings, and run matching.
    
    Args:
        project_json_path: Path to project JSON file
        resume_json_paths: List of paths to resume JSON files
    """
    
    # Load project JSON
    print(f"\n{'='*70}")
    print("LOADING PROJECT DATA")
    print(f"{'='*70}")
    
    with open(project_json_path) as f:
        project_data = json.load(f)
    
    print(f"✓ Project loaded: {project_data.get('title', 'Unknown')}")
    
    # Generate project embedding
    proj_semantic = build_semantic_text_project(project_data)
    proj_embedding = embed_semantic_text_project(proj_semantic)
    print(f"✓ Project embedding generated ({len(proj_embedding)} dimensions)")
    
    project_type = project_data.get("project_type", "hackathon")
    required_skills = project_data.get("required_skills", [])
    print(f"  Type: {project_type}")
    print(f"  Required skills: {required_skills}")
    
    # Load resumes
    print(f"\n{'='*70}")
    print("LOADING RESUME DATA")
    print(f"{'='*70}")
    
    resumes = []
    for resume_path in resume_json_paths:
        with open(resume_path) as f:
            resume_data = json.load(f)
        
        # Extract resume_id if present
        resume_id = resume_data.get("resume_id", resume_path.split('/')[-1].split('.')[0])
        
        # Generate resume embedding
        resume_semantic = build_semantic_text(resume_data)
        resume_embedding = embed_semantic_text(resume_semantic)
        
        resumes.append({
            "resume_id": resume_id,
            "data": resume_data,
            "embedding": resume_embedding,
        })
        
        name = resume_data.get("profile", {}).get("name", "Unknown")
        print(f"✓ Resume loaded: {name} (ID: {resume_id})")
        print(f"  Embedding generated ({len(resume_embedding)} dimensions)")
    
    # Run matching
    print(f"\n{'='*70}")
    print("PHASE 1: SEMANTIC RELEVANCE FILTER")
    print(f"{'='*70}\n")
    
    matches = []
    
    for resume in resumes:
        resume_id = resume["resume_id"]
        resume_emb = resume["embedding"]
        resume_data = resume["data"]
        
        # Check semantic similarity
        passes, sim_score, interpretation = semantic_relevance_filter(
            proj_embedding, resume_emb
        )
        
        status = "✓ PASS" if passes else "✗ FAIL"
        print(f"{status} | {resume_id:<15} | Semantic: {sim_score:.4f} ({interpretation})")
        
        if not passes:
            continue
        
        # Extract data for capability and trust scoring
        profile = resume_data.get("profile", {})
        skills = resume_data.get("skills", {})
        experience = resume_data.get("experience_level", {})
        reputation = resume_data.get("reputation_signals", {})
        
        # Layer 1: Capability and Alignment
        print(f"\n  → Computing capability score for {resume_id}...")
        capability_data = compute_capability_score(
            proj_embedding,
            resume_emb,
            project_type,
            required_skills,
            skills,
            experience.get("overall", "beginner")
        )
        print(f"    Capability: {capability_data['capability_score']:.4f}")
        print(f"      - Semantic:   {capability_data['s_semantic']:.4f}")
        print(f"      - Skills:     {capability_data['s_skills']:.4f}")
        print(f"      - Experience: {capability_data['s_experience']:.4f}")
        
        # Layer 2: Trust and Execution
        print(f"  → Computing trust score for {resume_id}...")
        global_rating = reputation.get("average_rating", 3.5)
        completed_projects = reputation.get("completed_projects", 0)
        dropped_projects = 0
        availability = profile.get("availability", "medium")
        
        trust_data = compute_trust_score(
            global_rating,
            completed_projects,
            dropped_projects,
            availability
        )
        print(f"    Trust: {trust_data['trust_score']:.4f}")
        print(f"      - Rating:     {trust_data['s_rating']:.4f} (global: {global_rating:.1f}/5)")
        print(f"      - Reliability: {trust_data['s_reliability']:.4f}")
        
        # Final score
        final_score_data = compute_final_score(
            capability_data["capability_score"],
            trust_data["trust_score"],
            project_type
        )
        
        print(f"  → Final score: {final_score_data['final_score']:.4f}")
        print(f"    Formula: {final_score_data['formula']}\n")
        
        matches.append({
            "resume_id": resume_id,
            "name": profile.get("name", "Unknown"),
            "final_score": final_score_data["final_score"],
            "capability_score": capability_data["capability_score"],
            "trust_score": trust_data["trust_score"],
            "semantic_score": sim_score,
        })
    
    # Sort and display results
    print(f"{'='*70}")
    print("RESULTS")
    print(f"{'='*70}\n")
    
    if not matches:
        print("❌ No matches found.")
        return
    
    matches.sort(key=lambda m: m["final_score"], reverse=True)
    
    print(f"{'Rank':<6} {'Resume ID':<15} {'Name':<20} {'Final':<8} {'Capability':<12} {'Trust':<8} {'Semantic':<10}")
    print("-" * 90)
    
    for idx, match in enumerate(matches, 1):
        print(f"{idx:<6} {str(match['resume_id']):<15} {match['name']:<20} {match['final_score']:<8.4f} {match['capability_score']:<12.4f} {match['trust_score']:<8.4f} {match['semantic_score']:<10.4f}")
    
    print(f"\n✅ Found {len(matches)} matching resumes")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python test_match_standalone.py <project_json> <resume_json1> [resume_json2] ...")
        print("Example: python test_match_standalone.py project.json resume1.json resume2.json")
        sys.exit(1)
    
    project_json = sys.argv[1]
    resume_jsons = sys.argv[2:]
    
    test_matching(project_json, resume_jsons)
