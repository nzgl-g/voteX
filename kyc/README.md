# KYC (Know Your Customer) System Documentation

This document provides an overview of the KYC system, its components, API, and how it operates.

## Overview

The KYC system is a Python-based application, likely using Flask or a similar micro-framework, designed to verify user identities. It performs several checks on submitted ID documents and personal information to determine the authenticity and validity of the KYC request. The main server application (Node.js/Express) interacts with this KYC system via its API.

## Project Structure

*   **`app.py`**: The main Flask (or similar) application file. It defines routes, handles requests, and orchestrates the KYC verification process.
*   **`run.py`**: A simple script to run the development server for the KYC application.
*   **`setup.py`**: Standard Python package setup file, indicating this can be packaged as a library (`kyc.egg-info`).
*   **`requirements.txt`**: Lists the Python dependencies required for the KYC system.
*   **`__init__.py`**: Makes the `kyc` directory a Python package.
*   **`.env_sample`**: A sample environment file, indicating that configuration (e.g., API keys, secret keys) is likely managed through environment variables. A `.env` file (gitignored) would typically be used in development/production.
*   **`.gitignore`**: Specifies files and directories to be ignored by Git (e.g., `__pycache__`, `uploads`, `output`, `.env`).
*   **`/api/`**: Contains the API specific logic and its documentation.
    *   `kyc_service.py`: Implements the core logic for the `/api/v1/verify` endpoint, likely calling functions from the `kyc_engine`.
    *   `test_api.py`: Contains tests for the API endpoints.
    *   `node_client_example.js`: Provides an example of how a Node.js client can interact with the KYC API.
    *   `README.md`: (Already read) API endpoint documentation.
*   **`/kyc_engine/`**: The core processing unit of the KYC system. It contains modules for various verification checks:
    *   `decision_making.py`: Aggregates results from various checks to make a final KYC decision (accept, deny, flag for review).
    *   `ela_check.py`: Likely performs Error Level Analysis on images to detect manipulations.
    *   `image_forensics.py`: A broader module for various image forensic techniques (e.g., detecting tampering, inconsistencies).
    *   `metadata_check.py`: Extracts and analyzes metadata from the uploaded ID image (e.g., EXIF data) for suspicious patterns.
    *   `ocr_check.py`: Performs Optical Character Recognition (OCR) on the ID image to extract text (name, DOB, ID number) and compares it with the user-submitted data.
    *   `shared.py`: Likely contains utility functions, constants, or shared logic used by multiple modules within the `kyc_engine`.
*   **`/templates/`**: Contains HTML templates, likely for a simple web interface (e.g., `index.html` could be a test/demo page for uploading documents directly to the KYC app).
*   **`/uploads/`**: Directory where uploaded ID images are temporarily stored for processing. This should be secured and cleaned regularly.
*   **`/output/`**: Directory where processing outputs or reports might be saved (e.g., images with forensic analysis overlays, OCR results). This also needs proper management.
*   **`/assets/`**: Static assets (CSS, JS, images) for the HTML templates.
*   **`/__pycache__/`**: Python bytecode cache files.
*   **`/kyc.egg-info/`**: Contains metadata related to the packaging of the `kyc` project.

## Core Functionality (`app.py` and `/kyc_engine/`)

1.  **Request Handling (`app.py`)**: The Flask app receives KYC verification requests, typically via the `/api/v1/verify` endpoint.
2.  **Data Reception**: It accepts `multipart/form-data` including user details (full name, DOB, nationality, ID number) and the ID image file.
3.  **File Storage**: The uploaded ID image is saved temporarily in the `/uploads/` directory.
4.  **KYC Processing Pipeline (`/kyc_engine/`)**: The `kyc_service.py` likely orchestrates a series of checks by calling functions from the `kyc_engine` modules:
    *   **OCR Check (`ocr_check.py`)**: Extracts text from the ID image. The extracted text is compared against the user-provided `full_name`, `dob`, and `id_number`.
    *   **Metadata Check (`metadata_check.py`)**: Analyzes the image's metadata for any red flags (e.g., signs of editing software, unusual timestamps).
    *   **Image Forensics (`image_forensics.py`, `ela_check.py`)**: Applies various techniques to the image to detect signs of digital tampering, such as:
        *   Error Level Analysis (ELA)
        *   Luminance gradient analysis
        *   Other pixel-based forgery detection methods.
