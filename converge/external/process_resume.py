import os
import json
import sys
from ocr1 import extract_text_from_pdf
from parse_resume import parse_resume
from semantic import build_semantic_text
from embed_resume import embed_semantic_text

# -------- CONFIG --------
USER_EMBEDDINGS_FILE = "user_embeddings.json"
RESUME_JSONS_DIR = "resume_jsons"

# -------- HELPER FUNCTION --------
def ensure_resume_jsons_dir():
    """Create resume_jsons directory if it doesn't exist."""
    if not os.path.exists(RESUME_JSONS_DIR):
        os.makedirs(RESUME_JSONS_DIR)
        print(f"📁 Created directory: {RESUME_JSONS_DIR}\n")

def load_user_embeddings():
    """Load existing user embeddings from file, or create empty list."""
    if os.path.exists(USER_EMBEDDINGS_FILE):
        with open(USER_EMBEDDINGS_FILE, "r") as f:
            data = json.load(f)
            print(f"[DEBUG] Loaded {len(data)} existing users from {USER_EMBEDDINGS_FILE}")
            return data
    print(f"[DEBUG] No existing {USER_EMBEDDINGS_FILE} found, starting fresh")
    return []

def save_user_embeddings(embeddings):
    """Save user embeddings to file."""
    with open(USER_EMBEDDINGS_FILE, "w") as f:
        json.dump(embeddings, f, indent=2)
    print(f"[DEBUG] Saved {len(embeddings)} users to {USER_EMBEDDINGS_FILE}")

def find_user_index(user_embeddings, resume_file):
    """Find index of user by resume_file in embeddings list, or return -1 if not found."""
    for idx, record in enumerate(user_embeddings):
        if record.get("resume_file") == resume_file:
            return idx
    return -1

# -------- MAIN PIPELINE --------
def process_resume(pdf_path):
    """
    Complete pipeline: PDF → Text → JSON → Semantic → Embedding → Storage
    
    Args:
        pdf_path: Path to resume PDF file
    
    Returns:
        dict: User record with embeddings
    """
    
    print(f"\n{'='*60}")
    print(f"PROCESSING RESUME: {pdf_path}")
    print(f"{'='*60}\n")
    
    # Step 1: Extract text from PDF
    print("📄 Step 1: Extracting text from PDF...")
    resume_text = extract_text_from_pdf(pdf_path)
    print(f"✅ Text extracted ({len(resume_text)} characters)\n")
    
    # Get PDF filename (without extension) for storage
    pdf_filename = os.path.splitext(os.path.basename(pdf_path))[0]
    
    # Step 2: Parse resume to JSON
    print("🔍 Step 2: Parsing resume to JSON...")
    resume_json = parse_resume(resume_text)
    user_id = resume_json.get("profile", {}).get("user_id", "unknown")
    print(f"✅ Resume parsed for user: {user_id}\n")
    
    # Step 3: Build semantic text
    print("📝 Step 3: Building semantic text...")
    semantic_text = build_semantic_text(resume_json)
    print(f"✅ Semantic text generated ({len(semantic_text)} characters)\n")
    
    # Step 4: Generate embedding
    print("🧠 Step 4: Generating embedding...")
    embedding = embed_semantic_text(semantic_text)
    print(f"✅ Embedding generated (dimension: {len(embedding)})\n")
    
    # Step 5: Save resume JSON to directory (using PDF filename)
    print("💾 Step 5: Saving resume JSON to directory...")
    ensure_resume_jsons_dir()
    resume_json_filename = os.path.join(RESUME_JSONS_DIR, f"{pdf_filename}.json")
    with open(resume_json_filename, "w") as f:
        json.dump(resume_json, f, indent=2)
    print(f"✅ Resume JSON saved to {resume_json_filename}\n")
    
    # Step 6: Update user embeddings file
    print("💾 Step 6: Updating user embeddings storage...")
    user_embeddings = load_user_embeddings()
    
    # Use resume_file as the unique identifier
    # This ensures each PDF gets its own entry, even if user_id is empty or duplicate
    
    # Check if this resume file was already processed
    user_idx = find_user_index(user_embeddings, pdf_filename)
    
    # Generate user_id as user_1, user_2, user_3, etc. for testing
    if user_idx != -1:
        # If updating, use the same user_id
        generated_user_id = user_embeddings[user_idx]["user_id"]
    else:
        # If new, generate next user_id based on total count
        generated_user_id = f"user_{len(user_embeddings) + 1}"
    
    user_record = {
        "user_id": generated_user_id,
        "embedding": embedding,
        "resume_file": pdf_filename
    }
    
    if user_idx != -1:
        # Update existing resume (re-processing the same PDF)
        user_embeddings[user_idx] = user_record
        print(f"✅ Updated existing resume: {pdf_filename} (user_id: {generated_user_id})")
    else:
        # Add new resume
        user_embeddings.append(user_record)
        print(f"✅ Added new resume: {pdf_filename} (user_id: {generated_user_id})")
    
    # Save updated embeddings
    save_user_embeddings(user_embeddings)
    print(f"✅ Embeddings saved to {USER_EMBEDDINGS_FILE}\n")
    
    # Summary
    print(f"{'='*60}")
    print(f"SUMMARY")
    print(f"{'='*60}")
    print(f"Resume File: {pdf_filename}")
    print(f"Generated User ID: {generated_user_id}")
    print(f"Total users in system: {len(user_embeddings)}")
    print(f"Embedding dimension: {len(embedding)}")
    print(f"Resume JSON: {resume_json_filename}")
    print(f"Embeddings File: {USER_EMBEDDINGS_FILE}")
    print(f"{'='*60}\n")
    
    return user_record

# -------- MAIN --------
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("❌ Usage: python process_resume.py <path_to_resume_pdf>")
        print("Example: python process_resume.py RESUME_UJJWALCHORARIA.pdf")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not os.path.exists(pdf_path):
        print(f"❌ File not found: {pdf_path}")
        sys.exit(1)
    
    process_resume(pdf_path)
