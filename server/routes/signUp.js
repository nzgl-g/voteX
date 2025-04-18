import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcrypt';
import Joi from 'joi';
import userSchema from '../validation/user.js';
const router = express.Router();
router.post("/", async (req, res) => {
  const { username, email, password,role } = req.body;

  const { value, error } = userSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(400).json({ message: "User already exists." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await new User({
    username,
    email,
    role,
    password: hashedPassword,
    
  });
  await user.save();

  const token = user.generateAuthToken();
  res.setHeader("authorization", token);
  res.send(user);
});
export default router;
