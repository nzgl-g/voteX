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
  const { error, value } = sessionSchema.validate(req.body);
  if (error) {
    return res.send("session input is wrong");
  }
  const { name, type } = value;
  const requestId=new mongoose.Types.ObjectId(req.body.requestId)
  const sessionRequest=await Request.findById(requestId)
  if (!sessionRequest) {
    return res.status(404).send("Session request not found");
  }
  if(sessionRequest.status!=="approved"){
    return res.status(404).send("Session request not approved");
  }
  
  let details;
  
  
  if (type === "election") {
    details =  new ElectionDetails({
      candidates: [],
    });
  } else if (type === "approval") {
    details =  new ApprovalDetails({
        });
    } else if (type === "poll") {
      details =  new PollDetails({
            options: [],
        });
    } else if (type === "tournament") {
      details =  new TournamentDetails({
      });
    } else if (type === "ranked") {
      details =  new RankedDetails({
      });
    } else {
      return res.status(400).send("Invalid session type");
    }
   
    const owner=sessionRequest.user;
    // Save the details document
    await details.save();
    const session = await new Session({
      name,
      type,
      requestId,
    createdBy: owner,
    details:details._id,
    ...value,
  });
  await session.save();
  sessionRequest.isArchived=true;
  await sessionRequest.save();
  res.send(session);
});

export default router;
