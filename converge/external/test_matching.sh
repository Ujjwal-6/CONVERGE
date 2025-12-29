#!/bin/bash

# Test the matching algorithm

echo "==============================================="
echo "COLLABORATOR MATCHING SYSTEM - TEST SCRIPT"
echo "==============================================="
echo ""

# Check if project_embeddings.json exists
if [ ! -f "project_embeddings.json" ]; then
    echo "❌ project_embeddings.json not found"
    echo "Please run: python3 process_project.py or python3 batch_process_projects.py projects/"
    exit 1
fi

# Check if user_embeddings.json exists
if [ ! -f "user_embeddings.json" ]; then
    echo "❌ user_embeddings.json not found"
    echo "Please run: python3 batch_process_resumes.py resumes/"
    exit 1
fi

# Get first project ID from project_embeddings.json
PROJECT_ID=$(python3 -c "import json; data = json.load(open('project_embeddings.json')); print(data[0]['project_id'] if data else '')")

if [ -z "$PROJECT_ID" ]; then
    echo "❌ No projects found in project_embeddings.json"
    exit 1
fi

echo "Found project: $PROJECT_ID"
echo ""
echo "Running matching algorithm..."
echo ""

python3 match_users_to_projects.py "$PROJECT_ID"
