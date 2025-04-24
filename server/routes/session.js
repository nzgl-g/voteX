const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const Session = require("../models/Sessions");
const Team = require("../models/Team");
const auth = require("../middleware/auth");

router.get("/", async (req, res) => {
  try {
    const sessions = await Session.find({})
      .populate("team") // Populates the team object
      .populate("createdBy") // Optional: Populate creator details
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
      .populate("createdBy")
      .exec();

    res.status(200).json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch user sessions");
  }
});
router.get("/:id", async (req, res) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate("team")
      .populate("createdBy")
      .exec();

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.status(200).json(session);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch session");
  }
});
// router.delete("/:id", auth, async (req, res) => {
//   try {
//     console.log("Deleting session:", req.params.id);

//     const session = await Session.findById(req.params.id);
//     if (!session) {
//       console.log("Session not found:", req.params.id);
//       return res.status(404).send("Session not found");
//     }

//     // Delete session details
//     const detailsDeleted = await SessionDetails.deleteMany({
//       session: session._id,
//     });
//     console.log("Deleted session details:", detailsDeleted);

//     // Delete session
//     await session.deleteOne();
//     console.log("Deleted session:", session);

//     res.send({ message: "Session deleted successfully" });
//   } catch (err) {
//     console.error("Error deleting session:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// });

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
      verificationMethod,
      candidates,
      options,
      tournamentType,
      bracket,
      maxRounds,
    } = req.body;
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
      members: [creator],
    });
    const savedTeam = await team.save();
    session.team = savedTeam._id;
    await session.save();

    res.status(201).json(session);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating session");
  }
});

module.exports = router;
// currently using simple middleware to make testing the logic easy
// after everything is done we can add moed detailed middleware .
