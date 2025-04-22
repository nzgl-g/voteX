const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const Session = require("../models/Sessions");
const SessionDetails = require("../models/SessionDetails");
const auth = require("../middleware/auth");

router.get("/", async (req, res) => {
  try {
    const sessions = await Session.find().populate("details");

    if (!sessions || sessions.length === 0) {
      return res.status(404).send("No sessions found");
    }

    res.send(sessions);
  } catch (err) {
    res.status(500).send("Server error");
  }
});
router.get("/my-sessions", auth, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).send("Unauthorized.");
    }

    const userId = new mongoose.Types.ObjectId(req.user._id);
    const sessions = await Session.find({ createdBy: userId });

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});
router.get("/:id", async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate({
        path: "details",
        populate: { path: "candidates", select: "_id name" }, // Populate candidates inside details
      })
      .lean();

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json(session);
  } catch (err) {
    res.status(500).send("Server error");
  }
});
router.delete("/:id", auth, async (req, res) => {
  try {
    console.log("Deleting session:", req.params.id);

    const session = await Session.findById(req.params.id);
    if (!session) {
      console.log("Session not found:", req.params.id);
      return res.status(404).send("Session not found");
    }

    // Delete session details
    const detailsDeleted = await SessionDetails.deleteMany({
      session: session._id,
    });
    console.log("Deleted session details:", detailsDeleted);

    // Delete session
    await session.deleteOne();
    console.log("Deleted session:", session);

    res.send({ message: "Session deleted successfully" });
  } catch (err) {
    console.error("Error deleting session:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
module.exports = router;
// currently using simple middleware to make testing the logic easy
// after everything is done we can add moed detailed middleware .
