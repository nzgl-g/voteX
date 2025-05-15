const express = require("express");
const router = express.Router();
const multer = require("multer");
const { verifyKYC, extractKYCResult } = require("../helpers/kycService");
const User = require("../models/User");
const auth = require("../middleware/auth");
const crypto = require("crypto"); // For generating hash/signature
const fs = require("fs"); // Add this as it's used but missing
const path = require("path");

// Configure multer with more robust error handling
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Make sure the uploads directory exists
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Keep the original extension
    const ext = path.extname(file.originalname);
    cb(null, 'kyc-' + uniqueSuffix + ext);
  }
});

// More detailed file filter
const fileFilter = (req, file, cb) => {
  // Only accept images
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed. Received: " + file.mimetype), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 20 * 1024 * 1024, // 20MB size limit (increased from 10MB)
    files: 1 // Only one file at a time
  },
  fileFilter: fileFilter
});

// Helper function to format date strings (add this if missing)
function formatDateString(dateStr) {
  if (!dateStr) return "";
  // Try to format date string to YYYY-MM-DD for KYC service
  try {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  } catch (e) {
    return dateStr; // Return as-is if can't parse
  }
}

// Helper function to generate KYC signature/hash
function generateKYCSignature(userData) {
  // Create a stable hash of user's identifying information for verification
  // Don't include Date.now() which causes a new hash every time
  const dataToHash = `${userData.fullName || ''}|${userData.dateOfBirth || ''}|${userData.nationality || ''}`;
  console.log("Generating KYC signature from data:", dataToHash.replace(/\|/g, '|'));
  return crypto.createHash('sha256').update(dataToHash).digest('hex');
}

// Multer error handling middleware
function handleMulterErrors(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    console.error("Multer error:", err);
    // A Multer error occurred when uploading
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        message: "File too large. Maximum size is 10MB." 
      });
    }
    return res.status(400).json({ 
      success: false, 
      message: `Upload error: ${err.message}` 
    });
  } else if (err) {
    console.error("Non-multer error:", err);
    // An unknown error occurred
    return res.status(400).json({ 
      success: false, 
      message: err.message 
    });
  }
  // If no error, continue
  next();
}

// KYC verification endpoint
router.post("/verify", auth, (req, res, next) => {
  upload.single("idCardFile")(req, res, (err) => {
    if (err) {
      console.error("File upload error:", err);
      return res.status(400).json({ 
        success: false, 
        message: err.message || "File upload failed" 
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    // Check if file was uploaded successfully
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "No image file found in the request" 
      });
    }

    console.log("File uploaded successfully:", req.file.path);

    // Get the authenticated user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Format date if needed
    const formattedDate = formatDateString(user.dateOfBirth || "");

    console.log("Calling KYC verification service with user data:", {
      fullName: user.fullName || "",
      dateOfBirth: formattedDate,
      nationality: user.nationality || "",
      idNumber: req.body.idNumber || ""
    });

    // Call KYC service
    const result = await verifyKYC(
      {
        fullName: user.fullName || "",
        dateOfBirth: formattedDate,
        nationality: user.nationality || "",
        idNumber: req.body.idNumber || "", // From the form input
      },
      req.file.path
    );

    console.log("KYC verification completed, processing result:", JSON.stringify(result));

    // Handle verification result
    if (result.status === "success" && result.verification_result?.decision === "accept") {
      console.log("KYC verification succeeded, updating user record");
      
      // Generate a KYC signature
      const kycSignature = generateKYCSignature({
        fullName: user.fullName,
        dateOfBirth: user.dateOfBirth,
        nationality: user.nationality
      });
      
      console.log("Generated KYC signature:", kycSignature);
      
      // Check if the user already has this or another KYC signature
      if (user.kycSignature) {
        console.log("User already has a KYC signature:", user.kycSignature.substring(0, 8) + "...");
        
        // If it's the same signature, we're already verified
        if (user.kycSignature === kycSignature) {
          console.log("KYC signature is the same as existing one, user is already verified");
          return res.status(200).json({ 
            success: true, 
            message: "Identity already verified. You can vote.",
            verificationDetails: {
              decision: "accept",
              reason: "Already verified with the same identity"
            }
          });
        }
        
        // If it's a different signature, update it
        console.log("User has a different KYC signature, updating to new one");
      }
      
      // Update user record with the KYC signature
      try {
        user.kycSignature = kycSignature;
        await user.save();
        console.log("Successfully saved user with KYC signature");
      } catch (saveError) {
        console.error("Error saving user with KYC signature:", saveError);
        
        // Handle duplicate key error specifically
        if (saveError.code === 11000 && saveError.keyPattern?.kycSignature) {
          console.log("Another user already has this KYC signature");
          return res.status(409).json({
            success: false,
            message: "Another user is already verified with this identity.",
            verificationDetails: {
              decision: "deny",
              reason: "Identity already registered with another account"
            }
          });
        }
        
        // For other errors, still send a success response but log the error
        return res.status(200).json({ 
          success: true, 
          message: "Identity verification successful, but there was an issue updating your profile.",
          verificationDetails: {
            decision: "accept",
            reason: "Verification successful but user record update failed"
          }
        });
      }
      
      // Success response
      res.status(200).json({ 
        success: true, 
        message: "Identity verification successful. You can now vote.",
        verificationDetails: {
          decision: "accept",
          kycSignature: kycSignature.substring(0, 8) + '...' // Only show a part for security
        }
      });
    } else {
      console.log("KYC verification failed or was inconclusive");
      
      console.log("Raw KYC verification result:", JSON.stringify(result));
      
      // Check if we have a verification_result
      let kycResult = { decision: "unknown", reason: "" };
      
      if (result.verification_result) {
        if (typeof result.verification_result.reason === 'string') {
          // Extract from the structured format first
          kycResult = extractKYCResult(result.verification_result.reason);
        } else {
          // Use the values directly
          kycResult.decision = result.verification_result.decision || "unknown";
          kycResult.reason = result.verification_result.reason || "";
        }
      }
      
      console.log("Extracted KYC result:", kycResult);
                     
      // Verification failed response
      res.status(200).json({ 
        success: false, 
        message: "Verification failed",
        verificationDetails: {
          decision: kycResult.decision,
          reason: kycResult.reason
        }
      });
    }
  } catch (error) {
    console.error("Error in KYC verification route:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error occurred during verification. Please try again." + (error.message ? ` (${error.message})` : '')
    });
  } finally {
    // Clean up uploaded file if it still exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log("Cleaned up temporary file:", req.file.path);
      } catch (unlinkError) {
        console.error("Error removing temporary file:", unlinkError);
      }
    }
  }
});

