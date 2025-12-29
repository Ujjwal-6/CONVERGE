import os
import google.generativeai as genai
from semantic import build_semantic_text

# ---------------- CONFIG ----------------
EMBEDDING_MODEL = "models/text-embedding-004"

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# ---------------- EMBEDDING FUNCTION ----------------
def embed_semantic_text(text: str) -> list:
    """
    Converts semantic text into a numerical embedding vector.
    """
    response = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=text,
        task_type="retrieval_document"
    )
    return response["embedding"]

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
