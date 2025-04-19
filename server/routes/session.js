import mongoose from 'mongoose';
import express from 'express';
const router = express.Router();
import Session from '../models/Sessions.js';
import Request from '../models/SessionRequest.js';
import auth from '../middleware/auth.js';
import Joi from 'joi';
import sessionSchema from '../validation/session.js';
import ElectionDetails from '../models/ElectionDetails.js';
import ApprovalDetails from '../models/ApprovalDetails.js';
import PollDetails from '../models/PollDetails.js';
import TournamentDetails from '../models/TournamentDetails.js';
import RankedDetails from '../models/RankedDetails.js';
import IsAdmin from '../middleware/IsAdmin.js';

router.get("/", async (req, res) => {
  const sessions = await Session.find();
  if (!sessions) {
    res.send("error");
  }
  res.send(sessions);
});
router.get("/:id", async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) {
    res.send("session not found");
  }
  res.send(session);
});

router.post("/", IsAdmin, async (req, res) => {
  const requestId = new mongoose.Types.ObjectId(req.body.requestId);
  const sessionRequest = await Request.findById(requestId);
  
  if (!sessionRequest) {
    return res.status(404).send("Session request not found");
  }
  if (sessionRequest.status !== "approved") {
    return res.status(404).send("Session request not approved");
  }

  let details;
  const { sessionType, options, candidates } = sessionRequest;

  if (sessionType === "election") {
    details = new ElectionDetails({
      candidates: candidates || [],
    });
  } else if (sessionType === "approval") {
    details = new ApprovalDetails({
      options: options || [],
    });
  } else if (sessionType === "poll") {
    details = new PollDetails({
      options: options || [],
    });
  } else if (sessionType === "tournament") {
    details = new TournamentDetails({
      candidates: candidates || [],
    });
  } else if (sessionType === "ranked") {
    details = new RankedDetails({
      options: options || [],
    });
  } else {
    return res.status(400).send("Invalid session type");
  }

  await details.save();

  const session = new Session({
    name: sessionRequest.title,
    type: sessionRequest.sessionType,
    description: sessionRequest.description,
    requestId,
    createdBy: sessionRequest.user,
    details: details._id,
    startTime: sessionRequest.startDate,
    endTime: sessionRequest.endDate,
    status: "scheduled",
    available: false,
  });

  await session.save();
  sessionRequest.isArchived = true;
  await sessionRequest.save();
  res.send(session);
});

export default router;
