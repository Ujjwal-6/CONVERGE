import os
import json
import uuid
from datetime import datetime

# -------- CONFIG --------
PROJECT_SCHEMA = {
    "project_id": "",
    "title": "",
    "description": "",
    "required_skills": [],
    "preferred_technologies": [],
    "domains": [],
    "project_type": "hackathon | research | startup | open_source",
    "team_size": 0,
    "created_at": ""
}

# -------- PROJECT CREATOR --------
def create_project_json(
    title: str,
    description: str,
    required_skills: list,
    preferred_technologies: list,
    domains: list,
    project_type: str,
    team_size: int,
    project_id: str = None
) -> dict:
    """
    Creates a project JSON object with all required fields.
    
    Args:
        title: Project title
        description: Project description
        required_skills: List of required skills
        preferred_technologies: List of preferred technologies
        domains: List of project domains
        project_type: Type of project (hackathon, research, startup, open_source)
        team_size: Desired team size
        project_id: Optional project ID (auto-generated if not provided)
    
    Returns:
        dict: Structured project JSON
    """
    
    if not project_id:
        project_id = f"proj_{uuid.uuid4().hex[:8]}"
    
    project_json = {
        "project_id": project_id,
        "title": title,
        "description": description,
        "required_skills": required_skills,
        "preferred_technologies": preferred_technologies,
        "domains": domains,
        "project_type": project_type,
        "team_size": team_size,
        "created_at": datetime.now().isoformat()
    }
    
    return project_json

# -------- INTERACTIVE INPUT --------
def input_project_interactively() -> dict:
    """
    Interactively collect project details from user input.
    
    Returns:
        dict: Project JSON object
    """
    
    print("\n" + "="*60)
    print("PROJECT POSTING FORM")
    print("="*60 + "\n")
    
    # Get title
    title = input("📌 Project Title: ").strip()
    
    # Get description
    print("\n📝 Project Description (end with blank line):")
    description_lines = []
    while True:
        line = input()
        if not line:
            break
        description_lines.append(line)
    description = "\n".join(description_lines)
    
    # Get required skills
    print("\n🎯 Required Skills (comma-separated):")
    required_skills_input = input("Skills: ").strip()
    required_skills = [s.strip() for s in required_skills_input.split(",") if s.strip()]
    
    # Get preferred technologies
    print("\n💻 Preferred Technologies (comma-separated):")
    tech_input = input("Technologies: ").strip()
    preferred_technologies = [t.strip() for t in tech_input.split(",") if t.strip()]
    
    # Get domains
    print("\n🌐 Domains (comma-separated):")
    domains_input = input("Domains: ").strip()
    domains = [d.strip() for d in domains_input.split(",") if d.strip()]
    
    # Get project type
    print("\n📂 Project Type:")
    print("  1. hackathon")
    print("  2. research")
    print("  3. startup")
    print("  4. open_source")
    type_choice = input("Select (1-4): ").strip()
    type_map = {
        "1": "hackathon",
        "2": "research",
        "3": "startup",
        "4": "open_source"
    }
    project_type = type_map.get(type_choice, "hackathon")
    
    # Get team size
    print("\n👥 Desired Team Size:")
    team_size = int(input("Team Size: ").strip())
    
    # Create JSON
    project_json = create_project_json(
        title=title,
        description=description,
        required_skills=required_skills,
        preferred_technologies=preferred_technologies,
        domains=domains,
        project_type=project_type,
        team_size=team_size
    )
    
    return project_json

# -------- MAIN --------
if __name__ == "__main__":
    project_json = input_project_interactively()
    
    print("\n" + "="*60)
    print("PROJECT JSON CREATED")
    print("="*60 + "\n")
    print(json.dumps(project_json, indent=2))
