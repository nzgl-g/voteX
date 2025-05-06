"""
OCR verification module for extracting and verifying information from ID cards with multilingual support.
"""
from typing import Dict, Optional, Any

from ollama import chat, ChatResponse
from .shared import (
    GLOBAL_OCR_PROMPT,
    api_call,
    GEMINI_ENDPOINT,
    parse_json
)


def gemini(form_data: Dict[str, str], img_path: str) -> Optional[Dict[str, Any]]:
    """
    Process ID card extraction and verification using the Gemini API with enhanced multilingual support.
    
    Args:
        form_data: Dictionary containing user submitted identity information
        img_path: Path to the uploaded ID card image
        
    Returns:
        Parsed JSON result with extraction and verification data including language detection,
        transliteration, and confidence scores
    """
    # Format prompt with provided form data
    prompt = GLOBAL_OCR_PROMPT.format(
        form_full_name=form_data.get("full_name", ""),
        form_dob=form_data.get("dob", ""),
        form_nationality=form_data.get("nationality", ""),
        form_id_number=form_data.get("id_number", "")
    )
    
    # Call API and parse results
    result = parse_json(api_call(GEMINI_ENDPOINT, prompt, img_path))
    
    # Post-process result to ensure it has all required fields
    if result:
        # Ensure detected_language exists
        if "detected_language" not in result:
            result["detected_language"] = "unknown"
            
        # Ensure confidence scores exist for all fields
        for field in ["full_name", "dob", "nationality", "id_number"]:
            if field in result.get("detailed_result", {}):
                field_data = result["detailed_result"][field]
                if "confidence" not in field_data:
                    field_data["confidence"] = 100 if field_data.get("match", False) else 0
    
    return result


def ollama(form_data: Dict[str, str], image_path: str) -> str:
    """
    Process ID card extraction and verification using the Ollama API.
    
    Note: The Ollama Python package currently only accepts text input.
    If image data is needed, consider encoding and appending it to the prompt.
    
    Args:
        form_data: Dictionary containing user submitted identity information
        image_path: Path to the uploaded ID card image
        
    Returns:
        Raw response text from Ollama model
    """
    prompt = GLOBAL_OCR_PROMPT.format(
        form_full_name=form_data.get("full_name", ""),
        form_dob=form_data.get("dob", ""),
        form_nationality=form_data.get("nationality", ""),
        form_id_number=form_data.get("id_number", "")
    )
    messages = [
        {
            "role": "user",
            "content": prompt
        }
    ]
    response: ChatResponse = chat(model='lminicpm-v:latest', messages=messages)
    return response.message.content


if __name__ == "__main__":
    # Example test cases with different languages/scripts
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
        },
        {
            "name": "Chinese",
            "form_data": {
                "full_name": "李明",
                "dob": "1992-03-22",
                "nationality": "China",
                "id_number": "110101199203221234"
            }
        }
    ]
    
    # Path to the ID card image (update with the actual path)
    image_path = r"path/to/test/image.jpg"
    
    # For testing multilingual capabilities, uncomment and run with sample IDs:
    # for test in test_cases:
    #     print(f"\nTesting {test['name']} ID:")
    #     result = gemini(test['form_data'], image_path)
    #     print(f"Detected language: {result.get('detected_language', 'unknown')}")
    #     print(f"Status: {result.get('status', 'unknown')}")
    #     print(f"Similarity score: {result.get('Similarity Score', 0)}")