# AI-Powered KYC (Know Your Customer) System

This is an AI-powered KYC system designed to verify customer identities with multiple verification layers. It uses advanced image processing and AI techniques to detect fake or manipulated ID documents.

## Features

The system consists of several verification layers:  
- **OCR Verification** – Extracts and validates text from ID documents and compares with provided form data.
- **Metadata Verification** – Checks image EXIF metadata for inconsistencies or signs of manipulation.
- **ELA (Error Level Analysis) Check** – Detects possible image tampering using compression analysis.
- **Photo Forensics** – Performs in-depth pixel and pattern analysis to detect manipulation.
- **Decision-Making Engine** – Aggregates verification results and uses AI to make a final decision based on priority and confidence levels.

## How It Works

Each verification layer outputs its results individually. These results are then passed to an AI engine, which determines the final decision based on predefined rules and priority settings:

1. User submits personal information and ID image
2. System runs the verification pipeline:
   - OCR extracts text and compares with form data
   - Metadata verification checks for tampering signs
   - ELA detects compression inconsistencies
   - Forensic analysis checks pixel-level manipulation
3. AI decision engine evaluates all results
4. System returns verification decision (accept/deny/flag for review)

## Codebase Structure

```
.
├── api/                    # API-related files
│   ├── kyc_service.py      # API blueprint for KYC verification
│   ├── node_client_example.js # Example Node.js integration
│   ├── README.md           # API documentation
│   └── test_api.py         # API testing utilities
├── kyc_engine/             # Core verification modules
│   ├── decision_making.py  # Pipeline and decision-making logic
│   ├── ela_check.py        # Error Level Analysis implementation
│   ├── image_forensics.py  # Pixel-level forensic analysis
│   ├── metadata_check.py   # EXIF metadata analysis
│   ├── ocr_check.py        # OCR verification implementation
│   └── shared.py           # Shared utilities and configurations
├── templates/              # Web interface templates
│   └── index.html          # Main UI template
├── uploads/                # Temporary storage for uploaded images
├── output/                 # Output directory for analysis results
│   ├── temp/               # Temporary files
│   └── analysis/           # Analysis visualizations
├── app.py                  # Main Flask application
├── requirements.txt        # Python dependencies
└── .env_sample             # Sample environment variables
```

## Module Descriptions

### 1. KYC Engine Core Modules

#### decision_making.py
Central orchestration module that runs the verification pipeline and makes final decisions.
- `run_pipeline()`: Executes all verification steps and collects results
- `kyc_decision()`: Processes verification results to make final accept/deny/flag decision

#### ocr_check.py
Handles OCR extraction and verification of ID card text.
- `gemini()`: Uses Google Gemini API to extract and verify ID text
- `ollama()`: Alternative implementation using local Ollama model

#### metadata_check.py
Analyzes EXIF metadata for signs of tampering.
- `extract_metadata()`: Extracts all EXIF metadata from image
- `detect_tampering()`: Analyzes metadata for manipulation indicators

#### ela_check.py
Implements Error Level Analysis to detect image manipulation.
- `ela_analysis()`: Performs ELA algorithm on image
- `generate_composite_ela_image()`: Creates visualization of ELA results

#### image_forensics.py
Advanced pixel-level forensic analysis for manipulation detection.
- `pixel_level_check()`: Main analysis function
- `analyze_edges()`, `analyze_noise()`: Component analysis techniques
- `detect_cloning()`: Detects copy-paste manipulation
- `generate_composite_image()`: Creates visualization of forensic results

#### shared.py
Core utilities and shared functionality.
- API endpoints and configurations
- Output directory management
- JSON parsing utilities
- Prompt templates for AI models

### 2. API Components

#### kyc_service.py
Blueprint for KYC API endpoints.
- `/api/v1/verify`: Main verification endpoint
- `/api/v1/health`: Health check endpoint