// Check if user is already verified
router.get("/status", auth, async (req, res) => {
  try {
    console.log("Checking KYC status for user:", req.user._id);
    
    const user = await User.findById(req.user._id);
    if (!user) {
      console.log("User not found when checking KYC status");
      return res.status(404).json({ message: "User not found." });
    }

    console.log("User found, KYC signature:", user.kycSignature ? `${user.kycSignature.substring(0, 8)}...` : "Not set");
    
    const isVerified = !!user.kycSignature;

    // For debugging, include more info if in development
    const response = { 
      isVerified,
      message: isVerified ? "User is KYC verified" : "User is not KYC verified"
    };
    
    if (process.env.NODE_ENV === 'development') {
      response.debug = {
        userId: user._id.toString(),
        hasKycSignature: !!user.kycSignature,
        time: new Date().toISOString()
      };
    }

    return res.json(response);
  } catch (err) {
    console.error("Error checking KYC status:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Debug endpoint for development only - DO NOT USE IN PRODUCTION
if (process.env.NODE_ENV === 'development') {
  router.post("/debug/verify-user", auth, async (req, res) => {
    try {
      // Check if the user is an admin (for security)
      // This is just a simple check - in a real app, you'd have proper role-based access control
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
      
      console.log("Debug endpoint called to manually verify user:", req.user._id);
      
      // Generate a KYC signature
      const kycSignature = generateKYCSignature({
        fullName: user.fullName || "Debug User",
        dateOfBirth: user.dateOfBirth || new Date(),
        nationality: user.nationality || "Debug Nation"
      });
      
      // Update user record with the KYC signature
      user.kycSignature = kycSignature;
      await user.save();
      
      return res.json({ 
        success: true, 
        message: "User manually verified for testing purposes",
        userId: user._id,
        kycSignature: kycSignature.substring(0, 8) + "..."
      });
    } catch (err) {
      console.error("Error in debug verification endpoint:", err);
      return res.status(500).json({ message: "Server error", error: err.message });
    }
  });
  
  router.post("/debug/reset-verification", auth, async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
      
      console.log("Debug endpoint called to reset verification for user:", req.user._id);
      
      // Remove the KYC signature
      user.kycSignature = undefined;
      await user.save();
      
      return res.json({ 
        success: true, 
        message: "User verification reset for testing purposes",
        userId: user._id
      });
    } catch (err) {
      console.error("Error in debug reset endpoint:", err);
      return res.status(500).json({ message: "Server error", error: err.message });
    }
  });
}

module.exports = router;
