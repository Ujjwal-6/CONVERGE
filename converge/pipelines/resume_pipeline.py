from typing import Optional
from django.core.files.storage import default_storage

from external.ocr1 import extract_text_from_pdf
from external.parse_resume import parse_resume
from external.semantic import build_semantic_text
from external.embed_resume import embed_semantic_text


def process_resume_instance(resume) -> Optional[dict]:
    """
    Run OCR → LLM parse → semantic reduce → embed on a Resume instance.
    Stores results back on the model.
    Returns a summary dict or None on failure.
    """
    try:
        pdf_path = resume.file.path

        # 1) OCR
        raw_text = extract_text_from_pdf(pdf_path)

        # 2) LLM → RJ
        parsed_json = parse_resume(raw_text)

        # 3) Semantic reduce
        semantic_text = build_semantic_text(parsed_json)

        # 4) Embed
        embedding = embed_semantic_text(semantic_text)

        # Persist
        resume.raw_text = raw_text
        resume.parsed_json = parsed_json
        resume.semantic_text = semantic_text
        resume.embedding = embedding
        resume.save(update_fields=[
            "raw_text", "parsed_json", "semantic_text", "embedding"
        ])

        return {
            "text_len": len(raw_text or ""),
            "embedding_dim": len(embedding or []),
        }

    except Exception as e:
        # Minimal handling; caller can log
        return None