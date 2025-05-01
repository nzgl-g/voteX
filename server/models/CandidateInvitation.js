const mongoose = require("mongoose");
const candidateInvitationSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Session",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "declined"],
    default: "pending",
  },
});

module.exports = mongoose.model(
  "CandidateInvitation",
  candidateInvitationSchema
);
