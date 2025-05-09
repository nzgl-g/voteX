const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const auth = require("../middleware/auth");
const SessionParticipant = require("../models/SessionParticipants");
const { ethers } = require("ethers");
const router = express.Router();
/**  Log out */
router.post("/logout", auth, (req, res) => {
  // Invalidate token (frontend handles this mostly)
  res.status(200).send({ message: "Logged out successfully." });
});

router.get("/search", auth, async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ message: "Query is required" });

  try {
    const regex = new RegExp("^" + query, "i");

    const users = await User.find({
      $or: [{ email: regex }, { username: regex }],
    }).select("username email fullName profilePic _id");

    res.status(200).json(users);
  } catch (err) {
    console.error("User search error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/role", auth, async (req, res) => {
  const userId = req.user._id;
  console.log(userId);
  try {
    const participant = await SessionParticipant.findOne({
      userId,
      role: { $in: ["team_leader", "team_member"] },
    });

    if (!participant) {
      return res.status(200).json({ isTeam: false });
    }

    return res.status(200).json({
      isTeam: true,
      role: participant.role,
      sessionId: participant.sessionId,
    });
  } catch (err) {
    console.error("Error checking team role:", err);
    return res.status(500).json({ error: "Server error" });
  }
});
/**  Get current user profile */

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    res.status(200).send(user);
  } catch (error) {
    res.status(500).send({ error: "Server error" });
  }
});

/**  Check username availability */
router.get("/check-username/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const existingUser = await User.findOne({ username });

    return res.status(200).send({
      available: !existingUser,
      message: existingUser ? "Username already taken" : "Username available",
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

/**  Update user profile */
router.put("/me", auth, async (req, res) => {
  try {
    // Only allow specific fields to be updated
    const allowedUpdates = [
      "username",
      "fullName",
      "email",
      "gender",
      "profilePic",
    ];
    const updates = {};

    // Filter only allowed fields
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Check if username is being updated and if it's unique
    if (updates.username && updates.username !== req.user.username) {
      const existingUser = await User.findOne({ username: updates.username });
      if (existingUser) {
        return res.status(200).send({
          message: "Username already taken. Please choose another one.",
        });
      }
    }

    // Check if email is being updated and if it's unique
    if (updates.email && updates.email !== req.user.email) {
      const existingUser = await User.findOne({ email: updates.email });
      if (existingUser) {
        return res.status(200).send({
          message: "Email already in use. Please use another email address.",
        });
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).send(user);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});
router.put("/link-wallet", auth, async (req, res) => {
  try {
    const { walletAddress, chainId, networkName, balance, signature, message } =
      req.body;

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ message: "Invalid wallet address" });
    }

    if (!signature || !message) {
      return res.status(400).json({ message: "Missing signature or message" });
    }
    const existing = await User.findOne({
      "wallet.walletAddress": walletAddress,
    });
    if (existing && existing._id.toString() !== req.user._id.toString()) {
      return res
        .status(200)
        .json({ message: "Wallet already linked to another account" });
    }

    let recoveredAddress;
    try {
      recoveredAddress = ethers.utils.verifyMessage(message, signature);
    } catch (e) {
      return res.status(400).json({ message: "Invalid signature format" });
    }

    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res
        .status(401)
        .json({ message: "Signature does not match wallet address" });
    }
    const user = await User.findById(req.user._id);

    const now = Date.now();
    const cooldownPeriod = 30 * 24 * 60 * 60 * 1000;
    if (now - user.walletChangeTimestamp < cooldownPeriod) {
      return res.status(200).json({
        message: "You can only change your wallet once a month.",
      });
    }

    user.wallet = {
      walletAddress,
      chainId,
      networkName,
      balance,
      signature: signature || "",
    };
    user.walletChangeTimestamp = now;

    await user.save();

    res
      .status(200)
      .json({ message: "Wallet linked successfully", wallet: user.wallet });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error linking wallet" });
  }
});

router.get("/verify-wallet", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "wallet walletChangeTimestamp"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const wallet = user.wallet || {};
    const isLinked = !!wallet.walletAddress;

    const now = Date.now();
    const cooldownPeriod = 30 * 24 * 60 * 60 * 1000;
    const canChangeWallet = now - user.walletChangeTimestamp >= cooldownPeriod;

    res.status(200).json({
      isLinked,
      wallet: isLinked ? wallet : null,
      canChangeWallet,
    });
  } catch (err) {
    console.error("Error verifying wallet:", err);
    res.status(500).json({ message: "Server error verifying wallet" });
  }
});
/**  Delete user account */
router.delete("/me", auth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.status(200).send({ message: "Account deleted successfully." });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
