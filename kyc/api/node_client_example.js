/**
 * Node.js KYC Client Example
 * 
 * This example application demonstrates how to integrate with the KYC verification
 * API from a Node.js/Express application. It provides a simple form interface
 * and processes verification requests.
 */

// Import required packages
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration constants
const PORT = process.env.PORT || 3000;
const KYC_API_URL = process.env.KYC_API_URL || 'http://localhost:5000';
const UPLOAD_DIR = 'temp_uploads';

// Initialize Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const upload = multer({ 
  dest: UPLOAD_DIR,
  limits: { fileSize: 5 * 1024 * 1024 } // Limit file size to 5MB
});

// Create upload directory if it doesn't exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Send KYC verification request to the API
 * 
 * @param {Object} userData - User identity information
 * @param {string} idImagePath - Path to the ID card image file
 * @returns {Promise<Object>} API response data
 */
async function verifyKYC(userData, idImagePath) {
  try {
    const form = new FormData();
    form.append('full_name', userData.fullName);
    form.append('dob', userData.dateOfBirth);
    form.append('nationality', userData.nationality);
    form.append('id_number', userData.idNumber);
    form.append('id_image', fs.createReadStream(idImagePath));
    
    console.log(`Sending KYC verification request to ${KYC_API_URL}/api/v1/verify`);
    
    const response = await axios.post(`${KYC_API_URL}/api/v1/verify`, form, {
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

/**
 * Format a date string from YYYY-MM-DD to DD-MM-YYYY if needed
 * 
 * @param {string} dateString - Date string to format
 * @returns {string} Formatted date string
 */
function formatDateString(dateString) {
  if (!dateString || !dateString.includes('-')) {
    return dateString;
  }
  
  const dateParts = dateString.split('-');
  if (dateParts.length === 3 && dateParts[0].length === 4) {
    return `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
  }
  
  return dateString;
}

// HTML Templates
const FORM_HTML = `
  <html>
    <head>
      <title>KYC Verification</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; }
        input { width: 100%; padding: 8px; }
        button { padding: 10px 15px; background: #4CAF50; color: white; border: none; cursor: pointer; }
      </style>
    </head>
    <body>
      <h1>KYC Verification</h1>
      <form action="/verify" method="post" enctype="multipart/form-data">
        <div class="form-group">
          <label for="fullName">Full Name:</label>
          <input type="text" id="fullName" name="fullName" required>
        </div>
        
        <div class="form-group">
          <label for="dateOfBirth">Date of Birth:</label>
          <input type="date" id="dateOfBirth" name="dateOfBirth" required>
        </div>
        
        <div class="form-group">
          <label for="nationality">Nationality:</label>
          <input type="text" id="nationality" name="nationality" required>
        </div>
        
        <div class="form-group">
          <label for="idNumber">ID Number:</label>
          <input type="text" id="idNumber" name="idNumber" required>
        </div>
        
        <div class="form-group">
          <label for="idImage">ID Card Image:</label>
          <input type="file" id="idImage" name="idImage" accept="image/*" required>
        </div>
        
        <button type="submit">Verify Identity</button>
      </form>
    </body>
  </html>
`;

// Define routes
app.get('/', (req, res) => {
  res.send(FORM_HTML);
});

app.post('/verify', upload.single('idImage'), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).send('No image file uploaded');
    }
    
    // Format date if needed
    const formattedDate = formatDateString(req.body.dateOfBirth || '');
    
    // Call KYC service
    const result = await verifyKYC({
      fullName: req.body.fullName,
      dateOfBirth: formattedDate,
      nationality: req.body.nationality,
      idNumber: req.body.idNumber
    }, req.file.path);
    
    // Clean up temporary file
    fs.unlinkSync(req.file.path);
    
    // Generate appropriate response based on verification result
    const verificationDetails = JSON.stringify({
      decision: result.verification_result.decision,
      checks: result.verification_result.checks
    }, null, 2);
    
    // Process the result
    if (result.status === 'success' && 
        result.verification_result.decision === 'accept') {
      // Verification passed - send success response
      res.send(`
        <html>
          <head>
            <title>Verification Result</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; }
              .success { color: green; }
              .details { margin-top: 20px; text-align: left; }
              pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow: auto; }
            </style>
          </head>
          <body>
            <h1 class="success">Identity Verified Successfully</h1>
            <p>Your identity has been verified and approved.</p>
            <div class="details">
              <h2>Verification Details:</h2>
              <pre>${verificationDetails}</pre>
            </div>
            <p><a href="/">Back to Form</a></p>
          </body>
        </html>
      `);
    } else {
      // Verification failed or flagged
      const isFailure = result.verification_result.decision === 'deny';
      const statusClass = isFailure ? 'fail' : 'warning';
      const statusHeader = isFailure ? 'Verification Failed' : 'Further Verification Required';
      
      res.send(`
        <html>
          <head>
            <title>Verification Result</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; }
              .fail { color: red; }
              .warning { color: orange; }
              .details { margin-top: 20px; text-align: left; }
              pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow: auto; }
            </style>
          </head>
          <body>
            <h1 class="${statusClass}">${statusHeader}</h1>
            <p>${result.verification_result.reason}</p>
            <div class="details">
              <h2>Verification Details:</h2>
              <pre>${verificationDetails}</pre>
            </div>
            <p><a href="/">Back to Form</a></p>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('Error processing verification:', error);
    res.status(500).send(`
      <html>
        <head>
          <title>Verification Error</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; }
            .error { color: red; }
          </style>
        </head>
        <body>
          <h1 class="error">Verification Service Error</h1>
          <p>There was an error processing your verification request. Please try again later.</p>
          <p><a href="/">Back to Form</a></p>
        </body>
      </html>
    `);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Node.js client example running on port ${PORT}`);
  console.log(`Using KYC API at ${KYC_API_URL}`);
}); 