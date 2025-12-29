import os
import json
import re
import time
import google.generativeai as genai

# ---------------- CONFIG ---------------- #

MODEL_NAME = "models/gemma-3-12b-it"
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds

INPUT_FILE = "RESUME_UJJWALCHORARIA.txt"
OUTPUT_FILE = "resume_json.json"

# ---------------- GEMINI SETUP ---------------- #

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise EnvironmentError("❌ GEMINI_API_KEY not set in environment")

genai.configure(api_key=API_KEY)

# ---------------- SCHEMA ---------------- #

RESUME_SCHEMA = {
    
    "profile": {
        "user_id": "",
        "name": "",
        "year": "",
        "department": "",
        "institution": "",
        "availability": "low | medium | high"
    },

    "skills": {
        "programming_languages": [],
        "frameworks_libraries": [],
        "tools_platforms": [],
        "core_cs_concepts": [],
        "domain_skills": []
    },

    "experience_level": {
        "overall": "beginner | intermediate | advanced",
        "by_domain": {
        "web_dev": "beginner | intermediate | advanced",
        "ml_ai": "beginner | intermediate | advanced",
        "systems": "beginner | intermediate | advanced",
        "security": "beginner | intermediate | advanced"
        }
    },

    "projects": [
        {
        "title": "",
        "description": "",
        "technologies": [],
        "domain": "",
        "role": "",
        "team_size": 0,
        "completion_status": "completed | ongoing"
        }
    ],

    "interests": {
        "technical": [],
        "problem_domains": [],
        "learning_goals": []
    },

    "collaboration_preferences": {
        "roles_preferred": [],
        "project_types": ["hackathon", "research", "startup", "open_source"],
        "team_size_preference": ""
    },

    "open_source": {
        "experience": "none | beginner | active | maintainer",
        "technologies": [],
        "contributions": 0
    },

    "achievements": {
        "hackathons": [],
        "certifications": [],
        "awards": []
    },

    "reputation_signals": {
        "completed_projects": 0,
        "average_rating": 0.0,
        "peer_endorsements": 0
    },

    "embeddings": {
        "skill_embedding_id": "",
        "project_embedding_id": "",
        "interest_embedding_id": ""
    }

}

# ---------------- PROMPT BUILDER ---------------- #

def build_prompt(resume_text: str) -> str:
    return f"""
You are an expert resume parser.

TASK:
- Convert raw OCR resume text into structured JSON
- Follow the schema EXACTLY
- DO NOT infer, guess, assume, or hallucinate any data.
- If a field is not present in the resume, return an empty string ("") or an empty array ([]).
- Normalize extracted terms where possible (e.g., "C++" instead of "cplusplus").
- Infer project domains from descriptions
- Return ONLY valid JSON
- No markdown, no explanations, no extra text
- Extract ONLY information that is explicitly present in the text.
- DO NOT create synthetic skills, projects, experience levels, or interests.



RESUME TEXT:
----------------
{resume_text}
----------------

REQUIRED JSON SCHEMA:
{json.dumps(RESUME_SCHEMA, indent=2)}
"""

# ---------------- JSON CLEANER ---------------- #

def extract_json(text: str) -> dict:
    """
    Extracts the first valid JSON object from model output.
    Handles cases where Gemini adds extra text.
    """
    try:
        # Direct parse
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Fallback: extract JSON via regex
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        raise ValueError("❌ No JSON object found in LLM response")

    return json.loads(match.group())

# ---------------- PARSER ---------------- #

def parse_resume(resume_text: str) -> dict:
    model = genai.GenerativeModel(MODEL_NAME)

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = model.generate_content(
                build_prompt(resume_text),
                generation_config={
                    "temperature": 0,
                    "top_p": 1,
                    "top_k": 1,
                    "max_output_tokens": 2048
                }
            )

            parsed_json = extract_json(response.text)
            return parsed_json

        except Exception as e:
            print(f"⚠️ Attempt {attempt} failed: {e}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY)
            else:
                raise RuntimeError("❌ Failed to parse resume after retries")

# ---------------- MAIN ---------------- #

if __name__ == "__main__":
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        resume_text = f.read()

    result = parse_resume(resume_text)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)

    print("✅ Resume successfully parsed")
    print(f"📄 Output saved to {OUTPUT_FILE}")
