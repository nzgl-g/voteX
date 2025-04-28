const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const userSchema = require("../validation/user");
const router = express.Router();
router.post("/", async (req, res) => {
  const { value, error } = userSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { username, email, password, fullName, gender } = req.body;
  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(400).json({ message: "User already exists." });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const user = new User({
    username,
    email,
    password: hashedPassword,
    fullName: fullName || "",
    gender,
  });
  await user.save();

  const token = user.generateAuthToken();

  res.json({ user, token });
});
module.exports = router;
