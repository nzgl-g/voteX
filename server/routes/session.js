const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const Session = require("../models/sessions");
const SessionDetails = require("../models/SessionDetails");
const Team = require("../models/Team");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { IsAdmin } = require("../middleware/auth");

// GET all sessions
router.get("/", async (req, res) => {
  try {
    const sessions = await Session.find()
      .populate("details")
      .populate("candidates", "fullName partyName totalVotes")
      .populate("options", "name description totalVotes");

    if (!sessions || sessions.length === 0) {
      return res.status(404).send("No sessions found");
    }

    res.send(sessions);
  } catch (err) {
    console.error("Error fetching sessions:", err);
    res.status(500).send("Server error");
  }
});

// GET sessions created by the authenticated user
router.get("/my-sessions", auth, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).send("Unauthorized.");
    }

    const userId = new mongoose.Types.ObjectId(req.user._id);
    const sessions = await Session.find({ createdBy: userId })
      .populate("candidates", "fullName partyName totalVotes")
      .populate("options", "name description totalVotes");

    res.json(sessions);
  } catch (error) {
    console.error("Error fetching user sessions:", error);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

// GET a specific session by ID
router.get("/:id", async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate("details")
      .populate("candidates", "fullName partyName totalVotes status requiresReview")
      .populate("options", "name description totalVotes")
      .populate("createdBy", "name email")
      .populate("team")
      .lean();

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json(session);
  } catch (err) {
    console.error("Error fetching session:", err);
    res.status(500).send("Server error");
  }
});

// POST create a new session directly
router.post("/", auth, async (req, res) => {
  try {
    // Create a new team if not provided
    let teamId = req.body.team;
    if (!teamId) {
      const newTeam = new Team({
        leader: req.user._id,
        members: [req.user._id],
        sessionName: req.body.name
      });
      await newTeam.save();
      teamId = newTeam._id;
    }

    // Extract session lifecycle data
    const sessionLifecycle = {
      createdAt: req.body.sessionLifecycle?.createdAt || new Date(),
      scheduledAt: {
        start: req.body.sessionLifecycle?.scheduledAt?.start || null,
        end: req.body.sessionLifecycle?.scheduledAt?.end || null
      },
      startedAt: req.body.sessionLifecycle?.startedAt || null,
      endedAt: req.body.sessionLifecycle?.endedAt || null,
    };

    // Create the session
    const session = new Session({
      ...req.body,
      createdBy: req.user._id,
      team: teamId,
      sessionLifecycle: sessionLifecycle,
    });

    await session.save();

    // Create session details if not already included in the request
    if (!req.body.details) {
      const sessionDetails = new SessionDetails({
        session: session._id,
        candidates: [],
        candidateRequests: [],
        options: [],
        tournamentType: req.body.tournamentType || null,
        bracket: {},
        maxRounds: req.body.maxRounds || 1,
        maxChoices: req.body.maxChoices || 1,
      });
      await sessionDetails.save();

      // Link session to details
      session.details = sessionDetails._id;
      await session.save();
    }

    // Update team with session info if it was just created
    if (!req.body.team) {
      const team = await Team.findById(teamId);
      team.session = session._id;
      team.sessionName = session.name;
      await team.save();
    }

    res.status(201).json(session);
  } catch (err) {
    console.error("Error creating session:", err);
    res.status(400).json({ message: err.message });
  }
});

// PUT update a session
router.put("/:id", auth, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await Session.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    
    // Check if user is authorized to update this session
    if (session.createdBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to update this session" });
    }

    // Handle session lifecycle updates properly
    if (req.body.sessionLifecycle) {
      req.body.sessionLifecycle = {
        ...session.sessionLifecycle,
        ...req.body.sessionLifecycle,
        scheduledAt: {
          start: req.body.sessionLifecycle.scheduledAt?.start || session.sessionLifecycle.scheduledAt?.start,
          end: req.body.sessionLifecycle.scheduledAt?.end || session.sessionLifecycle.scheduledAt?.end
        }
      };
    }

    // Update the session with the new data
    const updatedSession = await Session.findByIdAndUpdate(
      sessionId,
      { $set: req.body },
      { new: true, runValidators: true }
    )
    .populate("details")
    .populate("candidates", "fullName partyName totalVotes status")
    .populate("options", "name description totalVotes");

    res.json(updatedSession);
  } catch (err) {
    console.error("Error updating session:", err);
    res.status(400).json({ message: err.message });
  }
});

// PATCH update session status
router.patch("/:id/status", IsAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    session.status = status;
    if (status === "Approved") {
      session.isApproved = true;
    }

    await session.save();
    res.json({ message: "Session status updated", session });
  } catch (err) {
    console.error("Error updating session status:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// DELETE a session
router.delete("/:id", auth, async (req, res) => {
  try {
    console.log("Deleting session:", req.params.id);

    const session = await Session.findById(req.params.id);
    if (!session) {
      console.log("Session not found:", req.params.id);
      return res.status(404).send("Session not found");
    }

    // Check if user is authorized to delete this session
    if (session.createdBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this session" });
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

// POST add a candidate to a session
router.post("/:id/candidates", auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check if user is authorized to add candidates
    if (session.createdBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to add candidates to this session" });
    }

    // Add the new candidate
    session.candidates.push({
      fullName: req.body.fullName,
      partyName: req.body.partyName,
      status: req.body.status || "Pending",
      assignedReviewer: req.body.assignedReviewer || null,
      requiresReview: req.body.requiresReview || false
    });

    await session.save();
    res.status(201).json(session.candidates[session.candidates.length - 1]);
  } catch (err) {
    console.error("Error adding candidate:", err);
    res.status(400).json({ message: err.message });
  }
});

// POST add an option to a session
router.post("/:id/options", auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check if user is authorized to add options
    if (session.createdBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to add options to this session" });
    }

    // Add the new option
    session.options.push({
      name: req.body.name,
      description: req.body.description || null
    });

    await session.save();
    res.status(201).json(session.options[session.options.length - 1]);
  } catch (err) {
    console.error("Error adding option:", err);
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
// currently using simple middleware to make testing the logic easy
// after everything is done we can add more detailed middleware.
