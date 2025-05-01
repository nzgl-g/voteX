const express = require("express");
const Session = require("../models/Sessions");
const CandidateRequest = require("../models/CandidateRequest");
const CandidateInvitation = require("../models/CandidateInvitation");
const auth = require("../middleware/auth");
const router = express.Router({ mergeParams: true });
router.get("", auth, async (req, res) => {
  try {
    // Fetch the session by ID and populate the 'user' and 'assignedReviewer' fields of candidates
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

    // Send back candidates for the session
    const candidates = session.candidates.map((candidate) => ({
      user: candidate.user, // Contains populated user data (name, email)
      status: candidate.status,
      partyName: candidate.partyName,
      totalVotes: candidate.totalVotes,
      requiresReview: candidate.requiresReview,
      assignedReviewer: candidate.assignedReviewer,
    }));

    res.status(200).json(candidates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});
router.post("/apply", auth, async (req, res) => {
  const userId = req.user._id;
  console.log(userId);
  const sessionId = req.params.sessionId;

  try {
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
      status: "pending",
    });

    await candidateRequest.save();

    res.status(201).json({
      message: "Your application to be a candidate has been submitted",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});
router.post("/accept/:requestId", auth, async (req, res) => {
  const userId = req.user._id;
  const requestId = req.params.requestId;

  try {
    const candidateRequest = await CandidateRequest.findById(
      requestId
    ).populate("session");

    if (!candidateRequest) {
      return res.status(404).json({ message: "Candidate request not found" });
    }

    const session = candidateRequest.session;
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
      status: "Verified",
      partyName: "Party Name",
      totalVotes: 0,
    });

    await session.save();

    res.status(200).json({ message: "Candidate request accepted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

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

router.post("/invite", auth, async (req, res) => {
  const { userId } = req.body; // The user you're inviting
  const inviterId = req.user._id;
  const sessionId = req.params.sessionId;

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

router.post("/invite/:inviteId/accept", auth, async (req, res) => {
  const userId = req.user._id;
  const { inviteId } = req.params; // The invitation ID

  try {
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
      status: "Verified", // Automatically mark the candidate as verified on acceptance
    });

    await session.save();

    res
      .status(200)
      .json({ message: "Invitation accepted and user added as a candidate" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

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
