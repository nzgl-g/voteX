import express from 'express';
import Session from '../models/Sessions.js';
import auth from '../middleware/auth.js';
import isTeamMember from '../middleware/isTeamMember.js';

const router = express.Router({ mergeParams: true });
router.get("/", async (req, res) => {
    const sessionId = req.params.sessionId;
    const session = await Session.findById(sessionId).populate({
        path: "details",
        populate: {
          path: "candidates",
        },
      });
    if(!session){
        return res.send("error no candidates"+sessionId)
    }
    res.send(session.details.candidates)
});
router.post("/request",auth, async (req, res) => {
    const sessionId = req.params.sessionId;
    const userId=req.user._id;
    const session = await Session.findById(sessionId).populate({
        path: "details",
        populate: {
          path: "candidates",
        },
      });
    if(!session){
        return res.send("error session not found")
    }
    const isAlreadyCandidate = session.details.candidates.some(
      (candidate) => candidate.equals(userId)
    );
  if (isAlreadyCandidate) {
      return res.status(400).send("User is already a candidate");
  }
  const exists = session.details.candidateRequests.find(
    (request) => request?.user?.toString() === userId.toString()
);

if (exists) {
    return res.status(400).send("User already sent a request");
}

    await session.details.candidateRequests.push({ user: userId });
    await session.details.save()
    res.send(session.details.candidateRequests)
});
router.patch("/manage",isTeamMember, async (req, res) => {
  const sessionId = req.params.sessionId;
  const {userId,status}=req.body;
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).send("Invalid status. It must be 'approved' or 'rejected'.");
  }
  const session = await Session.findById(sessionId).populate({
      path: "details",
      populate: {
        path: "candidates",
      },
    });
  if(!session){
      return res.send("error session not found")
  }
  
  const requestIndex = session.details.candidateRequests.findIndex(
    (request) => request.user.toString() === userId.toString()
  );
  const request = session.details.candidateRequests[requestIndex];
  const isAlreadyCandidate = session.details.candidates.some(
    (candidate) => candidate.equals(userId)
  );

  if (isAlreadyCandidate) {
    return res.status(400).send("User is already a candidate");
  }
  if (!request) {
    return res.status(404).send("Candidate request not found");
  }

  if (request.status !== "pending") {
    return res.status(400).send("Request is already processed");
  }

  if (status === "approved") {
     session.details.candidates.push(userId);
     session.details.candidateRequests.pull(request._id );
  } else if (status === "rejected") {
    session.details.candidateRequests.pull(request._id );
  }
  
  await session.details.save()
  res.send(session.details);
});


export default router;
