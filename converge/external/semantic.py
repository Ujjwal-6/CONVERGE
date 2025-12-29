def build_semantic_text(resume_json: dict) -> str:
    sections = []

    # -------- SKILLS --------
    skills = resume_json.get("skills", {})
    skill_items = []

    for key in [
        "programming_languages",
        "frameworks_libraries",
        "tools_platforms",
        "domain_skills"
    ]:
        skill_items.extend(skills.get(key, []))

    if skill_items:
        sections.append(
            "SKILLS:\n" + ", ".join(sorted(set(skill_items)))
        )

    # -------- CORE CS --------
    core_cs = skills.get("core_cs_concepts", [])
    if core_cs:
        sections.append(
            "CORE COMPUTER SCIENCE:\n" + ", ".join(sorted(set(core_cs)))
        )

    # -------- PROJECT EXPERIENCE --------
    projects = resume_json.get("projects", [])
    project_descriptions = []

    for proj in projects:
        desc_parts = []

        if proj.get("title"):
            desc_parts.append(f"{proj['title']}:")

        if proj.get("description"):
            desc_parts.append(proj["description"])

        if proj.get("technologies"):
            desc_parts.append(
                "Technologies used: " + ", ".join(proj["technologies"])
            )

        if proj.get("domain"):
            desc_parts.append(
                "Domain: " + proj["domain"]
            )

        project_descriptions.append(" ".join(desc_parts))

    if project_descriptions:
        sections.append(
            "PROJECT EXPERIENCE:\n" + "\n".join(project_descriptions)
        )

    # -------- INTERESTS --------
    interests = resume_json.get("interests", {})
    interest_items = []

    for key in ["technical", "problem_domains", "learning_goals"]:
        interest_items.extend(interests.get(key, []))

    if interest_items:
        sections.append(
            "INTERESTS AND LEARNING GOALS:\n" + ", ".join(sorted(set(interest_items)))
        )

    # -------- EXPERIENCE ORIENTATION (soft signal) --------
    experience = resume_json.get("experience_level", {}).get("by_domain", {})
    if experience:
        exp_phrases = [
            f"{level} experience in {domain.replace('_', ' ')}"
            for domain, level in experience.items()
        ]
        sections.append(
            "EXPERIENCE ORIENTATION:\n" + ", ".join(exp_phrases)
        )

    # -------- FINAL SEMANTIC TEXT --------
    return "\n\n".join(sections)
