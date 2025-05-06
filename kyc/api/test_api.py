"""
KYC API Testing Tool

Command-line utility for testing the KYC verification API endpoints.
"""
import os
import sys
import argparse
from typing import Dict, Any, Optional, Union, Tuple

import requests


def test_health_check(base_url: str) -> bool:
    """
    Test the health check endpoint.
    
    Args:
        base_url: Base URL of the KYC API
        
    Returns:
        True if test passed, False otherwise
    """
    url = f"{base_url}/api/v1/health"
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {str(e)}")
        return False


def test_verify_kyc(base_url: str, image_path: str, form_data: Dict[str, str]) -> bool:
    """
    Test the KYC verification endpoint.
    
    Args:
        base_url: Base URL of the KYC API
        image_path: Path to ID card image
        form_data: Dictionary containing form fields
        
    Returns:
        True if test passed, False otherwise
    """
    url = f"{base_url}/api/v1/verify"
    
    if not os.path.exists(image_path):
        print(f"Error: Image file not found at {image_path}")
        return False
    
    try:
        files = {'id_image': open(image_path, 'rb')}
        response = requests.post(url, data=form_data, files=files)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {str(e)}")
        return False
    finally:
        if 'files' in locals() and 'id_image' in files:
            files['id_image'].close()


def main() -> int:
    """
    Main entry point for the API testing tool.
    
    Returns:
        Exit code (0 for success, 1 for failure)
    """
    parser = argparse.ArgumentParser(description="Test the KYC API")
    parser.add_argument("--url", help="Base URL for the API", default="http://localhost:5000")
    parser.add_argument("--test", help="Test to run (health, verify)", default="health")
    parser.add_argument("--image", help="Path to ID image for verification")
    parser.add_argument("--name", help="Full name for verification")
    parser.add_argument("--dob", help="Date of birth for verification")
    parser.add_argument("--nationality", help="Nationality for verification")
    parser.add_argument("--id-number", help="ID number for verification")
    
    args = parser.parse_args()
    
    if args.test == "health":
        success = test_health_check(args.url)
    elif args.test == "verify":
        if not args.image:
            print("Error: --image is required for verify test")
            return 1
        
        form_data = {
            'full_name': args.name or "Test User",
            'dob': args.dob or "01-01-1990",
            'nationality': args.nationality or "Test Country",
            'id_number': args.id_number or "1234567890"
        }
        
        success = test_verify_kyc(args.url, args.image, form_data)
    else:
        print(f"Unknown test: {args.test}")
        return 1
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main()) 