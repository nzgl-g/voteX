"""
OCR verification module for extracting and verifying information from ID cards.
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
    Process ID card extraction and verification using the Gemini API.
    
    Args:
        form_data: Dictionary containing user submitted identity information
        img_path: Path to the uploaded ID card image
        
    Returns:
        Parsed JSON result with extraction and verification data
    """
    prompt = GLOBAL_OCR_PROMPT.format(
        form_full_name=form_data.get("full_name", ""),
        form_dob=form_data.get("dob", ""),
        form_nationality=form_data.get("nationality", ""),
        form_id_number=form_data.get("id_number", "")
    )
    return parse_json(api_call(GEMINI_ENDPOINT, prompt, img_path))


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
    # Example test case
    form_data = {
        "full_name": "Younes Habbal",
        "dob": "09-22-2002",
        "nationality": "Algerian",
        "id_number": "5843216619642184"
    }
    # Path to the ID card image (update with the actual path)
    image_path = r"C:\Users\nazguul\Pictures\Screenshots\Capture d'écran 2025-01-18 215829.png"

    # Process with Gemini
    gemini_result = gemini(form_data, image_path)
    print("Gemini Result:")
    print(gemini_result)
    # Process with Ollama
    # ollama_result = ollama(form_data, image_path)
    # print("\nOllama Result:")
    # print(ollama_result)