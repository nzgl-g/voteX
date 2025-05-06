"""
KYC Verification API - Service Module with Multilingual Support

Provides REST API endpoints for KYC identity verification services with enhanced multilingual capabilities.
"""
import os
import sys
import json
from datetime import datetime
from typing import Dict, Any, List, Optional, Union

from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename

# Import absolute paths to avoid relative import issues
kyc_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if kyc_dir not in sys.path:
    sys.path.insert(0, kyc_dir)
from kyc_engine.decision_making import run_pipeline, kyc_decision
from kyc_engine.shared import ensure_output_dir

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Create uploads folder if it doesn't exist
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Initialize output directories
ensure_output_dir()
ensure_output_dir('temp')
ensure_output_dir('analysis')

# Initialize Blueprint
kyc_api = Blueprint('kyc_api', __name__)


def allowed_file(filename: str) -> bool:
    """
    Check if the uploaded file has an allowed extension.
    
    Args:
        filename: Name of the uploaded file
        
    Returns:
        True if file extension is allowed, False otherwise
    """
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@kyc_api.route('/api/v1/verify', methods=['POST'])
def verify_kyc():
    """
    Process KYC verification API request with multilingual support.
    
    Returns:
        JSON response with verification results or error message
    """
    try:
        # Check if image file is present
        if 'id_image' not in request.files:
            return jsonify({'status': 'error', 'message': 'No image file provided'}), 400

        file = request.files['id_image']
        if file.filename == '':
            return jsonify({'status': 'error', 'message': 'No selected file'}), 400

        if file and allowed_file(file.filename):
            # Create unique filename with timestamp
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"{timestamp}_{secure_filename(file.filename)}"
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)

            # Prepare form data
            form_data = {
                'full_name': request.form.get('full_name', ''),
                'dob': request.form.get('dob', ''),
                'nationality': request.form.get('nationality', ''),
                'id_number': request.form.get('id_number', '')
            }

            # Validate required fields
            missing_fields: List[str] = []
            for field, value in form_data.items():
                if not value:
                    missing_fields.append(field)
            
            if missing_fields:
                os.remove(filepath)  # Clean up file
                return jsonify({
                    'status': 'error',
                    'message': f'Missing required fields: {", ".join(missing_fields)}'
                }), 400

            # Run KYC pipeline with multilingual support
            pipeline_results = run_pipeline(form_data, filepath)

            # Get final decision
            decision_result = kyc_decision(pipeline_results)

            # Clean up uploaded file
            os.remove(filepath)

            # Format response for external API
            try:
                decision_obj = json.loads(decision_result)
            except json.JSONDecodeError:
                decision_obj = {
                    "decision": "unknown",
                    "reason": decision_result
                }
                
            # Extract detailed OCR results
            ocr_details = pipeline_results.get('OCR', {}).get('detailed_result', {})
            
            # Construct enhanced response with language information
            response = {
                'status': 'success',
                'verification_result': {
                    'decision': decision_obj.get('decision', 'unknown'),
                    'reason': decision_obj.get('reason', ''),
                    'detected_language': pipeline_results.get('detected_language', 'unknown'),
                    'checks': {
                        'ocr': {
                            'status': pipeline_results.get('OCR', {}).get('status', 'unknown'),
                            'similarity_score': pipeline_results.get('OCR', {}).get('Similarity Score', 0),
                            'details': {
                                'full_name': {
                                    'match': ocr_details.get('full_name', {}).get('match', False),
                                    'confidence': ocr_details.get('full_name', {}).get('confidence', 0),
                                    'transliteration': ocr_details.get('full_name', {}).get('transliteration', None)
                                },
                                'dob': {
                                    'match': ocr_details.get('dob', {}).get('match', False),
                                    'confidence': ocr_details.get('dob', {}).get('confidence', 0),
                                    'standardized_value': ocr_details.get('dob', {}).get('standardized_value', None)
                                },
                                'nationality': {
                                    'match': ocr_details.get('nationality', {}).get('match', False),
                                    'confidence': ocr_details.get('nationality', {}).get('confidence', 0),
                                    'normalized_value': ocr_details.get('nationality', {}).get('normalized_value', None)
                                },
                                'id_number': {
                                    'match': ocr_details.get('id_number', {}).get('match', False),
                                    'confidence': ocr_details.get('id_number', {}).get('confidence', 0),
                                    'normalized_value': ocr_details.get('id_number', {}).get('normalized_value', None)
                                }
                            }
                        },
                        'metadata': pipeline_results.get('Metadata', {}).get('status', 'unknown'),
                        'image_integrity': pipeline_results.get('ELA', {}).get('status', 'unknown')
                    }
                }
            }

            return jsonify(response)

        return jsonify({'status': 'error', 'message': 'Invalid file type'}), 400

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@kyc_api.route('/api/v1/health', methods=['GET'])
def health_check():
    """
    Health check endpoint to verify API service status.
    
    Returns:
        JSON response with service status
    """
    return jsonify({
        'status': 'operational',
        'version': '1.0'
    }) 