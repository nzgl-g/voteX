import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcrypt';
import userSchema from '../validation/user.js';
import SessionRequest from '../models/SessionRequest.js';
import IsAdmin from '../middleware/IsAdmin.js';
const router = express.Router();

// Get all signup requests
router.get("/", IsAdmin, async (req, res) => {
  try {
    const requests = await SessionRequest.find({ isArchived: false });
    res.send(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new signup request
router.post("/", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validate user input
    const { error } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email or username already exists." });
    }

    // Create signup request
    const hashedPassword = await bcrypt.hash(password, 10);
    const tempUser = await new User({
      username,
      email,
      password: hashedPassword,
      role
    });

    const request = new SessionRequest({
      user: tempUser._id,
      username: username,
      status: "pending"
    });

    await tempUser.save();
    await request.save();

    res.status(201).json({
      message: "Signup request created successfully",
      request: request
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Approve signup request
router.put("/approve/:id", IsAdmin, async (req, res) => {
  try {
    const request = await SessionRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status === "approved") {
      return res.status(400).json({ message: "Request already approved" });
    }

    request.status = "approved";
    await request.save();

    res.json({
      message: "Signup request approved successfully",
      request: request
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Reject signup request
router.put("/reject/:id", IsAdmin, async (req, res) => {
  try {
    const request = await SessionRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status === "rejected") {
      return res.status(400).json({ message: "Request already rejected" });
    }

    request.status = "rejected";
    await request.save();

    // Delete the temporary user
    await User.findByIdAndDelete(request.user);

    res.json({
      message: "Signup request rejected successfully",
      request: request
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;