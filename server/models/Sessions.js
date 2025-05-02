const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  assignedReviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  partyName: { type: String, required: true },
  totalVotes: { type: Number, default: 0 },
  requiresReview: { type: Boolean, default: false },
  papers: [
    {
      name: { type: String, required: true },
      url: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
  fullName: { type: String, required: true },
  biography: { type: String, default: "" },
  experience: { type: String, default: "" },
  nationalities: [{ type: String }],
  dobPob: {
    dateOfBirth: { type: Date },
    placeOfBirth: { type: String, default: "" },
  },
  promises: [{ type: String }],
});

const optionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: null },
  totalVotes: { type: Number, default: 0 },
});

// Session Schema
const sessionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: null },
  organizationName: { type: String, default: null },
  banner: { type: String, default: null },
  type: {
    type: String,
    enum: ["election", "poll", "tournament"],
    required: true,
  },
  subtype: {
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
  accessLevel: {
    type: String,
    enum: ["Public", "Private"],
  },
  subscription: {
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
  sessionLifecycle: {
    createdAt: { type: Date, default: Date.now },
    scheduledAt: {
      start: { type: Date, default: null },
      end: { type: Date, default: null },
    },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
  candidates: [candidateSchema],
  results: { type: mongoose.Schema.Types.Mixed, default: null },

  securityMethod: {
    type: String,
    enum: ["Secret Phrase", "Area Restriction", null],
    default: null,
  },
  secretPhrase: {
    type: String,
    unique: true,
    sparse: true,
  },
  verificationMethod: {
    type: String,
    enum: ["KYC", "CVC", null],
    default: null,
  },
  candidateRequests: [
    { type: mongoose.Schema.Types.ObjectId, ref: "CandidateRequest" },
  ],

  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SessionParticipant",
    },
  ],
  allowDirectEdit: {
    type: Boolean,
    default: false,
  },
  allowsOfficialPapers: { type: Boolean, default: false },
});
sessionSchema.discriminator(
  "Election",
  new mongoose.Schema({
    // For election type
  })
);

sessionSchema.discriminator(
  "Poll",
  new mongoose.Schema({
    // Poll-specific fields
    options: [optionSchema], // For poll type
  })
);

sessionSchema.discriminator(
  "Tournament",
  new mongoose.Schema({
    // Tournament-specific fields
    tournamentType: {
      type: String,
      enum: ["Round Robin", "Knockout", "Swiss", null],
      default: null,
    },
    bracket: { type: mongoose.Schema.Types.Mixed, default: {} }, // Tournament bracket
    maxRounds: { type: Number, default: 1 },
  })
);

module.exports =
  mongoose.models.Session || mongoose.model("Session", sessionSchema);
