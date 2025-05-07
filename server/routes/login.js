const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const router = express.Router();
router.post("/", async (req, res) => {
  const { value, error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "User details wrong" });
  }
  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    return res.status(400).json({ message: "Invalid password" });
  }
  const token = user.generateAuthToken();
  res.json({ token, user: { id: user._id, email: user.email } });
});

module.exports = router;
