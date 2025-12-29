import os
import sys
import json
from pathlib import Path
from process_resume import process_resume

# -------- CONFIG --------
SUPPORTED_FORMATS = [".pdf"]

# -------- BATCH PROCESSOR --------
def batch_process_resumes(directory_path):
    """
    Process all resume PDFs in a directory.
    
    Args:
        directory_path: Path to directory containing resume PDFs
    
    Returns:
        dict: Summary of processing results
    """
    
    if not os.path.isdir(directory_path):
        print(f"❌ Directory not found: {directory_path}")
        sys.exit(1)
    
    # Find all PDF files
    pdf_files = []
    for file in os.listdir(directory_path):
        if file.lower().endswith(".pdf"):
            pdf_files.append(os.path.join(directory_path, file))
    
    if not pdf_files:
        print(f"❌ No PDF files found in: {directory_path}")
        sys.exit(1)
    
    print(f"\n{'='*70}")
    print(f"BATCH PROCESSING RESUMES")
    print(f"{'='*70}")
    print(f"Directory: {directory_path}")
    print(f"PDFs found: {len(pdf_files)}")
    print(f"{'='*70}\n")
    
    # Track results
    results = {
        "total": len(pdf_files),
        "successful": 0,
        "failed": 0,
        "processed_users": [],
        "errors": []
    }
    
    # Process each PDF
    for idx, pdf_path in enumerate(pdf_files, 1):
        filename = os.path.basename(pdf_path)
        print(f"[{idx}/{len(pdf_files)}] Processing: {filename}")
        
        try:
            user_record = process_resume(pdf_path)
            results["successful"] += 1
            results["processed_users"].append(user_record["user_id"])
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
    print(f"Total PDFs: {results['total']}")
    print(f"Successful: {results['successful']}")
    print(f"Failed: {results['failed']}")
    print(f"{'='*70}\n")
    
    if results["processed_users"]:
        print(f"Processed Users:")
        for user_id in results["processed_users"]:
            print(f"  ✓ {user_id}")
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
        print("❌ Usage: python batch_process_resumes.py <directory_path>")
        print("Example: python batch_process_resumes.py ./resumes/")
        sys.exit(1)
    
    directory_path = sys.argv[1]
    batch_process_resumes(directory_path)
