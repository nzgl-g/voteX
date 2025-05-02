const mongoose = require("mongoose");
const { isValidObjectId } = require("mongoose");
const express = require("express");
const Session = require("../models/Sessions");
const CandidateRequest = require("../models/CandidateRequest");
const SessionParticipant = require("../models/SessionParticipants");
const SessionEditRequest = require("../models/SessionEditRequest");
const Team = require("../models/Team");
const auth = require("../middleware/auth");
const isTeamLeader = require("../middleware/isTeamLeader");
const router = express.Router();
router.get("/", async (req, res) => {
  try {
    const sessions = await Session.find({})
      .populate("team")
      .populate("createdBy")
      .exec();

    res.status(200).json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch sessions");
  }
});

router.get("/my-sessions", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(userId);
    const sessions = await Session.find({ createdBy: userId })
      .populate("team")
      .populate("createdBy", "username email")
      .populate({
        path: "participants",
        select: "userId",
      })
      .populate({
        path: "assignedReviewer",
        select: "username",
      })
      .exec();

    res.status(200).json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch user sessions");
  }
});

router.get("/my-sessions-as-member", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const participantIn = await SessionParticipant.find({
      userId: userId,
      role: "team_member",
    });

    const sessionIds = participantIn.map((par) => par.sessionId);

    const sessions = await Session.find({
      _id: { $in: sessionIds },
    }).populate("createdBy team");

    res.status(200).json({ sessions });
  } catch (error) {
    console.error("Error fetching team sessions:", error);
    res.status(500).json({ error: "Failed to fetch team sessions" });
  }
});
router.get("/check-secret-phrase", auth, async (req, res) => {
  const { phrase } = req.query;

  if (!phrase) return res.status(400).json({ message: "Phrase is required" });

  const exists = await Session.exists({ secretPhrase: phrase });
  return res.json({ available: !exists });
});
router.get("/by-phrase/:phrase", auth, async (req, res) => {
  try {
    const phrase = req.params.phrase;
    if (!phrase) {
      return res.status(400).json({ message: "Secret phrase is required" });
    }
    const session = await Session.findOne({
      secretPhrase: phrase,
      accessLevel: "Private",
      securityMethod: "Secret Phrase",
    });

    if (!session) {
      return res
        .status(404)
        .json({ message: "Session not found or invalid phrase" });
    }
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/:sessionId", auth, async (req, res) => {
  try {
    const { fields } = req.query;
    if (!isValidObjectId(req.params.sessionId)) {
      return res.status(400).json({ error: "Invalid session ID" });
    }
    const session = await Session.findById(req.params.sessionId)
      .populate("team")
      .populate("createdBy", "username email")
      .populate({
        path: "participants",
        select: "userId",
      })
      .populate("assignedReviewer", "username")
      .exec();
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    if (fields) {
      const selectedFields = fields.split(",");
      const filteredSession = {};

      selectedFields.forEach((field) => {
        if (session[field] !== undefined) {
          filteredSession[field] = session[field];
        }
      });

      return res.status(200).json(filteredSession);
    }
    res.status(200).json(session);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to fetch session", error: err.message });
  }
});
router.delete("/:sessionId", auth, async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    
    if (!isValidObjectId(sessionId)) {
      return res.status(400).json({ error: "Invalid session ID format" });
    }
    
    const session = await Session.findById(sessionId).populate("team");
    if (!session) return res.status(404).json({ error: "Session not found" });

    const team = session.team;
    if (!team) return res.status(400).json({ error: "No team assigned to this session" });

    if (!team.leader.equals(req.user._id)) {
      return res
        .status(403)
        .json({ error: "Access denied. Not authorized as team leader" });
    }
    
    // Delete all participants
    await SessionParticipant.deleteMany({ sessionId });
    
    // Delete team
    await Team.findByIdAndDelete(team._id);
    
    // Delete session
    await session.deleteOne();

    res.status(200).json({ message: "Session deleted successfully" });
  } catch (err) {
    console.error("Error deleting session:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const {
      name,
      description,
      organizationName,
      banner,
      type,
      subtype,
      subscription,
      sessionLifecycle,
      securityMethod,
      accessLevel,
      secretPhrase,
      verificationMethod,
      candidates,
      options,
      tournamentType,
      bracket,
      maxRounds,
    } = req.body;
    if (secretPhrase) {
      const existingSession = await Session.findOne({ secretPhrase });
      if (existingSession) {
        return res
          .status(400)
          .json({ message: "This secret phrase is already in use." });
      }
    }
    const creator = req.user._id;
    let SessionModel = Session;
    if (type === "election") SessionModel = Session.discriminators.Election;
    else if (type === "poll") SessionModel = Session.discriminators.Poll;
    else if (type === "tournament")
      SessionModel = Session.discriminators.Tournament;

    const session = new SessionModel({
      name,
      description,
      organizationName,
      banner,
      type,
      subtype,
      subscription,
      sessionLifecycle,
      securityMethod,
      accessLevel,
      secretPhrase,
      verificationMethod,
      createdBy: creator,
      candidateRequests: [],
      ...(type === "election" && { candidates }),
      ...(type === "poll" && { options }),
      ...(type === "tournament" && { tournamentType, bracket, maxRounds }),
    });

    await session.save();
    const team = new Team({
      session: session._id,
      sessionName: session.name,
      leader: creator,
      members: [],
    });

    const leaderParticipant = new SessionParticipant({
      sessionId: session._id,
      userId: creator,
      role: "team_leader",
    });
    await leaderParticipant.save();

    const candidateParticipants = [];
    if (candidates && candidates.length > 0) {
      for (const userId of candidates) {
        const participant = new SessionParticipant({
          sessionId: session._id,
          userId,
          role: "candidate",
        });
        await participant.save();
        candidateParticipants.push(participant._id);
      }
    }
    session.participants = [leaderParticipant._id, ...candidateParticipants];
    const savedTeam = await team.save();
    session.team = savedTeam._id;
    await session.save();
    await session.populate({
      path: "participants",
      select: "userId role", // Only fetch userId and role to avoid unnecessary data
    });

    res.status(201).json(session);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating session");
  }
});
router.patch("/:sessionId/edit-request", auth, async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    
    if (!isValidObjectId(sessionId)) {
      return res.status(400).json({ error: "Invalid session ID format" });
    }
    
    console.log(`Updating session ${sessionId} with data:`, JSON.stringify(req.body, null, 2));
    
    const session = await Session.findById(sessionId).populate("team");
    if (!session) return res.status(404).json({ error: "Session not found" });

    const team = session.team;
    if (!team) return res.status(400).json({ error: "No team assigned to this session" });

    // Check if user is authorized to update this session
    if (!team.leader.equals(req.user._id)) {
      return res
        .status(403)
        .json({ error: "Access denied. Not authorized as team leader" });
    }
    
    // Get the data to update
    const updateData = req.body;
    
    // Check if session has started - limit ONLY specific changes if it has
    const hasSessionStarted = session.sessionLifecycle && 
                            session.sessionLifecycle.startedAt && 
                            new Date(session.sessionLifecycle.startedAt) <= new Date();
                            
    if (hasSessionStarted) {
      console.log("Session already started, restricting only specific fields");
      
      // Prevent changing candidates or options after session has started
      if (updateData.options) {
        console.log("Removing options from update - session is active");
        delete updateData.options;
      }
      
      if (updateData.candidates) {
        console.log("Removing candidates from update - session is active");
        delete updateData.candidates;
      }
      
      // Don't allow changing start date after session has started
      if (updateData.sessionLifecycle && updateData.sessionLifecycle.startedAt) {
        console.log("Removing startedAt from update - session is active");
        delete updateData.sessionLifecycle.startedAt;
      }
      
      // All other fields can be edited even if session has started
    }
    
    console.log("Applying updates:", JSON.stringify(updateData, null, 2));
    
    // Update the session
    try {
      const updatedSession = await Session.findByIdAndUpdate(
        sessionId, 
        updateData, 
        { new: true, runValidators: true }
      );
      
      // Populate related fields
      await updatedSession.populate("team");
      await updatedSession.populate("createdBy", "username email");
      
      console.log("Session updated successfully");
      return res.json(updatedSession);
    } catch (updateError) {
      console.error("Error during session update:", updateError);
      return res.status(400).json({ 
        error: "Invalid update data", 
        details: updateError.message 
      });
    }
  } catch (error) {
    console.error("Error updating session:", error);
    return res.status(500).json({ error: "Server error. Unable to update session" });
  }
});

