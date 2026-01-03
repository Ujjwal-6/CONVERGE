from google.genai import Client

# Configure Google Generative AI
EMBEDDING_MODEL = "models/text-embedding-004"
api_key = "AIzaSyC0nHXbPGaoimgSSx8kfFrxZl30AEwxEMU"  # Testing only
client = Client(api_key=api_key)

# -------- EMBEDDING FUNCTION --------
def embed_semantic_text_project(text: str) -> list:
    """
    Converts semantic text into a 768-dim embedding vector using Google's embedding model.
    """
    if not text:
        return [0.0] * 768
    
    try:
        result = client.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=text,
        )
        # Extract embedding: result.embeddings is a list of ContentEmbedding objects
        # Each ContentEmbedding has a 'values' attribute with the vector
        if hasattr(result, 'embeddings') and result.embeddings:
            embedding = list(result.embeddings[0].values)
        else:
            raise ValueError(f"Unexpected response structure: {result}")
        
        print(f"[embed_project] Generated Google embedding (dim={len(embedding)})")
        return embedding
    except Exception as e:
        print(f"[embed_project] ❌ Error generating embedding: {str(e)}")
        raise

# -------- RUNNER --------
if __name__ == "__main__":
    from external.semantic_project import build_semantic_text_project
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
