import os
import google.generativeai as genai

# -------- CONFIG --------
EMBEDDING_MODEL = "models/text-embedding-004"

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# -------- EMBEDDING FUNCTION --------
def embed_semantic_text_project(text: str) -> list:
    """
    Converts semantic text into a numerical embedding vector.
    Uses the same embedding model as resumes for consistency.
    
    Args:
        text: Semantic text to embed
    
    Returns:
        list: Embedding vector
    """
    response = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=text,
        task_type="retrieval_document"
    )
    return response["embedding"]

# -------- RUNNER --------
if __name__ == "__main__":
    from semantic_project import build_semantic_text_project
    import json
    
    # Example project
    example_project = {
        "project_id": "proj_001",
        "title": "Secure ML-based Intrusion Detection System",
        "description": "Building a real-time intrusion detection system using ML for network security.",
        "required_skills": ["Machine Learning", "Cybersecurity", "Python"],
        "preferred_technologies": ["Scikit-Learn", "TensorFlow", "Linux"],
        "domains": ["Security", "Machine Learning"],
        "project_type": "hackathon",
        "team_size": 4,
        "created_at": "2025-01-01T00:00:00"
    }
    
    # Build semantic text
    semantic_text = build_semantic_text_project(example_project)
    
    # Generate embedding
    embedding = embed_semantic_text_project(semantic_text)
    
    print("✅ Embedding generated")
    print("Vector length:", len(embedding))
    print("First 10 values:", embedding[:10])
