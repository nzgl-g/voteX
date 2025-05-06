import base64
import json
import os
import time
from typing import Optional, Dict, Any

import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL")
GEMINI_ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"

# Output directory configuration
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "output")

def ensure_output_dir(subdir: Optional[str] = None) -> str:
    """
    Ensure the output directory exists and return the path.
    
    Args:
        subdir: Optional subdirectory within the output directory
        
    Returns:
        Path to the output directory or subdirectory
    """
    output_path = OUTPUT_DIR
    if subdir:
        output_path = os.path.join(output_path, subdir)
        
    os.makedirs(output_path, exist_ok=True)
    return output_path

def get_output_path(filename: str, subdir: Optional[str] = None) -> str:
    """
    Get a full path for an output file in the output directory.
    
    Args:
        filename: The filename to use
        subdir: Optional subdirectory within the output directory
        
    Returns:
        Full path to the output file
    """
    output_dir = ensure_output_dir(subdir)
    return os.path.join(output_dir, filename)

# Global prompt for extraction and comparison with multilingual support
GLOBAL_OCR_PROMPT = """
You are an ADVANCED AI specialized in ID card information extraction for GLOBAL identity documents. You are provided with an image of an ID card and form data that should match information on the card. Your primary task is to EXTRACT information from the ID card image and compare it with the provided form values.

It is imperative that the image is of an ID card. If it is not, immediately exit the check and include the message: "no id card recognized."

### MULTILINGUAL CAPABILITIES:
- You MUST be able to process ID cards in ANY language
- You must detect the primary language of the ID card and note it in your analysis
- For non-Latin scripts (Arabic, Chinese, Cyrillic, etc.), extract the text in its native script AND provide a transliteration when comparing
- When comparing names across different scripts/languages, use phonetic similarity and transliteration rules, not just exact string matching

Instructions:

1. **Full Name:**
   - Locate and extract the full name directly from the ID card in its original language/script
   - Then compare it with the provided `form_full_name` using:
      a) Direct matching if in the same script
      b) Transliteration matching if in different scripts
      c) Phonetic similarity for cross-language comparison
   - Consider common name variations across cultures (e.g., order of names, patronymics, etc.)
   - If the names don't match closely (accounting for transliteration and cultural differences), this is a CRITICAL FAILURE.

2. **Date of Birth (DOB):**
   - Extract the date of birth as it appears on the ID card
   - Be aware of different date formats globally:
      a) DD-MM-YYYY (most countries)
      b) MM-DD-YYYY (US)
      c) YYYY-MM-DD (ISO/East Asian)
      d) Local calendar systems (Hijri, Hebrew, Thai Buddhist, etc.)
   - Convert to a standardized format before comparison if needed
   - Compare with `form_dob`, accounting for all possible date formats and calendar systems
   - If the dates don't match (after proper format conversion), this is a CRITICAL FAILURE.

3. **Nationality:**
   - Identify nationality from the ID card through:
      a) The type/design of the card if it's from a specific country
      b) Any nationality field or country name/emblem on the card
      c) Language(s) used on the card
   - Recognize that nationality may be shown in local language (e.g., "Deutsche" for German)
   - If found, compare with `form_nationality` using fuzzy matching and language translation
   - If nationality cannot be determined from the card, mark as "not found" (not a failure)
   - If found but doesn't match the provided value (accounting for language differences), this is a CRITICAL FAILURE.

4. **ID Number:**
   - Extract any ID number, document number, or similar identifier from the card
   - Be aware that ID formats vary by country (some use letters, special characters, etc.)
   - Be thorough in detecting ID numbers even if they use non-Latin scripts or special formats
   - Compare with `form_id_number`, ignoring spaces, special characters, and formatting differences
   - If no ID number can be found, mark as "not found" (not a critical failure)
   - If found but doesn't match, this is an important discrepancy but not always critical.

**CRITICAL RULE: If either the name or DOB is found on the card but does NOT match the form data (after proper translation/transliteration), mark the entire OCR check as "fail".**

**Output:**

Return the result strictly in the following JSON structure (with no extra commentary):

{{
  "status": "success | fail | flag for review",
  "Similarity Score": <0-100>,
  "detected_language": "<primary language of the ID card>",
  "detailed_result": {{
    "full_name": {{
      "form_value": "{form_full_name}",
      "founded_value": "<extracted value>",
      "transliteration": "<transliterated value if applicable>",
      "match": true | false,
      "confidence": <0-100>
    }},
    "dob": {{
      "form_value": "{form_dob}",
      "founded_value": "<extracted value>",
      "standardized_value": "<date in standard format if applicable>",
      "match": true | false,
      "confidence": <0-100>
    }},
    "nationality": {{
      "form_value": "{form_nationality}",
      "founded_value": "<extracted value> | not found",
      "normalized_value": "<translated to English if applicable>",
      "match": true | false,
      "confidence": <0-100>
    }},
    "id_number": {{
      "form_value": "{form_id_number}",
      "founded_value": "<extracted value> | not found",
      "normalized_value": "<without spaces/special chars if applicable>",
      "match": true | false,
      "confidence": <0-100>
    }}
  }},
  "message": "<Explanation of any critical failures or issues found, including language processing details if relevant>"
}}
"""


