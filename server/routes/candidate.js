const express = require("express");
const Session = require("../models/Sessions");
const CandidateRequest = require("../models/CandidateRequest");
const CandidateInvitation = require("../models/CandidateInvitation");
const SessionParticipant = require("../models/SessionParticipants");
const User = require("../models/User");
const auth = require("../middleware/auth");
const router = express.Router({ mergeParams: true });
// get all candidates
router.get("/", auth, async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId)
      .populate({
        path: "candidates.user",
        select: "name email",
      })
      .populate({
        path: "candidates.assignedReviewer",
        select: "name email",
      });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const candidates = session.candidates.map((candidate) => ({
      user: candidate.user,
      assignedReviewer: candidate.assignedReviewer,
      status: candidate.status,
      partyName: candidate.partyName,
      totalVotes: candidate.totalVotes,
      requiresReview: candidate.requiresReview,
      fullName: candidate.fullName,
      biography: candidate.biography,
      experience: candidate.experience,
      nationalities: candidate.nationalities,
      dobPob: candidate.dobPob,
      promises: candidate.promises,
      paper: candidate.paper,
    }));

    res.status(200).json(candidates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});
// get all requests
router.get("/candidate-requests", auth, async (req, res) => {
  try {
    const sessionId = req.params.sessionId;

    const requests = await CandidateRequest.find({ session: sessionId })
      .populate("user", "fullName email")
      .populate("session", "name type");

    res.status(200).json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});
// apply to be a candidate
router.post("/apply", auth, async (req, res) => {
  const userId = req.user._id;
  const sessionId = req.params.sessionId;
  const {
    biography,
    experience,
    nationalities,
    dobPob,
    promises,
    partyName,
    paper,
  } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const fullName = user.fullName;
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.createdBy.equals(userId)) {
      return res
        .status(400)
        .json({ message: "Session leaders cannot apply as candidates" });
    }
    const existingRequest = await CandidateRequest.findOne({
      user: userId,
      session: sessionId,
    });

    if (existingRequest) {
      if (existingRequest.status === "approved") {
        return res
          .status(400)
          .json({ message: "You are already a candidate for this session." });
      } else if (existingRequest.status === "rejected") {
        return res.status(400).json({
          message:
            "Your previous request was rejected. You cannot apply again.",
        });
      } else {
        return res
          .status(400)
          .json({ message: "Your application is still pending." });
      }
    }

    const candidateRequest = new CandidateRequest({
      user: userId,
      session: sessionId,
      fullName,
      biography,
      experience,
      nationalities,
      dobPob,
      promises,
      partyName,
      paper: session.allowPapers ? paper || null : null,
      status: "pending",
    });
    await candidateRequest.save();
    session.markModified("candidateRequests");
    session.candidateRequests.push(candidateRequest._id);
    await session.save();
    res.status(201).json({
      message: "Your application to be a candidate has been submitted",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});
// accept candidate request
router.post("/accept/:requestId", auth, async (req, res) => {
  const userId = req.user._id;
  const requestId = req.params.requestId;

  try {
    const session = await Session.findById(req.params.sessionId).populate(
      "candidateRequests"
    );
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    const candidateRequest = await CandidateRequest.findById(requestId);
    if (!candidateRequest) {
      return res.status(404).json({ message: "Candidate request not found" });
    }
    if (candidateRequest.status === "approved") {
      return res
        .status(400)
        .json({ message: "This request has already been approved." });
    }
    if (candidateRequest.status === "rejected") {
      return res
        .status(400)
        .json({ message: "This request has already been rejected." });
    }
    if (!session.createdBy.equals(userId)) {
      return res
        .status(403)
        .json({ message: "You are not authorized to accept this request" });
    }
    candidateRequest.status = "approved";
    candidateRequest.approvedAt = Date.now();
    await candidateRequest.save();

    session.candidates.push({
      user: candidateRequest.user,
      assignedReviewer: null,
      partyName: candidateRequest.partyName,
      totalVotes: 0,
      requiresReview: false,
      fullName: candidateRequest.fullName,
      biography: candidateRequest.biography,
      experience: candidateRequest.experience,
      nationalities: candidateRequest.nationalities,
      dobPob: candidateRequest.dobPob,
      promises: candidateRequest.promises,
      paper: session.allowPapers ? candidateRequest.paper || null : null,
    });
    await session.save();
    await SessionParticipant.create({
      sessionId: session._id,
      userId: candidateRequest.user,
      role: "candidate",
    });
    res.status(200).json({ message: "Candidate request accepted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});
//reject candidate requets
router.post("/reject/:requestId", auth, async (req, res) => {
  const userId = req.user._id;
  const requestId = req.params.requestId;

  try {
    const candidateRequest = await CandidateRequest.findById(
      requestId
    ).populate("session");

    if (!candidateRequest) {
      return res.status(404).json({ message: "Candidate request not found" });
    }
    if (candidateRequest.status === "approved") {
      return res
        .status(400)
        .json({ message: "This request has already been approved." });
    }
    if (candidateRequest.status === "rejected") {
      return res
        .status(400)
        .json({ message: "This request has already been rejected." });
    }
    const session = candidateRequest.session;
    if (!session.createdBy.equals(userId)) {
      return res
        .status(403)
        .json({ message: "You are not authorized to reject this request" });
    }

    candidateRequest.status = "rejected";
    candidateRequest.rejectedAt = Date.now();

    await candidateRequest.save();

    res.status(200).json({ message: "Candidate request rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});
//invite user to be a candidate
router.post("/invite/:userId", auth, async (req, res) => {
  const inviterId = req.user._id;
  const sessionId = req.params.sessionId;
  const userId = req.params.userId;

  try {
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (!session.createdBy.equals(inviterId)) {
      return res
        .status(403)
        .json({ message: "Only the session leader can invite candidates" });
    }

    const alreadyCandidate = session.candidates.some((candidate) =>
      candidate.user.equals(userId)
    );

    if (alreadyCandidate) {
      return res
        .status(400)
        .json({ message: "User is already a candidate in this session" });
    }
    const existingInvite = await CandidateInvitation.findOne({
      sessionId,
      userId,
    });
    if (existingInvite) {
      if (existingInvite.status === "pending") {
        return res.status(400).json({
          message: "User has already been invited and hasn't responded yet",
        });
      }
      if (existingInvite.status === "declined") {
        return res
          .status(400)
          .json({ message: "User previously declined the invitation" });
      }
      if (existingInvite.status === "accepted") {
        return res
          .status(400)
          .json({ message: "User already accepted the invitation " });
      }
    }

    const invitation = new CandidateInvitation({
      sessionId,
      userId,
      invitedBy: inviterId,
    });

    await invitation.save();

    res.status(201).json({ message: "Invitation sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
//accept invite and be a candidate
router.post("/invite/:inviteId/accept", auth, async (req, res) => {
  const userId = req.user._id;
  const inviteId = req.params.inviteId;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const fullName = user.fullName;
    const invitation = await CandidateInvitation.findById(inviteId);
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    if (!invitation.userId.equals(userId)) {
      return res.status(403).json({
        message: "You can only accept an invitation that was sent to you",
      });
    }

    if (invitation.status === "accepted") {
      return res
        .status(400)
        .json({ message: "You have already accepted the invitation" });
    }

    if (invitation.status === "declined") {
      return res
        .status(400)
        .json({ message: "You have already declined this invitation" });
    }

    invitation.status = "accepted";
    await invitation.save();

    const session = await Session.findById(invitation.sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const alreadyCandidate = session.candidates.some((candidate) =>
      candidate.user.equals(userId)
    );

    if (alreadyCandidate) {
      return res
        .status(400)
        .json({ message: "User is already a candidate in this session" });
    }

    session.candidates.push({
      user: userId,
      assignedReviewer: null,
      partyName: req.body.partyName || "",
      totalVotes: 0,
      requiresReview: false,
      fullName: fullName,
      biography: req.body.biography || "",
      experience: req.body.experience || "",
      nationalities: req.body.nationalities || [],
      dobPob: req.body.dobPob || {},
      promises: req.body.promises || [],
      paper: session.allowPapers ? req.body.paper || [] : [],
    });

    await session.save();
    await SessionParticipant.create({
      sessionId: session._id,
      userId,
      role: "candidate",
    });
    res
      .status(200)
      .json({ message: "Invitation accepted and user added as a candidate" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
//decline invitation to be candidate
router.post("/invite/:inviteId/reject", auth, async (req, res) => {
  const userId = req.user._id;
  const { inviteId } = req.params;

  try {
    const invitation = await CandidateInvitation.findById(inviteId);
    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    if (!invitation.userId.equals(userId)) {
      return res.status(403).json({
        message: "You can only reject an invitation that was sent to you",
      });
    }

    if (invitation.status === "accepted") {
      return res
        .status(400)
        .json({ message: "You have already accepted the invitation" });
    }

    if (invitation.status === "declined") {
      return res
        .status(400)
        .json({ message: "You have already declined this invitation" });
    }

    invitation.status = "declined";
    await invitation.save();

    res.status(200).json({ message: "Invitation rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;
