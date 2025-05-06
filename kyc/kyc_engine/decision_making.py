"""
KYC verification pipeline and decision making module with multilingual support.
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

    # Step 1: OCR Extraction using Gemini with multilingual support
    try:
        print("DEBUG: Step 1 - Starting OCR Extraction using Gemini with multilingual support...")
        ocr_output = gemini(form_data, image_path)
        results["OCR"] = ocr_output
        
        # Add detected language to the top-level results for easy access
        if ocr_output and "detected_language" in ocr_output:
            results["detected_language"] = ocr_output["detected_language"]
            print(f"DEBUG: Detected language: {results['detected_language']}")
            
        print("DEBUG: Step 1 complete. OCR result obtained.")
    except Exception as e:
        print(f"DEBUG: Step 1 failed: {e}")
        results["OCR"] = {"error": str(e)}
        results["detected_language"] = "unknown"

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
    Now with improved handling of multilingual ID verification results.
    
    Args:
        pipeline_result: Dictionary containing results from all verification steps
        
    Returns:
        Decision as a JSON string with decision and reason fields
    """
    # Add language information to the prompt for better context
    language_context = ""
    if "detected_language" in pipeline_result:
        language_context = f"\nThe ID document was detected to be in {pipeline_result['detected_language']} language. "
        language_context += "Please account for potential transliteration and cross-script matching issues in your decision.\n"
    
    # Prepare the prompt with enhanced language context
    prompt = GLOBAL_DECISION_PROMPT + language_context + json.dumps(pipeline_result)
    decision_result = api_call(GEMINI_ENDPOINT, prompt)
    return decision_result


if __name__ == "__main__":
    # Example test case with multilingual option
    test_cases = [
        {
            "name": "English",
            "form_data": {
                "full_name": "John Smith",
                "dob": "01-05-1985",
                "nationality": "United States",
                "id_number": "123-45-6789"
            }
        },
        {
            "name": "Arabic",
            "form_data": {
                "full_name": "محمد الأحمد",
                "dob": "15-07-1990", 
                "nationality": "Saudi Arabia",
                "id_number": "1042587631"
            }
        }
    ]
    
    # Use the first test case
    form_data = test_cases[0]["form_data"]
    image_path = r"C:\Users\nazguul\Desktop\PFE_Workplace\Resources\ID Cards\new_york_fake_id-scaled-e1601065688702-1600x1029.jpg"

    final_results = run_pipeline(form_data, image_path)
    print(kyc_decision(final_results))
