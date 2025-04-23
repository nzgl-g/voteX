const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const { IsAdmin } = require("../middleware/auth");
const SessionRequest = require("../models/SessionRequest");
const Session = require("../models/sessions");
const SessionDetails = require("../models/SessionDetails");
const Team = require("../models/Team");
const User = require("../models/User");

// GET all session requests
router.get("/", async (req, res) => {
  try {
    const sessionRequests = await SessionRequest.find();
    res.send(sessionRequests);
  } catch (err) {
    console.error("Error fetching session requests:", err);
    res.status(500).send(err.message);
  }
});

// POST create a new session request
router.post("/", async (req, res) => {
  try {
    const sessionRequest = new SessionRequest(req.body);
    // Set the creator to the current user if not specified
    if (!sessionRequest.createdBy && req.user) {
      sessionRequest.createdBy = req.user._id;
    }
    await sessionRequest.save();
    res.status(201).send(sessionRequest);
  } catch (err) {
    console.error("Error creating session request:", err);
    res.status(400).send(err.message);
  }
});

// Approve a session request and create the actual session
router.put("/approve", IsAdmin, async (req, res) => {
  try {
    const requestId = req.body.id;
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).send("Invalid request ID");
    }

    const request = await SessionRequest.findById(requestId);
    if (!request) {
      return res.status(404).send("Session request not found");
    }

    if (request.status === "approved") {
      return res.status(400).send("Session request already approved");
    }
    console.log("Created by:", request.createdBy);

    // Create a new team
    const newTeam = new Team({
      leader: request.createdBy, // Session creator is the team leader
      members: [request.createdBy], // Leader is the first member
    });
    await newTeam.save();

    // Extract session lifecycle data properly with the updated structure
    const sessionLifecycle = {
      createdAt: request.sessionLifecycle?.createdAt || new Date(),
      scheduledAt: {
        start: request.sessionLifecycle?.scheduledAt?.start || null,
        end: request.sessionLifecycle?.scheduledAt?.end || null
      },
      startedAt: request.sessionLifecycle?.startedAt || null,
      endedAt: request.sessionLifecycle?.endedAt || null,
    };

    // **Create the session**
    const newSession = new Session({
      // Basic information
      name: request.name,
      description: request.description,
      organizationName: request.organizationName,
      banner: request.banner,

      // Session type and voting mode
      type: request.type,
      voteMode: request.voteMode,
      tournamentType: request.tournamentType,

      // References
      sessionRequest: request._id,
      createdBy: request.createdBy,
      team: newTeam._id,

      // Status
      available: request.visibility === "Public",
      status: "Approved",
      isApproved: true,

      // Access control
      visibility: request.visibility,
      securityMethod: request.securityMethod,
      secretPhrase: request.secretPhrase,
      locationRestriction: request.locationRestriction,

      // Results display
      resultVisibility: request.resultVisibility,

      // Verification
      verificationMethod: request.verificationMethod,
      candidateStep: request.candidateStep || "Nomination",

      // Session lifecycle
      sessionLifecycle: sessionLifecycle,

      // Subscription
      subscription: {
        id: request.subscription?.id || "",
        name: request.subscription?.name || "free",
        price: request.subscription?.price || 0,
        voterLimit: request.subscription?.voterLimit || null,
        features: request.subscription?.features || [],
        isRecommended: request.subscription?.isRecommended || false,
      },
    });
    await newSession.save();

    // Update team with session info
    newTeam.session = newSession._id;
    newTeam.sessionName = newSession.name;
    await newTeam.save();

    // **Create session details**
    const sessionDetails = new SessionDetails({
      session: newSession._id,

      // Transfer candidates from request if they exist
      candidates: request.candidates?.length ?
          request.candidates.map(candidate => ({
            fullName: candidate.fullName,
            status: candidate.status || "Pending",
            assignedReviewer: candidate.assignedReviewer,
            partyName: candidate.partyName,
            totalVotes: candidate.totalVotes || 0,
            requiresReview: candidate.requiresReview || false,
            sessionId: newSession._id
          })) : [],

      candidateRequests: [],

      // Transfer options from request if they exist
      options: request.options?.length ?
          request.options.map(option => ({
            name: option.name,
            description: option.description || null,
            totalVotes: option.totalVotes || 0,
            sessionId: newSession._id
          })) : [],

      tournamentType: request.tournamentType || null,
      bracket: {},
      maxRounds: request.maxRounds || 1,
      maxChoices: request.maxChoices || 1,
    });
    await sessionDetails.save();

    // Link session to details
    newSession.details = sessionDetails._id;
    await newSession.save();

    // Update user role if needed
    const user = await User.findById(request.createdBy);
    if (user && user.role !== "team_leader") {
      user.role = "team_leader";
      await user.save();
    }

    // **Update the request status**
    request.status = "approved";
    await request.save();

    res.send({
      message: "Session approved, team created",
      session: newSession,
      team: newTeam,
    });
  } catch (err) {
    console.error("Error approving session request:", err);
    res.status(500).send(err.message);
  }
});

module.exports = router;