const express = require("express");
const router = express.Router();
const multer = require("multer");
const { verifyKYC } = require("../helpers/kycService");
const User = require("../models/User");
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit to 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

router.post("/verify", upload.single("idImage"), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).send("No image file uploaded");
    }

    // Format date if needed
    const formattedDate = formatDateString(req.body.dateOfBirth || "");

    // Call KYC service
    const result = await verifyKYC(
      {
        fullName: req.body.fullName,
        dateOfBirth: formattedDate,
        nationality: req.body.nationality,
        idNumber: req.body.idNumber,
      },
      req.file.path
    );

    // Clean up temporary file
    fs.unlinkSync(req.file.path);

    // Generate appropriate response based on verification result
    const verificationDetails = JSON.stringify(
      {
        decision: result.verification_result.decision,
        checks: result.verification_result.checks,
      },
      null,
      2
    );

    // Process the result
    if (
      result.status === "success" &&
      result.verification_result.decision === "accept"
    ) {
      // Verification passed - send success response
      res.send("gg");
    } else {
      // Verification failed or flagged
      const isFailure = result.verification_result.decision === "deny";
      const statusClass = isFailure ? "fail" : "warning";
      const statusHeader = isFailure
        ? "Verification Failed"
        : "Further Verification Required";

      res.send("failed lmao");
    }
  } catch (error) {
    console.error("Error processing verification:", error);
    res.status(500).send("server error");
  }
});
// use to know if user has kyc wla lala
router.get("/status", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("kycSignature");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isVerified = !!user.kycSignature;

    return res.json({ isVerified });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;
