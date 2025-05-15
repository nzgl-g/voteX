const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const path = require("path");

async function verifyKYC(userData, idImagePath) {
  try {
    console.log("Creating form data for KYC verification with user data:", 
      JSON.stringify({
        fullName: userData.fullName,
        dateOfBirth: userData.dateOfBirth,
        nationality: userData.nationality,
        idNumber: userData.idNumber,
        // Don't log the image path for security
      })
    );

    // Create a new form with the user data
    const form = new FormData();
    
    // Append the user data to the form exactly as the KYC API expects
    form.append("full_name", userData.fullName || "");
    form.append("dob", userData.dateOfBirth || "");
    form.append("nationality", userData.nationality || "");
    form.append("id_number", userData.idNumber || "");
    
    // Make sure the file exists before creating a read stream
    if (!fs.existsSync(idImagePath)) {
      throw new Error(`ID image file not found at: ${idImagePath}`);
    }
    
    // Append the ID image file with the expected field name 'id_image'
    form.append("id_image", fs.createReadStream(idImagePath));

    // Use hardcoded URL if environment variable is not set
    const KYC_API_URL = process.env.KYC_API_URL || "http://127.0.0.1:80";
    const apiEndpoint = `${KYC_API_URL}/api/v1/verify`;

    console.log(`Sending KYC verification request to ${apiEndpoint}`);

    // Send the request with appropriate headers from the form
    const response = await axios.post(apiEndpoint, form, {
      headers: {
        ...form.getHeaders(),
        // Add any other headers that might be required
      },
      // Add a longer timeout as image processing might take time
      timeout: 10000000,
      // Add maxContentLength and maxBodyLength to handle larger files
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    console.log("KYC API response received:", JSON.stringify(response.data, null, 2));

    // Clean up uploaded image file after verification
    try {
      if (fs.existsSync(idImagePath)) {
        fs.unlinkSync(idImagePath);
        console.log(`Cleaned up temporary file: ${idImagePath}`);
      }
    } catch (cleanupError) {
      console.error("Error cleaning up temporary file:", cleanupError);
      // Continue despite cleanup error
    }
    
    // Extract decision and reason from the response
    let kycResult = { decision: "unknown", reason: "" };
    
    // If the response has a standard format
    if (response.data && response.data.verification_result) {
      const verificationResult = response.data.verification_result;
      
      if (typeof verificationResult === 'string') {
        // If it's a string, try to extract JSON from it
        kycResult = extractKYCResult(verificationResult);
      } else if (typeof verificationResult === 'object') {
        // If it's already an object, extract decision and reason directly
        kycResult.decision = verificationResult.decision || "unknown";
        kycResult.reason = verificationResult.reason || "";
      }
    } else if (response.data && response.data.status) {
      // If using status format, map "success" to "accept" and other values to "deny"
      kycResult.decision = response.data.status === "success" ? "accept" : "deny";
      kycResult.reason = response.data.message || "";
    }
    
    console.log("Final KYC result:", kycResult);
    
    // Return a consistent format that maps directly to what the frontend expects
    return {
      status: kycResult.decision === "accept" ? "success" : "error",
      verification_result: {
        decision: kycResult.decision,
        reason: kycResult.reason
      }
    };
  } catch (error) {
    console.error("KYC verification error:", error.message);
    // Log more details about the error
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
    } else if (error.request) {
      console.error("No response received:", error.request);
    }
    
    // Return a failure response that matches our expected structure
    return {
      status: "error",
      verification_result: {
        decision: "deny",
        reason: error.message || "An error occurred during the verification process."
      }
    };
  }
}

// Function to extract decision and reason from response
function extractKYCResult(responseText) {
  // Default result
  let result = { decision: "unknown", reason: "" };
  
  // If responseText is not a string, return defaults
  if (typeof responseText !== 'string') {
    return result;
  }
  
  console.log("Trying to extract KYC result from:", responseText);
  
  // Case 1: Try to parse as JSON directly, assuming it's a clean JSON string
  try {
    if (responseText.trim().startsWith('{') && responseText.trim().endsWith('}')) {
      const parsedObj = JSON.parse(responseText);
      if (parsedObj.decision || parsedObj.reason) {
        console.log("Successfully parsed as direct JSON");
        return {
          decision: parsedObj.decision || "unknown",
          reason: parsedObj.reason || ""
        };
      }
    }
  } catch (e) {
    console.log("Not a direct JSON string, continuing to other formats");
  }
  
  // Case 2: Handle the specific format ```json { "decision": "X", "reason": "Y" } ```
  if (responseText.includes('```json') && responseText.includes('```')) {
    try {
      // Extract everything between the backticks
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        const jsonStr = jsonMatch[1].trim();
        const parsedObj = JSON.parse(jsonStr);
        console.log("Successfully parsed from code block format");
        return {
          decision: parsedObj.decision || "unknown",
          reason: parsedObj.reason || ""
        };
      }
    } catch (e) {
      console.log("Failed to parse from code block format:", e.message);
    }
  }
  
  // Case 3: If it contains JSON-like structure but with other text, try to extract with regex
  if (responseText.includes('"decision"') && responseText.includes('"reason"')) {
    try {
      const decisionMatch = responseText.match(/"decision"\s*:\s*"([^"]+)"/);
      const reasonMatch = responseText.match(/"reason"\s*:\s*"([^"]+)"/);
      
      if (decisionMatch && decisionMatch[1]) {
        result.decision = decisionMatch[1];
      }
      
      if (reasonMatch && reasonMatch[1]) {
        result.reason = reasonMatch[1];
      }
      
      if (result.decision !== "unknown" || result.reason !== "") {
        console.log("Successfully extracted using regex");
        return result;
      }
    } catch (e) {
      console.log("Failed to extract with regex:", e.message);
    }
  }
  
  // Case 4: If decision is not found but we have text, use it as the reason
  if (responseText.trim() !== "") {
    result.reason = responseText;
  }
  
  return result;
}

module.exports = { verifyKYC, extractKYCResult };


