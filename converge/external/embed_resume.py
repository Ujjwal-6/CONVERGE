import hashlib
import numpy as np
from external.semantic import build_semantic_text

# ---------------- EMBEDDING FUNCTION ----------------
def embed_semantic_text(text: str) -> list:
    """
    Converts semantic text into a deterministic 256-dim embedding vector.
    Uses SHA-256 hash of text to seed RNG for reproducibility.
    """
    # Deterministic local embedding: hash text -> RNG seed -> normalized vector
    h = hashlib.sha256((text or "").encode("utf-8")).digest()
    seed = int.from_bytes(h[:8], byteorder="big", signed=False)
    rng = np.random.default_rng(seed)
    vec = rng.normal(0, 1, 768).astype(np.float32)
    norm = float(np.linalg.norm(vec)) or 1.0
    embedding = (vec / norm).tolist()
    print(f"[embed_resume] Generated deterministic embedding (dim={len(embedding)})")
    return embedding

# ---------------- RUNNER ----------------
if __name__ == "__main__":
    import json

    # Load resume JSON
    with open("resume_json.json", "r") as f:
        resume_json = json.load(f)

    # Build semantic text
    semantic_text = build_semantic_text(resume_json)

    # Generate embedding
    embedding = embed_semantic_text(semantic_text)

    print("✅ Embedding generated")
    print("Vector length:", len(embedding))
    print("First 10 values:", embedding[:10])
