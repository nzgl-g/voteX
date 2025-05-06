"""
KYC verification pipeline and decision making module.
"""
import json
from typing import Dict, Any

from .ocr_check import gemini
from .metadata_check import detect_tampering
from .ela_check import ela_analysis
from .image_forensics import pixel_level_check
from .shared import GLOBAL_DECISION_PROMPT, api_call, GEMINI_ENDPOINT


def run_pipeline(form_data: Dict[str, str], image_path: str) -> Dict[str, Any]:
    """
    Run the complete KYC verification pipeline on the given form data and image.
    
    Args:
        form_data: Dictionary containing user submitted identity information
        image_path: Path to the uploaded ID card image
        
    Returns:
        Dictionary containing results from all verification steps
    """
    results = {}

    # Step 1: OCR Extraction using Gemini
    try:
        print("DEBUG: Step 1 - Starting OCR Extraction using Gemini...")
        ocr_output = gemini(form_data, image_path)
        results["OCR"] = ocr_output
        print("DEBUG: Step 1 complete. OCR result obtained.")
    except Exception as e:
        print(f"DEBUG: Step 1 failed: {e}")
        results["OCR"] = {"error": str(e)}

    # Step 2: Metadata Extraction & Tampering Detection
    try:
        print("DEBUG: Step 2 - Starting Metadata Extraction and Tampering Detection...")
        metadata_output = detect_tampering(image_path)
        results["Metadata"] = metadata_output
        print("DEBUG: Step 2 complete. Metadata result obtained.")
    except Exception as e:
        print(f"DEBUG: Step 2 failed: {e}")
        results["Metadata"] = {"error": str(e)}

    # Step 3: Error Level Analysis (ELA)
    try:
        print("DEBUG: Step 3 - Starting Error Level Analysis (ELA)...")
        ela_output = ela_analysis(image_path)
        results["ELA"] = ela_output
        print("DEBUG: Step 3 complete. ELA result obtained.")
    except Exception as e:
        print(f"DEBUG: Step 3 failed: {e}")
        results["ELA"] = {"error": str(e)}

    # Step 4: Pixel-level Forensic Analysis
    try:
        print("DEBUG: Step 4 - Starting Pixel-level Forensic Analysis...")
        forensics_output = pixel_level_check(image_path)
        results["Forensics"] = forensics_output
        print("DEBUG: Step 4 complete. Forensics result obtained.")
    except Exception as e:
        print(f"DEBUG: Step 4 failed: {e}")
        results["Forensics"] = {"error": str(e)}

    aggregated_results = json.dumps(results, indent=4)
    print("DEBUG: Pipeline execution complete. Aggregated results:")
    print(aggregated_results)

    return results


def kyc_decision(pipeline_result: Dict[str, Any]) -> str:
    """
    Make a final KYC verification decision based on results from all verification steps.
    
    Args:
        pipeline_result: Dictionary containing results from all verification steps
        
    Returns:
        Decision as a JSON string with decision and reason fields
    """
    prompt = GLOBAL_DECISION_PROMPT + json.dumps(pipeline_result)
    decision_result = api_call(GEMINI_ENDPOINT, prompt)
    return decision_result


if __name__ == "__main__":
    # Example test case
    form_data = {
        "full_name": "steven hinn",
        "dob": "07-07-98",
        "nationality": "Algerian",
        "id_number": "100020029048620002"
    }
    image_path = r"C:\Users\nazguul\Desktop\PFE_Workplace\Resources\ID Cards\new_york_fake_id-scaled-e1601065688702-1600x1029.jpg"

    final_results = run_pipeline(form_data, image_path)
    print(kyc_decision(final_results))