router.patch("/edit-requests/:requestId/approve", auth, async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const userId = req.user._id;

    const editRequest = await SessionEditRequest.findById(requestId).populate(
      "session"
    );
    if (!editRequest || editRequest.status !== "pending") {
      return res
        .status(404)
        .json({ error: "Valid edit request not found or not pending" });
    }

    const team = await Team.findOne({ session: editRequest.session._id });
    if (!team || !team.leader.equals(userId)) {
      return res
        .status(403)
        .json({ error: "Only the team leader can approve edits" });
    }

    const updates = editRequest.updates;

    const allowedUpdates = {
      name: 1,
      description: 1,
      organizationName: 1,
      banner: 1,
      "sessionLifecycle.scheduledAt.start": 1,
      "sessionLifecycle.scheduledAt.end": 1,
      securityMethod: 1,
      secretPhrase: 1,
    };

    const filteredUpdates = Object.keys(updates).reduce((acc, key) => {
      if (allowedUpdates[key] || key.startsWith("sessionLifecycle.")) {
        acc[key] = updates[key];
      }
      return acc;
    }, {});

    const updatedSession = await Session.findByIdAndUpdate(
      editRequest.session._id,
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    );

    editRequest.status = "approved";
    await editRequest.save();

    res
      .status(200)
      .json({ message: "Edit approved and applied", updatedSession });
  } catch (err) {
    console.error("Approve edit error:", err);
    res
      .status(500)
      .json({ error: "Failed to approve edit", details: err.message });
  }
});

module.exports = router;
// currently using simple middleware to make testing the logic easy
// after everything is done we can add moed detailed middleware .