5.  **Decision Making (`decision_making.py`)**: Based on the results from all the above checks, this module makes a final decision:
    *   **`accept`**: If all checks pass with high confidence.
    *   **`deny`**: If critical checks fail or strong indicators of fraud are detected.
    *   **`flag for review`**: If some checks are inconclusive or raise minor suspicions, requiring manual review.
6.  **Response Generation**: The system then formats a JSON response including the overall decision, a reason, and the status of individual checks.
7.  **Cleanup**: Temporary files in `/uploads/` and `/output/` should ideally be cleaned up after processing.

## API Endpoints

(Adapted from `kyc/api/README.md`)

### Verify KYC

Performs KYC verification checks on a submitted ID card and personal information.

*   **URL**: `/api/v1/verify`
*   **Method**: `POST`
*   **Content-Type**: `multipart/form-data`
*   **Form Parameters**:

    | Parameter     | Type   | Description                                  | Required |
    |---------------|--------|----------------------------------------------|----------|
    | `full_name`   | string | Full name of the person                      | Yes      |
    | `dob`         | string | Date of birth (format: YYYY-MM-DD or DD-MM-YYYY) | Yes      |
    | `nationality` | string | Nationality of the person                    | Yes      |
    | `id_number`   | string | ID card number                               | Yes      |
    | `id_image`    | file   | Image of the ID card (JPG, JPEG, PNG)        | Yes      |

*   **Success Response (200 OK)**:

    ```json
    {
      "status": "success",
      "verification_result": {
        "decision": "accept" | "deny" | "flag for review",
        "reason": "Explanation of the decision",
        "checks": {
          "ocr": "success" | "fail" | "flag for review",
          "metadata": "success" | "fail" | "flag for review",
          "image_integrity": "success" | "fail" | "flag for review"
        }
      }
    }
    ```

*   **Error Response (e.g., 400 Bad Request, 500 Internal Server Error)**:

    ```json
    {
      "status": "error",
      "message": "Description of the error"
    }
    ```

### Health Check

Checks if the KYC system is operational.

*   **URL**: `/api/v1/health`
*   **Method**: `GET`
*   **Success Response (200 OK)**:

    ```json
    {
      "status": "operational",
      "version": "1.0" 
    }
    ```
    (Version might be dynamically fetched or hardcoded in `app.py`)

## Running the KYC System

1.  **Clone the repository.**
2.  **Create and activate a Python virtual environment.**
3.  **Install dependencies**: `pip install -r requirements.txt`
4.  **Set up environment variables**: Create a `.env` file based on `.env_sample` and provide necessary configurations (e.g., `FLASK_APP=app.py`, `FLASK_ENV=development`, any API keys for external services if used).
5.  **Run the application**: `python run.py` or `flask run` (if `FLASK_APP` is set).

    The server will typically start on `http://localhost:5000` (or as configured).

## Integration with Main Server

The Node.js/Express backend (described in the server documentation) acts as a client to this KYC API. The `kyc/api/node_client_example.js` file provides a blueprint for this interaction.

*   When a user needs KYC verification, the main server collects their data and ID image.
*   The main server then makes a `POST` request to the `/api/v1/verify` endpoint of this KYC system.
*   The main server receives the JSON response and updates the user's KYC status in its own database and informs the user.

## Dependencies

Key Python libraries likely include:

*   Flask (or similar like FastAPI, Bottle) for the web framework.
*   Pillow (PIL Fork) or OpenCV for image processing.
*   Pytesseract or other OCR libraries.
*   Libraries for EXIF data extraction.
*   Requests (for making calls to external services, if any).

(Refer to `requirements.txt` for the complete list)

## Security and Considerations

*   **Data Privacy**: KYC data (personal information and ID images) is highly sensitive. Ensure secure handling, storage (even if temporary), and transmission (HTTPS for the API).
*   **Temporary File Management**: Ensure that files in `/uploads/` and `/output/` are securely deleted after processing to prevent data leaks.
*   **Error Handling**: Robust error handling is needed for image processing failures, OCR issues, etc.
*   **Scalability**: For high-volume KYC requests, consider deploying the KYC system with a production-grade WSGI server (like Gunicorn or uWSGI) and potentially load balancing.
*   **Engine Accuracy**: The accuracy of the `kyc_engine` modules is critical. Regular testing and updates to the detection algorithms might be necessary to combat new fraud techniques.
*   **Configuration**: Externalize all sensitive configurations (API keys, thresholds for checks) using environment variables.

This documentation provides a comprehensive guide to the KYC system. 