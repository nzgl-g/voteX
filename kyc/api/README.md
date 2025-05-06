# KYC System API Documentation

This document describes the API for the KYC (Know Your Customer) verification system, designed to be integrated with a Node.js/Express backend.

## API Endpoints

### Verify KYC

Performs KYC verification checks on a submitted ID card and personal information.

**URL**: `/api/v1/verify`

**Method**: `POST`

**Content-Type**: `multipart/form-data`

**Form Parameters**:

| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `full_name` | string | Full name of the person | Yes |
| `dob` | string | Date of birth (format: YYYY-MM-DD or DD-MM-YYYY) | Yes |
| `nationality` | string | Nationality of the person | Yes |
| `id_number` | string | ID card number | Yes |
| `id_image` | file | Image of the ID card (JPG, JPEG, PNG) | Yes |

**Response**:

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

**Error Response**:

```json
{
  "status": "error",
  "message": "Description of the error"
}
```

### Health Check

Check if the KYC system is operational.

**URL**: `/api/v1/health`

**Method**: `GET`

**Response**:

```json
{
  "status": "operational",
  "version": "1.0"
}
```

## Integration with Node.js/Express

### Sample Integration Code

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function verifyKYC(userData, idImagePath) {
  try {
    const form = new FormData();
    form.append('full_name', userData.fullName);
    form.append('dob', userData.dateOfBirth);
    form.append('nationality', userData.nationality);
    form.append('id_number', userData.idNumber);
    form.append('id_image', fs.createReadStream(idImagePath));
    
    const response = await axios.post('http://your-kyc-api-host:5000/api/v1/verify', form, {
      headers: {
        ...form.getHeaders(),
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('KYC verification error:', error.response?.data || error.message);
    throw error;
  }
}

// Example Express route handler
app.post('/verify-identity', upload.single('idImage'), async (req, res) => {
  try {
    const result = await verifyKYC({
      fullName: req.body.fullName,
      dateOfBirth: req.body.dateOfBirth,
      nationality: req.body.nationality,
      idNumber: req.body.idNumber
    }, req.file.path);
    
    // Process the result
    if (result.status === 'success' && 
        result.verification_result.decision === 'accept') {
      // Verification passed
      res.json({ 
        success: true, 
        message: 'Identity verified successfully' 
      });
    } else {
      // Verification failed or flagged
      res.json({ 
        success: false, 
        message: result.verification_result.reason,
        details: result.verification_result.checks
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Verification service error' 
    });
  }
});
``` 