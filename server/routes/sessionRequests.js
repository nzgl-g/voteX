const mongoose = require("mongoose");

const sessionRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ["election", "poll", "tournament"],
    required: true,
  },
  voteMode: {
    type: String,
    enum: [
      "single",
      "multiple",
      "ranked",
      "single elimination",
      "double elimination",
    ],
    required: true,
  },

  description: { type: String, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
  results: { type: mongoose.Schema.Types.Mixed, default: null },
  visibility: {
    type: String,
    enum: ["Public", "Private"],
    default: "Public",
  },
  secretPhrase: { type: String, default: "" },
  locationRestriction: { type: String, default: "" },
  resultVisibility: {
    type: String,
    enum: ["Visible", "Hidden"],
    default: "Visible",
  },

  organizationName: { type: String, default: null },
  banner: { type: String, default: null }, // Background image URL
  verificationMethod: {
    type: String,
    enum: ["KYC", "CVC", null],
    default: null,
  },
  candidateStep: {
    type: String,
    enum: ["Nomination", "Invitation"],
    default: "Nomination",
  },
  subscription: {
    id: { type: String }, // Optional, mostly for frontend matching
    name: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      required: true,
    },
    price: { type: Number, required: true },
    voterLimit: { type: Number, default: null },
    features: [{ type: String }],
    isRecommended: { type: Boolean, default: false },
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },

  sessionLifecycle: {
    createdAt: { type: Date, default: Date.now },
    scheduledAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
  },
});

module.exports = mongoose.model("SessionRequest", sessionRequestSchema);
