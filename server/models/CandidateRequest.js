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
  reasonForRejection: { type: String, default: null },

  fullName: { type: String, required: true },
  biography: { type: String, default: "" },
  experience: { type: String, default: "" },
  nationalities: [{ type: String }],
  dobPob: {
    dateOfBirth: { type: Date },
    placeOfBirth: { type: String, default: "" },
  },
  promises: [{ type: String }],
  partyName: { type: String, required: true },
});

module.exports = mongoose.model("CandidateRequest", candidateRequestSchema);
