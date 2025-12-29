import os
import sys
import json
from pathlib import Path
from process_project import process_project

# -------- CONFIG --------
SUPPORTED_FORMATS = [".json"]

# -------- BATCH PROCESSOR --------
def batch_process_projects(directory_path):
    """
    Process all project JSON files in a directory.
    
    Args:
        directory_path: Path to directory containing project JSON files
    
    Returns:
        dict: Summary of processing results
    """
    
    if not os.path.isdir(directory_path):
        print(f"❌ Directory not found: {directory_path}")
        sys.exit(1)
    
    # Find all JSON files
    json_files = []
    for file in os.listdir(directory_path):
        if file.lower().endswith(".json"):
            json_files.append(os.path.join(directory_path, file))
    
    if not json_files:
        print(f"❌ No JSON files found in: {directory_path}")
        sys.exit(1)
    
    print(f"\n{'='*70}")
    print(f"BATCH PROCESSING PROJECTS")
    print(f"{'='*70}")
    print(f"Directory: {directory_path}")
    print(f"Project JSONs found: {len(json_files)}")
    print(f"{'='*70}\n")
    
    # Track results
    results = {
        "total": len(json_files),
        "successful": 0,
        "failed": 0,
        "processed_projects": [],
        "errors": []
    }
    
    # Process each JSON
    for idx, json_path in enumerate(json_files, 1):
        filename = os.path.basename(json_path)
        print(f"[{idx}/{len(json_files)}] Processing: {filename}")
        
        try:
            # Load project JSON
            with open(json_path, "r") as f:
                project_json = json.load(f)
            
            # Process project
            project_record = process_project(project_json)
            results["successful"] += 1
            results["processed_projects"].append(project_record["project_id"])
            print(f"    ✅ Success\n")
        
        except Exception as e:
            results["failed"] += 1
            error_msg = f"{filename}: {str(e)}"
            results["errors"].append(error_msg)
            print(f"    ❌ Failed: {str(e)}\n")
    
    # Print summary
    print(f"\n{'='*70}")
    print(f"BATCH PROCESSING SUMMARY")
    print(f"{'='*70}")
    print(f"Total Projects: {results['total']}")
    print(f"Successful: {results['successful']}")
    print(f"Failed: {results['failed']}")
    print(f"{'='*70}\n")
    
    if results["processed_projects"]:
        print(f"Processed Projects:")
        for proj_id in results["processed_projects"]:
            print(f"  ✓ {proj_id}")
        print()
    
    if results["errors"]:
        print(f"Errors:")
        for error in results["errors"]:
            print(f"  ✗ {error}")
        print()
    
    print(f"{'='*70}\n")
    
    return results

# -------- MAIN --------
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("❌ Usage: python batch_process_projects.py <directory_path>")
        print("Example: python batch_process_projects.py ./projects/")
        sys.exit(1)
    
    directory_path = sys.argv[1]
    batch_process_projects(directory_path)
