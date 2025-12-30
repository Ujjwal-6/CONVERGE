#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'converge.settings')
django.setup()

from resumes.models import Resume
from pipelines.resume_pipeline import process_resume_instance

# Get the last resume
resume = Resume.objects.last()
print(f"Processing Resume ID: {resume.id}")
print(f"File: {resume.file.path}")

# Try to process it
result = process_resume_instance(resume)
print(f"Result: {result}")

# Check fields
resume.refresh_from_db()
print(f"\nAfter processing:")
print(f"Raw text length: {len(resume.raw_text) if resume.raw_text else 0}")
print(f"Parsed JSON: {'Yes' if resume.parsed_json else 'No'}")
print(f"Semantic text length: {len(resume.semantic_text) if resume.semantic_text else 0}")
print(f"Embedding dimension: {len(resume.embedding) if resume.embedding else 0}")
