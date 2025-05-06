"""
Metadata analysis module for detecting image tampering through EXIF data.
"""
import re
import json
from typing import Dict, Any, Optional

print("DEBUG: Loading metadata_check.py module")

from PIL import Image, ExifTags
try:
    from .shared import (
        GLOBAL_TAMPERING_PROMPT,
        api_call,
        GEMINI_ENDPOINT,
        parse_json
    )
    print("DEBUG: Successfully imported from .shared")
except ImportError as e:
    print(f"DEBUG: Import error: {e}")


def extract_metadata(image_path: str) -> Dict[str, Any]:
    """
    Extract all available EXIF metadata from an image using Pillow.
    
    Args:
        image_path: Path to the image file
        
    Returns:
        Dictionary containing EXIF metadata with decoded tag names
    """
    try:
        img = Image.open(image_path)
        exif_data = img._getexif()
        if not exif_data:
            return {}
            
        metadata = {}
        for tag, value in exif_data.items():
            decoded = ExifTags.TAGS.get(tag, tag)
            metadata[decoded] = value
        return metadata
    except Exception as e:
        print(f"Error extracting metadata: {e}")
        return {}


def detect_tampering(image_path: str) -> Optional[Dict[str, Any]]:
    """
    Extract metadata and analyze it for signs of tampering.
    
    Args:
        image_path: Path to the image file
        
    Returns:
        Analysis result with status and message fields
    """
    full_metadata = extract_metadata(image_path)

    # Convert metadata to JSON, handling non-serializable types
    metadata_json = json.dumps(
        full_metadata,
        indent=2,
        default=lambda o: float(o) if hasattr(o, 'numerator') and hasattr(o, 'denominator') else str(o)
    )
    
    # Build the prompt with the complete metadata injected
    prompt = GLOBAL_TAMPERING_PROMPT.format(metadata=metadata_json)
    
    # Call the Gemini API using only the text prompt
    result = api_call(GEMINI_ENDPOINT, prompt)
    return parse_json(result)


if __name__ == "__main__":
    # Example test case
    image_path = r"C:\Users\nazguul\Desktop\PFE_Workplace\Resources\ID Cards\20220327_171259 (1).jpg"
    tampering_result = detect_tampering(image_path)

    print("Tampering Detection Result:")
    print(tampering_result)