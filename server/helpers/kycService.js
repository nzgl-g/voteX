const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const path = require("path");

async function verifyKYC(userData, idImagePath) {
  try {
    const form = new FormData();
    form.append("full_name", userData.fullName);
    form.append("dob", userData.dateOfBirth);
    form.append("nationality", userData.nationality);
    form.append("id_number", userData.idNumber);
    form.append("id_image", fs.createReadStream(idImagePath));

    const KYC_API_URL = process.env.KYC_API_URL; // Ensure this is defined in your .env

    console.log(
      `Sending KYC verification request to ${KYC_API_URL}/api/v1/verify`
    );

    const response = await axios.post(`${KYC_API_URL}/api/v1/verify`, form, {
      headers: {
        ...form.getHeaders(),
      },
    });

    // Clean up uploaded image file after verification
    fs.unlinkSync(idImagePath); // Ensure that the file is removed after use

    return response.data; // Return the full API response for further processing
  } catch (error) {
    console.error(
      "KYC verification error:",
      error.response?.status,
      error.response?.data || error.message
    );
    throw error; // Rethrow error to be handled by caller
  }
}

module.exports = { verifyKYC }; // Export the function for use in other parts of your app
