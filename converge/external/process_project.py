import os
import json
from create_project import create_project_json, input_project_interactively
from semantic_project import build_semantic_text_project
from embed_project import embed_semantic_text_project

# -------- CONFIG --------
PROJECT_EMBEDDINGS_FILE = "project_embeddings.json"
PROJECT_JSONS_DIR = "project_jsons"

# -------- HELPER FUNCTIONS --------
def ensure_project_jsons_dir():
    """Create project_jsons directory if it doesn't exist."""
    if not os.path.exists(PROJECT_JSONS_DIR):
        os.makedirs(PROJECT_JSONS_DIR)
        print(f"📁 Created directory: {PROJECT_JSONS_DIR}\n")

def load_project_embeddings():
    """Load existing project embeddings from file, or create empty list."""
    if os.path.exists(PROJECT_EMBEDDINGS_FILE):
        with open(PROJECT_EMBEDDINGS_FILE, "r") as f:
            data = json.load(f)
            print(f"[DEBUG] Loaded {len(data)} existing projects from {PROJECT_EMBEDDINGS_FILE}")
            return data
    print(f"[DEBUG] No existing {PROJECT_EMBEDDINGS_FILE} found, starting fresh")
    return []

def save_project_embeddings(embeddings):
    """Save project embeddings to file."""
    with open(PROJECT_EMBEDDINGS_FILE, "w") as f:
        json.dump(embeddings, f, indent=2)
    print(f"[DEBUG] Saved {len(embeddings)} projects to {PROJECT_EMBEDDINGS_FILE}")

def find_project_index(project_embeddings, project_id):
    """Find index of project by project_id in embeddings list, or return -1 if not found."""
    for idx, record in enumerate(project_embeddings):
        if record.get("project_id") == project_id:
            return idx
    return -1

# -------- MAIN PIPELINE --------
def process_project(project_json: dict):
    """
    Complete pipeline: Project Details → JSON → Semantic Text → Embedding → Storage
    
    Args:
        project_json: Project JSON object
    
    Returns:
        dict: Project record with embedding
    """
    
    project_id = project_json.get("project_id", "unknown")
    
    print(f"\n{'='*60}")
    print(f"PROCESSING PROJECT: {project_id}")
    print(f"{'='*60}\n")
    
    # Step 1: Build semantic text
    print("📝 Step 1: Building semantic text...")
    semantic_text = build_semantic_text_project(project_json)
    print(f"✅ Semantic text generated ({len(semantic_text)} characters)\n")
    
    # Step 2: Generate embedding
    print("🧠 Step 2: Generating embedding...")
    embedding = embed_semantic_text_project(semantic_text)
    print(f"✅ Embedding generated (dimension: {len(embedding)})\n")
    
    # Step 3: Save project JSON to directory
    print("💾 Step 3: Saving project JSON to directory...")
    ensure_project_jsons_dir()
    project_json_filename = os.path.join(PROJECT_JSONS_DIR, f"{project_id}.json")
    with open(project_json_filename, "w") as f:
        json.dump(project_json, f, indent=2)
    print(f"✅ Project JSON saved to {project_json_filename}\n")
    
    # Step 4: Update project embeddings file
    print("💾 Step 4: Updating project embeddings storage...")
    project_embeddings = load_project_embeddings()
    
    # Check if project already exists
    proj_idx = find_project_index(project_embeddings, project_id)
    
    project_record = {
        "project_id": project_id,
        "title": project_json.get("title", ""),
        "embedding": embedding
    }
    
    if proj_idx != -1:
        # Update existing project
        project_embeddings[proj_idx] = project_record
        print(f"✅ Updated existing project: {project_id}")
    else:
        # Add new project
        project_embeddings.append(project_record)
        print(f"✅ Added new project: {project_id}")
    
    # Save updated embeddings
    save_project_embeddings(project_embeddings)
    print(f"✅ Embeddings saved to {PROJECT_EMBEDDINGS_FILE}\n")
    
    # Summary
    print(f"{'='*60}")
    print(f"SUMMARY")
    print(f"{'='*60}")
    print(f"Project ID: {project_id}")
    print(f"Project Title: {project_json.get('title', 'N/A')}")
    print(f"Total projects in system: {len(project_embeddings)}")
    print(f"Embedding dimension: {len(embedding)}")
    print(f"Project JSON: {project_json_filename}")
    print(f"Embeddings File: {PROJECT_EMBEDDINGS_FILE}")
    print(f"{'='*60}\n")
    
    return project_record

# -------- MAIN --------
if __name__ == "__main__":
    # Interactive input
    project_json = input_project_interactively()
    
    # Process project
    process_project(project_json)
