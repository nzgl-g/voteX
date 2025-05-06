"""
KYC Verification System - Main Application

A Flask-based web application for verifying user identities through document analysis.
"""
import os
import sys
import json
from datetime import datetime

from flask import Flask, request, jsonify, render_template
from werkzeug.utils import secure_filename

# Import absolute paths to avoid relative import issues
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kyc_engine.decision_making import run_pipeline, kyc_decision
from api.kyc_service import kyc_api
from kyc_engine.shared import ensure_output_dir

# Initialize Flask app
app = Flask(__name__)

# Register API blueprint
app.register_blueprint(kyc_api)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Create required directories
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Initialize the output directories
ensure_output_dir()
ensure_output_dir('temp')
ensure_output_dir('analysis')

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


def allowed_file(filename: str) -> bool:
    """
    Check if the uploaded file has an allowed extension.
    
    Args:
        filename: Name of the uploaded file
        
    Returns:
        True if file extension is allowed, False otherwise
    """
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/')
def home():
    """Render the home page with the verification form."""
    return render_template('index.html')


@app.route('/verify_kyc', methods=['POST'])
def verify_kyc():
    """
    Process KYC verification request from the web form.
    
    Returns:
        JSON response with verification results or error message
    """
    try:
        # Check if image file is present
        if 'id_image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400

        file = request.files['id_image']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        if file and allowed_file(file.filename):
            # Create unique filename with timestamp
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"{timestamp}_{secure_filename(file.filename)}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)

            # Prepare form data
            form_data = {
                'full_name': request.form.get('full_name'),
                'dob': request.form.get('dob'),
                'nationality': request.form.get('nationality'),
                'id_number': request.form.get('id_number')
            }

            # Run KYC pipeline
            pipeline_results = run_pipeline(form_data, filepath)

            # Get final decision
            decision = kyc_decision(pipeline_results)

            # Clean up uploaded file
            os.remove(filepath)

            # Parse the decision as JSON
            try:
                decision_json = json.loads(decision)
            except json.JSONDecodeError:
                # If it's not valid JSON, create a structured response
                decision_json = {
                    "status": "KYC Worked peacefully",
                    "message": decision
                }

            return jsonify({
                'status': 'success',
                'pipeline_results': pipeline_results,
                'decision': json.dumps(decision_json)
            })

        return jsonify({'error': 'Invalid file type'}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=80)