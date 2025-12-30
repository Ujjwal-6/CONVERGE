import json
from external.semantic import build_semantic_text

# Load resume JSON
with open("resume_json.json", "r") as f:
    resume_json = json.load(f)

# Build semantic text
semantic_text = build_semantic_text(resume_json)

# Print output
print("\n====== SEMANTIC TEXT ======\n")
print(semantic_text)
print("\n===========================\n")
