import hashlib
import numpy as np

# -------- EMBEDDING FUNCTION --------
def embed_semantic_text_project(text: str) -> list:
    """
    Converts semantic text into a deterministic 256-dim embedding vector.
    Uses SHA-256 hash of text to seed RNG for reproducibility.
    """
    h = hashlib.sha256((text or "").encode("utf-8")).digest()
    seed = int.from_bytes(h[:8], byteorder="big", signed=False)
    rng = np.random.default_rng(seed)
    vec = rng.normal(0, 1, 768).astype(np.float32)
    norm = float(np.linalg.norm(vec)) or 1.0
    embedding = (vec / norm).tolist()
    print(f"[embed_project] Generated deterministic embedding (dim={len(embedding)})")
    return embedding

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
