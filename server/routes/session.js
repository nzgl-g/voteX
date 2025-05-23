const mongoose = require("mongoose");
const { isValidObjectId } = require("mongoose");
const express = require("express");
const Session = require("../models/Sessions");
const SessionParticipant = require("../models/SessionParticipants");
const SessionEditRequest = require("../models/SessionEditRequest");
const Team = require("../models/Team");
const auth = require("../middleware/auth");
const sendNotification = require("../helpers/sendNotification");
const isTeamLeader = require("../middleware/isTeamLeader");
const router = express.Router();
require("dotenv").config();

router.get("/", auth, async (req, res) => {
  try {
    const sessions = await Session.find({ visibility: "public" })
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
      visibility: "Private",
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
router.get("/:sessionId/contract-data", async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).lean();

    if (!session) return res.status(404).json({ error: "Session not found" });

    const voteMode = session.subtype;
    const endTime = session.sessionLifecycle?.scheduledAt?.end;

    let ids = [];
    if (session.type === "poll") {
      ids = session.options?.map((opt) => opt._id) || [];
    } else if (session.type === "election") {
      ids = session.candidates?.map((cand) => cand._id) || [];
    }

    const maxChoices = session.maxChoices ?? null;

    return res.json({ ids, voteMode, endTime, maxChoices });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
router.delete("/:sessionId", auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate("team");
    if (!session) return res.status(404).send("Session not found");

    const team = session.team;
    if (!team) return res.status(400).send("No team assigned to this session");

    if (!team.leader.equals(req.user._id)) {
      return res
        .status(403)
        .send("Access denied. Not authorized as team leader");
    }
    await SessionParticipant.deleteMany({ _id: { $in: session.participants } });
    await Team.findByIdAndDelete(team._id);
    await session.deleteOne();

    res.send({ message: "Session deleted successfully" });
  } catch (err) {
    console.error("Error deleting session:", err);
    res.status(500).json({ message: "Server error", error: err.message });
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
      visibility,
      resultVisibility,
      secretPhrase,
      verificationMethod,
      candidates,
      options,
      tournamentType,
      bracket,
      maxRounds,
      maxChoices,
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
      visibility,
      resultVisibility,
      secretPhrase,
      verificationMethod,
      createdBy: creator,
      candidateRequests: [],
      ...(type === "election" && { candidates, maxChoices }),
      ...(type === "poll" && { options, maxChoices }),
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
    await session.populate([
      {
        path: "participants",
        select: "userId role",
      },
      {
        path: "createdBy",
        select: "username email wallet",
      },
    ]);

    res.status(201).json(session);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating session");
  }
});
router.patch("/:sessionId/edit-request", auth, async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const updates = req.body;
    const userId = req.user._id;

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });
    await session.populate({
      path: "team",
      select: "leader members",
    });
    if (session.team.leader.equals(userId)) {
      await session.updateOne({ $set: updates });
      return res.status(200).json({ message: "Session updated successfully" });
    }
    if (session.allowDirectEdit) {
      if (!session.team.members.some((m) => m.equals(userId))) {
        return res
          .status(403)
          .json({ error: "Only team members can propose edits" });
      }
      await session.updateOne({ $set: updates });
      return res.status(200).json({ message: "Session updated successfully" });
    }
    const editRequest = new SessionEditRequest({
      session: sessionId,
      proposedBy: userId,
      updates,
      status: "pending",
    });

    await editRequest.save();
    await sendNotification(req, {
      recipients: [session.team.leader],
      type: "session-edit-request",
      message: `${
        req.user.username || req.user._id
      } has requested to edit the session.`,
      link: `/sessions/${sessionId}`,
      targetType: "user",
    });

    res.status(201).json({
      message: "Edit request submitted.",
      editRequest,
      needsApproval: true,
    });
  } catch (err) {
    console.error("Submit edit request error:", err);
    res
      .status(500)
      .json({ error: "Failed to submit edit request", details: err.message });
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
      contractAddress: 1,
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
    await sendNotification(req, {
      recipients: [editRequest.proposedBy],
      type: "session-edit-approved",
      message: "Your edit request has been approved by the team leader.",
      link: `/sessions/${editRequest.session._id}`,
      targetType: "user",
    });

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

//dir ghir contract address f body
router.patch("/:sessionId/contract-address", async (req, res) => {
  // const authToken = req.headers["x-auth-token"];
  // if (authToken !== process.env.VOTE_UPDATE_SECRET) {
  //   return res.status(403).json({ error: "Forbidden" });
  // }
  const sessionId = req.params.sessionId;
  const { contractAddress } = req.body;
  if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
    return res.status(400).json({ message: "Invalid contract address format" });
  }
  try {
    const session = await Session.findByIdAndUpdate(
      sessionId,
      { contractAddress },
      { new: true }
    );
    if (!session) return res.status(404).json({ message: "Session not found" });

    res.status(200).json({ message: "Contract address updated", session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
//body should be like this
// {
//   "type": "candidate",
//   "counts": [
//     { "id": "68226e77908dc1b0d5a8ba0e", "totalVotes": 200 }
//   ]
// }
router.patch("/:sessionId/vote-counts", async (req, res) => {
  // const authToken = req.headers["x-auth-token"];
  // if (authToken !== process.env.VOTE_UPDATE_SECRET) {
  //   return res.status(403).json({ error: "Forbidden" });
  // }
  const { sessionId } = req.params;
  const { type, counts } = req.body;

  if (!["candidate", "option"].includes(type)) {
    return res.status(400).json({ error: "Invalid type" });
  }

  try {
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });

    if (type === "candidate") {
      counts.forEach(({ id, totalVotes }) => {
        const candidate = session.candidates.id(id);
        if (candidate) {
          console.log(candidate);
          candidate.totalVotes = totalVotes;
        }
      });
    } else if (type === "option" && session.options) {
      counts.forEach(({ id, totalVotes }) => {
        const option = session.options.id(id);
        if (option) {
          console.log(option);
          option.totalVotes = totalVotes;
        }
      });
    }
    await session.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
module.exports = router;
// currently using simple middleware to make testing the logic easy
// after everything is done we can add moed detailed middleware .