# --------------------------------------------------------------------
# Global prompt for metadata analyze
GLOBAL_TAMPERING_PROMPT = """
You are a digital forensics expert specializing in EXIF metadata analysis. Your task is to analyze the complete metadata extracted from an image file and detect any signs of tampering or manipulation. 

**NOTE: While metadata analysis is important, it is NOT a critical test for overall verification. Some legitimate ID photos may lack complete metadata.**

Please perform the following checks:

1. Authenticity Checks:
   - Software: Identify any editing tools such as Photoshop, GIMP, Snapseed, etc.
   - Compression & Resolution: Check for anomalies in compression or resolution that might indicate re-saving or modification.

2. Consistency Checks:
   - Make & Model: Note if the camera's make and model are present and consistent.
   - Other Metadata: Analyze available fields for consistency.

3. Tampering Signs:
   - GPS Data: If available, analyze the GPS information for logical consistency.
   - Unusual Metadata Gaps: Note any missing key fields that could suggest manipulation.

Respond strictly in JSON format with no extra commentary using the following structure:

{{
  "status": "success" or "flag for review" or "fail",
  "message": "<detailed explanation of the forensic analysis, noting any inconsistencies, tampering, or fraud indicators>"
}}

Even if multiple key fields are missing, this should generally result in "flag for review" rather than outright "fail" unless there are clear signs of manipulation.

Complete Metadata:
{metadata}
"""
# --------------------------------------------------------------------
GLOBAL_DECISION_PROMPT = """
You are an elite AI designed for strict data analysis and decisive judgment in ID verification. Your task is to evaluate results from multiple verification layers and determine if an ID is authentic.

Priority ranking for verification layers (highest to lowest):
1. OCR Verification (Critical - if it fails, the verification should generally fail)
2. ELA Check (Error Level Analysis) (Very High priority - strong evidence of tampering)
3. Image Forensics Check (High priority - pixel-level evidence of manipulation)
4. Metadata Verification (Medium priority - supplementary evidence)

### RULES:
1. **OCR is the MOST CRITICAL check:**
   - If OCR status is "fail", the overall decision should almost always be "deny"
   - If name or DOB doesn't match, this is usually grounds for denial

2. **ELA and Image Forensics are CRUCIAL for detecting tampering:**
   - If both ELA and Forensics indicate tampering (status="fail"), the decision should be "deny" regardless of OCR
   - If either shows signs of manipulation, this should heavily influence the decision

3. **Metadata is SUPPORTIVE but not decisive:**
   - Metadata issues alone should not result in denial unless extremely suspicious
   - Missing metadata fields are common and not necessarily suspicious

4. **Your output must follow this exact JSON format:**

{{
  "decision": "<accept/deny/flag for review>",
  "reason": "<brief, data-driven explanation>"
}}

Remember: The verification is primarily about matching the person's claimed identity (OCR check) and ensuring the ID document hasn't been tampered with (ELA and Forensics checks).
"""


def parse_json(input_str: str) -> Optional[Dict[str, Any]]:
    """Parse JSON from a string, handling potential formatting issues.
    
    Args:
        input_str: String potentially containing JSON
        
    Returns:
        Parsed JSON as dict or None if parsing failed
    """
    start = input_str.find('{')
    end = input_str.rfind('}') + 1
    
    if start == -1 or end == 0:
        print("No JSON content found in string")
        return None
        
    json_content = input_str[start:end]

    try:
        parsed_json = json.loads(json_content)
        return parsed_json
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        return None


def encode_image(img_path: str) -> Optional[str]:
    """Encode an image file to a Base64 string.
    
    Args:
        img_path: Path to the image file
        
    Returns:
        Base64 encoded string or None if encoding failed
    """
    try:
        with open(img_path, "rb") as file:
            return base64.b64encode(file.read()).decode("utf-8")
    except Exception as e:
        print(f"Error encoding image: {e}")
        return None


def api_call(endpoint: str, prompt_text: str, img_path: str = None, 
             retries: int = 3, delay: int = 2) -> str:
    """Handle API calls with retry logic for both text-only and text-with-image requests.
    
    Args:
        endpoint: API endpoint URL
        prompt_text: Text prompt to send
        img_path: Optional path to image file
        retries: Number of retry attempts
        delay: Delay between retries in seconds
        
    Returns:
        API response text or error message
    """
    payload = {"contents": [{"parts": [{"text": prompt_text}]}]}

    if img_path:
        image_data = encode_image(img_path)
        if image_data:
            payload["contents"][0]["parts"].append({
                "inline_data": {"mime_type": "image/jpeg", "data": image_data}
            })

    headers = {"Content-Type": "application/json"}

    for attempt in range(retries):
        try:
            response = requests.post(endpoint, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            return data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get(
                "text", "No response received.")
        except Exception as e:
            print(f"\tAttempt {attempt + 1} failed: {str(e)}")
            if attempt < retries - 1:
                time.sleep(delay)
            else:
                return json.dumps({
                    "status": "fail",
                    "message": f"API call failed after multiple attempts, Endpoint {endpoint}",
                })
