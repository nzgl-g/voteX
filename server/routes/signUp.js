const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const crypto = require("crypto");
const userSchema = require("../validation/user");

const router = express.Router();
router.post("/", async (req, res) => {
  const { value, error } = userSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const {
    username,
    email,
    password,
    fullName,
    gender,
    nationality,
    dateOfBirth,
  } = req.body;

  // Check if email already exists
  const emailExists = await User.findOne({ email });
  if (emailExists) {
    return res.status(400).json({ message: "Email already in use." });
  }

  // Check if username already exists
  const usernameExists = await User.findOne({ username });
  if (usernameExists) {
    return res.status(400).json({ message: "Username already taken." });
  }

  // === Generate identity hash ===
  const identityString = `${fullName.trim().toLowerCase()}|${new Date(
    dateOfBirth
  ).toISOString()}|${nationality.trim().toLowerCase()}`;
  const kycSignature = crypto
    .createHash("sha256")
    .update(identityString)
    .digest("hex");

  // Check for duplicate identity
  const existingSignature = await User.findOne({ kycSignature });
  if (existingSignature) {
    return res
      .status(400)
      .json({ message: "User with this identity already exists." });
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = new User({
    username,
    email,
    password: hashedPassword,
    fullName: fullName || "",
    gender,
    nationality,
    dateOfBirth,
  });

  await user.save();

  const token = user.generateAuthToken();

  res.json({ user, token });
});
module.exports = router;
