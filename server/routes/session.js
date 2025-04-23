const mongoose = require("mongoose");
const sessionSchema = new mongoose.Schema({
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
  blockchainAddress: String, // Stores blockchain contract reference (i am not sure if u need this but i guess u do . this is the only blockchain data in the models)

  details: { type: mongoose.Schema.Types.ObjectId, ref: "SessionDetails" }, // Single reference now
  sessionRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SessionRequest",
  }, // Tracks the request it came from

  description: { type: String, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
  results: { type: mongoose.Schema.Types.Mixed, default: null },
  voterList: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isApproved: { type: Boolean, default: false },

  status: {
    type: String,
    enum: ["InProgress", "Complete", "Rejected", "Approved", "Pending"],
    default: "Approved",
  },
  sessionLifecycle: {
    createdAt: { type: Date, default: Date.now }, // optional if you use timestamps
    scheduledAt: { type: Date, default: null }, // if scheduling is ever used
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, required: true },
  },
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
});
module.exports = mongoose.model("Session", sessionSchema);
