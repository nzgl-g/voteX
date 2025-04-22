const express = require("express");
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const Session = require("../models/Sessions");
const User = require("../models/User");
const SessionRequest = require("../models/SessionRequest");
const SessionDetails = require("../models/SessionDetails");
const Team = require("../models/Team");
const router = express.Router();
const IsAdmin = require("../middleware/IsAdmin");
// be sure to change this into only team members can see requests when done with initial testing
router.get("/", IsAdmin, async (req, res) => {
  try {
    const requests = await SessionRequest.find().populate(
      "createdBy",
      "username email"
    );
    res.send(requests);
  } catch (err) {
    console.error("Error fetching session requests:", err);
    res.status(500).send("Server error");
  }
});
router.post("/", auth, async (req, res) => {
  try {
    console.log("Authenticated User:", req.user);
    if (!req.user || !req.user._id) {
      return res.status(401).send("Unauthorized: User not found");
    }
    const requestData = {
      ...req.body, // Spread first to get all fields
      createdBy: req.user._id, // Override `createdBy` with correct user ID
    };
    console.log("Creating session request:", requestData);
    const request = new SessionRequest(requestData);
    console.log("Before Saving - Request Object:", request); // Log the object before saving
    await request.save();

    res.status(201).send(request);
  } catch (err) {
    res.status(400).send(err.message);
  }
});
// might add a route for declining requests without using the creation route in sessions
// or make session creation logic here?

//decided to make the session directly when approving a request this way the second its approved we link the request id with the newly created session

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
    const newTeam = new Team({
      leader: request.createdBy, // Session creator is the team leader
      members: [request.createdBy], // Leader is the first member
    });
    await newTeam.save();
    // **Create the session**
    const newSession = new Session({
      name: request.name,
      description: request.description,
      type: request.type,
      voteMode: request.voteMode,
      sessionRequest: request._id,
      createdBy: request.createdBy,
      team: newTeam._id,
      available: request.visibility === "Public",
      status: "Approved",
      isApproved: true,
      visibility: request.visibility,
      secretPhrase: request.secretPhrase,
      locationRestriction: request.locationRestriction,
      resultVisibility: request.resultVisibility,
      organizationName: request.organizationName,
      banner: request.banner,
      verificationMethod: request.verificationMethod,
      candidateStep: request.candidateStep || "Nomination",
      sessionLifecycle: {
        scheduledAt: request.scheduledAt || null,
        startedAt: request.startTime,
        endedAt: request.endTime,
      },
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
    newTeam.session = newSession._id;
    newTeam.sessionName = newSession.name;
    await newTeam.save();
    // **Create session details**
    const sessionDetails = new SessionDetails({
      session: newSession._id,
      candidates: [],
      candidateRequests: [],
      options: [],
      tournamentType: request.tournamentType || null,
      bracket: {},
      maxRounds: request.maxRounds || 1,
      maxChoices: request.maxChoices || 1, // Optional, based on your notes
    });
    await sessionDetails.save();
    newSession.details = sessionDetails._id;
    await newSession.save();
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
    res.status(500).send(err.message);
  }
});
module.exports = router;

// currently using simple middleware to make testing the logic easy
// after everything is done we can add moed detailed middleware .
