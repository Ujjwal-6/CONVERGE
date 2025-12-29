# Collaborator Matching Algorithm - Complete Documentation

## Overview

This is a **production-quality two-phase AI-based matching engine** that connects users (resumes) to projects using semantic embeddings + structured signals.

**Core Principle**: Embeddings decide relevance. Structured signals decide suitability.

---

## Architecture

### PHASE 1: Semantic Gate (Hard Filter)
```
Project Embedding (768-dim) ─┐
                             ├─ Cosine Similarity → Filter
User Embedding (768-dim) ────┘

IF similarity < 0.35 → User DISCARDED
ELSE → User proceeds to Phase 2
```

**Threshold Interpretation**:
- < 0.30: Unrelated
- 0.35 – 0.55: Good alignment
- > 0.60: Very strong alignment

---

### PHASE 2: Composite Suitability Scoring
For each user who passes Phase 1:

```
FINAL_SCORE = 
    0.50 * Semantic_Score
  + 0.18 * Skill_Match_Score
  + 0.12 * Experience_Alignment_Score
  + 0.08 * Year_Compatibility_Score
  + 0.07 * Reputation_Score
  + 0.05 * Availability_Score
```

**Weights** (must sum to 1.0):
- **Semantic**: 0.50 (PRIMARY - dominates ranking)
- **Skill**: 0.18 (hard alignment)
- **Experience**: 0.12 (project type fit)
- **Year**: 0.08 (soft penalty)
- **Reputation**: 0.07 (credibility, doesn't punish new users)
- **Availability**: 0.05 (time commitment)

---

## Signal Definitions

### 1. **Semantic Score** (Weight: 0.50)
```
Semantic_Score = cosine(project_embedding, user_embedding)
```
- Ranges: 0 to 1
- **Role**: Primary signal - dominates ranking
- **Interpretation**: Semantic relevance between project needs and user skills

---

### 2. **Skill Match Score** (Weight: 0.18)
```
Skill_Match_Score = |Required_Skills ∩ User_Skills| / |Required_Skills|
```
- Compares: `project.required_skills` vs `user.skills`
- **Rules**:
  - If no required skills → score = 1.0
  - Missing skills reduce score, don't discard user
  - Includes: languages, frameworks, domain skills

**Example**:
- Required: ["Python", "ML", "Data Science"]
- User has: ["Python", "ML", "TensorFlow"]
- Score: 2/3 = 0.67

---

### 3. **Experience Alignment Score** (Weight: 0.12)
```
Score based on project type preference:
- Hackathon → intermediate preferred
- Research → advanced preferred
- Open source → beginner-friendly
- Startup → intermediate preferred
```

**Scoring**:
| User Level | vs Preferred | Score |
|-----------|-------------|-------|
| Below | - | 0.3 |
| Exact Match | - | 1.0 |
| Above | - | 0.8 |

---

### 4. **Year Compatibility Score** (Weight: 0.08)
```
year_diff = abs(user_year - preferred_year)
Year_Score = max(0, 1 - 0.25 * year_diff)
```
- Soft penalty, never hard-blocks
- If preferred year unknown → score = 1.0

**Example**:
- User: 2024, Preferred: 2024 → diff=0 → score = 1.0
- User: 2023, Preferred: 2024 → diff=1 → score = 0.75
- User: 2022, Preferred: 2024 → diff=2 → score = 0.50

---

### 5. **Reputation Score** (Weight: 0.07)
```
confidence_factor = min(1, completed_projects / 5)
Reputation_Score = (average_rating / 5) * confidence_factor
```

**Rules**:
- New users (0 completed projects) → score = 1.0 (NO PENALTY)
- Rating scales 0-5 → normalized to 0-1
- Confidence increases as user completes more projects

**Example**:
- User A: 0 projects, no rating → score = 1.0
- User B: 2 projects, 4.5★ rating → score = (4.5/5) * (2/5) = 0.36
- User C: 5+ projects, 4.8★ rating → score = (4.8/5) * 1.0 = 0.96

---

### 6. **Availability Score** (Weight: 0.05)
```
Availability Mapping:
- High → 1.0
- Medium → 0.7
- Low → 0.4
```

Simple binary classification based on stated availability.

---

## Design Constraints

### ✅ MUST DO
- ✓ Semantic similarity leads ranking
- ✓ Structured signals refine, don't override
- ✓ New users NOT punished
- ✓ Algorithm is explainable
- ✓ Deterministic output

### ❌ MUST NOT
- ✗ Discard users for missing skills (soft penalty instead)
- ✗ Normalize everything aggressively
- ✗ Allow structured signals to dominate
- ✗ Hard-block on any factor except semantic threshold

---

## Usage

### Test with Single Project
```bash
python3 match_users_to_projects.py proj_694740e0
```

Output shows:
1. Phase 1: Which users pass semantic gate
2. Phase 2: Ranked list with all 6 scores
3. Score breakdown with weights applied

### Run Test Script
```bash
chmod +x test_matching.sh
./test_matching.sh
```

### Programmatic Usage
```python
from match_users_to_projects import match_users_to_project, display_matches

# Get matches
matches = match_users_to_project("proj_694740e0")

# Display
display_matches(matches, top_k=10)

# Or export
from match_users_to_projects import export_matches_json
export_matches_json(matches, "results.json")
```

---

## Output Format

### Console Output
```
====================================================================================
MATCHING USERS TO PROJECT: proj_694740e0
PROJECT TITLE: ML-Based Anomaly Detection
====================================================================================

PHASE 1: SEMANTIC GATE (Hard Filter)
Threshold: 0.35

  ✓ user_1: 0.5234 (PASS)
  ✓ user_2: 0.4891 (PASS)
  ✗ user_3: 0.2134 (FAIL)
  ✓ user_4: 0.6123 (PASS)

Phase 1 Result: 3 / 4 users passed

PHASE 2: COMPOSITE SUITABILITY SCORING
====================================================================================

RANK 1: Alice Smith (user_1)
  Final Score: 0.8234
  ├─ Semantic:     0.5234 (×0.50 = 0.2617)
  ├─ Skill Match:  0.8333 (×0.18 = 0.1500)
  ├─ Experience:   1.0000 (×0.12 = 0.1200)
  ├─ Year Compat:  0.7500 (×0.08 = 0.0600)
  ├─ Reputation:   0.9600 (×0.07 = 0.0672)
  └─ Availability: 1.0000 (×0.05 = 0.0500)
  Profile: 2024, high availability

RANK 2: Bob Johnson (user_2)
  Final Score: 0.7891
  ...
```

### JSON Export
```json
[
  {
    "user_id": "user_1",
    "resume_file": "RESUME_ALICE_SMITH",
    "final_score": 0.8234,
    "semantic_score": 0.5234,
    "skill_score": 0.8333,
    "experience_score": 1.0,
    "year_score": 0.75,
    "reputation_score": 0.96,
    "availability_score": 1.0,
    "profile": {
      "name": "Alice Smith",
      "year": "2024",
      "availability": "high"
    },
    "score_breakdown": {
      "w_semantic": 0.2617,
      "w_skill": 0.15,
      "w_experience": 0.12,
      "w_year": 0.06,
      "w_reputation": 0.0672,
      "w_availability": 0.05
    }
  }
]
```

---

## Key Properties

### Explainability
Every match includes:
- Component scores (0-1)
- Weight-adjusted contributions
- User profile context

### Fairness
- New users not penalized (reputation score = 1.0)
- Missing data degrades gracefully (no hard failures)
- Soft year penalty (not disqualifying)
- Skill gaps scored, not filtering

### Production-Ready
- Deterministic output
- No model training needed
- Works with 10-20 users
- Easily extensible weights
- Efficient O(n) complexity

---

## Extension Points

To modify behavior, adjust:

1. **SEMANTIC_THRESHOLD** (line 5)
   ```python
   SEMANTIC_THRESHOLD = 0.35  # Change gate cutoff
   ```

2. **WEIGHTS** (lines 7-14)
   ```python
   WEIGHTS = {
       "semantic": 0.50,  # Increase to emphasize embeddings
       "skill": 0.18,
       ...
   }
   ```

3. **Experience preferences** (lines 21-27)
   ```python
   PROJECT_TYPE_EXPERIENCE = {
       "hackathon": "intermediate",  # Change requirements
       ...
   }
   ```

4. **Scoring functions** (lines 135+)
   - Modify `score_*` functions to implement new logic
   - All return 0-1 normalized scores

---

## Algorithm Guarantees

✅ **Semantic-First**: Embedding similarity always weighted at 50%
✅ **No Hard Blocking**: Only semantic gate is hard filter
✅ **Transparent**: All scores fully decomposed
✅ **Deterministic**: Same inputs → same outputs
✅ **Scalable**: O(n*m) for n users, m projects
✅ **Interpretable**: Non-experts can understand rankings

