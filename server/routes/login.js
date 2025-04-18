//input details
//verify details
//find user with email
//check if password is correct
//get token and put in header
import express from "express";
import User from "../models/User.js"; 
import bcrypt from "bcrypt";
import Joi from "joi";
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

  if (match) {
    const token = user.generateAuthToken();
    res.setHeader("authorization", token);
  }

  res.send(user);
});

export default router;
