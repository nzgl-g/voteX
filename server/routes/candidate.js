const express = require("express");
const router = express.Router({ mergeParams: true });
const Session = require("../models/Sessions");
const auth = require("../middleware/auth");
const isTeamMember = require("../middleware/isTeamMember");
router.get("/", async (req, res) => {
  const sessionId = req.params.sessionId;

  const sessionDetails = await SessionDetails.findOne({
    session: sessionId,
  }).populate("candidates");

  if (!sessionDetails) {
    return res.status(404).send("No session details found for this session.");
  }

  res.send(sessionDetails.candidates);
});
router.post("/request", auth, async (req, res) => {
  const sessionId = req.params.sessionId;
  const userId = req.user._id;

  const sessionDetails = await SessionDetails.findOne({ session: sessionId });

  if (!sessionDetails) {
    return res.status(404).send("Session not found.");
  }

  // Check if user is already a candidate
  const isAlreadyCandidate = sessionDetails.candidates.some((candidate) =>
    candidate.equals(userId)
  );
  if (isAlreadyCandidate) {
    return res.status(400).send("User is already a candidate");
  }

  // Check if request already exists
  const exists = sessionDetails.candidateRequests.some(
    (request) => request.user.toString() === userId.toString()
  );
  if (exists) {
    return res.status(400).send("User already sent a request");
  }

  // Add new request
  sessionDetails.candidateRequests.push({ user: userId });
  await sessionDetails.save();

  res.send(sessionDetails.candidateRequests);
});
router.patch("/manage", isTeamMember, async (req, res) => {
  const sessionId = req.params.sessionId;
  const { userId, status } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    return res
      .status(400)
      .send("Invalid status. It must be 'approved' or 'rejected'.");
  }

  const sessionDetails = await SessionDetails.findOne({ session: sessionId });

  if (!sessionDetails) {
    return res.status(404).send("Session details not found.");
  }

  // Find the request
  const requestIndex = sessionDetails.candidateRequests.findIndex(
    (request) => request.user.toString() === userId.toString()
  );

  if (requestIndex === -1) {
    return res.status(404).send("Candidate request not found.");
  }

  const request = sessionDetails.candidateRequests[requestIndex];

  // Check if user is already a candidate
  const isAlreadyCandidate = sessionDetails.candidates.some((candidate) =>
    candidate.equals(userId)
  );
  if (isAlreadyCandidate) {
    return res.status(400).send("User is already a candidate.");
  }

  // Approve or reject
  if (status === "approved") {
    sessionDetails.candidates.push(userId);
  }
  sessionDetails.candidateRequests.splice(requestIndex, 1); // Remove request

  await sessionDetails.save();
  res.send(sessionDetails);
});

module.exports = router;

// currently using simple middleware to make testing the logic easy
// after everything is done we can add moed detailed middleware .
