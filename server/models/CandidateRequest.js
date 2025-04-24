const mongoose = require("mongoose");

const candidateRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Session",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  requestedAt: { type: Date, default: Date.now },
  approvedAt: { type: Date, default: null },
  rejectedAt: { type: Date, default: null },
  reasonForRejection: { type: String, default: null }, // Optional field for rejection reason
});

module.exports = mongoose.model("CandidateRequest", candidateRequestSchema);