#### node_client_example.js
Example Node.js client showing API integration.
- Form handling and file upload
- Communication with KYC API
- Result processing and display

### 3. Web Interface

#### app.py
Main Flask application.
- Web routes and form handling
- API blueprint registration
- Directory initialization

#### templates/index.html
Web interface template with form for submitting ID verification.

## Environment Setup

The system requires the following environment variables:
- `GEMINI_API_KEY`: API key for Google Gemini API
- `GEMINI_MODEL`: Model identifier for Gemini AI model

## Installation

Follow these steps to set up and run the project:

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd <project-folder>
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   - Create a `.env` file in the project root based on `.env_sample`
   - Add your Gemini API key and model name

4. **Run the application**
   ```bash
   python app.py
   ```

## API Integration

The system provides a RESTful API for integration with other applications:

### API Endpoints

- **Verify KYC**: `POST /api/v1/verify`
  - Processes an ID card image and personal information for KYC verification
  - Returns a verification decision with detailed results

- **Health Check**: `GET /api/v1/health`
  - Checks if the KYC service is operational

### Request Format (Verify KYC)

```
POST /api/v1/verify
Content-Type: multipart/form-data

Form Parameters:
- full_name: User's full name
- dob: Date of birth (DD-MM-YYYY)
- nationality: User's nationality
- id_number: ID card number
- id_image: ID card image file (JPG/PNG)
```

### Response Format

```json
{
  "status": "success",
  "verification_result": {
    "decision": "accept",
    "reason": "All verification checks passed successfully",
    "checks": {
      "ocr": "success",
      "metadata": "success",
      "image_integrity": "success"
    }
  }
}
```

### Integration with Node.js/Express

Example integration code for Node.js applications:

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function verifyKYC(userData, idImagePath) {
  const form = new FormData();
  form.append('full_name', userData.fullName);
  form.append('dob', userData.dateOfBirth);
  form.append('nationality', userData.nationality);
  form.append('id_number', userData.idNumber);
  form.append('id_image', fs.createReadStream(idImagePath));
  
  const response = await axios.post('http://your-kyc-server:5000/api/v1/verify', form, {
    headers: { ...form.getHeaders() }
  });
  
  return response.data;
}
```

See the complete Node.js example in `api/node_client_example.js`

## Verification Process Technical Details

### OCR Verification
The OCR verification uses Google's Gemini AI to extract text from ID cards and compare it with submitted form data. The system uses fuzzy matching to account for minor variations and different formats.

### Error Level Analysis (ELA)
ELA works by saving the image at a known quality level (e.g., 90%), then comparing this re-compressed version with the original. Areas with significant differences often indicate manipulation. The system visualizes these differences and calculates an error level score.

### Metadata Analysis
The metadata check examines EXIF data for signs of manipulation like:
- Editing software fingerprints
- Inconsistent timestamps
- Missing or altered camera information
- GPS data anomalies

### Forensic Analysis
Pixel-level forensic analysis includes:
- Edge detection anomalies
- Noise pattern inconsistencies
- Clone detection (copy-paste manipulation)
- JPEG compression artifact analysis

### Decision Engine
The decision engine weighs all verification results with different priorities:
1. OCR verification (highest priority)
2. ELA and forensic analysis (high priority)
3. Metadata verification (medium priority)

## Output and Visualization

The system generates visualization files in the `output` directory:
- `output/analysis`: Contains ELA and forensic analysis visualizations
- `output/temp`: Temporary files used during processing

These visualizations help in understanding the verification results and can be useful for manual review when needed.

## Testing

Use the provided testing utilities to verify the system's functionality:

```bash
# Test the API health endpoint
python api/test_api.py --test health

# Test verification with a sample image
python api/test_api.py --test verify --image /path/to/id_image.jpg
```

## Contributing

To contribute to this project:
1. Fork the repository
2. Create a feature branch
3. Implement your changes with tests
4. Submit a pull request

## License

This project is proprietary software. All rights reserved.
