const mongoose = require("mongoose");

// Define the candidate schema
const candidateSchema = new mongoose.Schema({
  fullName: {type: String, required: true},
  status: {
    type: String,
    enum: ["Verified", "Pending", "Refused"],
    default: "Pending"
  },
  assignedReviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  partyName: {type: String, required: true},
  totalVotes: {type: Number, default: 0},
  requiresReview: {type: Boolean, default: false},
});

// Define the option schema
const optionSchema = new mongoose.Schema({
  name: {type: String, required: true},
  description: {type: String, default: null},
  totalVotes: {type: Number, default: 0},
});

const sessionRequestSchema = new mongoose.Schema({
  // Basic information
  name: { type: String, required: true },
  description: {type: String, default: null},
  organizationName: {type: String, default: null},
  banner: {type: String, default: null}, // Background image URL

  // Session type and voting mode
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
  tournamentType: {
    type: String,
    enum: ["Round Robin", "Knockout", "Swiss", null],
    default: null,
  },

  // Access control
  visibility: {
    type: String,
    enum: ["Public", "Private"],
    default: "Public",
  },
  securityMethod: {
    type: String,
    enum: ["Secret Phrase", "CSV", null],
    default: null,
  },
  secretPhrase: { type: String, default: "" },
  // Results display
  resultVisibility: {
    type: String,
    enum: ["Visible", "Hidden"],
    default: "Visible",
  },

  // Verification
  verificationMethod: {
    type: String,
    enum: ["standard", "kyc", "KYC", "STANDARD", null],
    default: null,
  },
  candidateStep: {
    type: String,
    enum: ["Nomination", "Manual"],
    default: "Nomination",
  },

  // Candidates and options
  candidates: [candidateSchema],
  options: [optionSchema],

  // Subscription details
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

  // Session lifecycle
  sessionLifecycle: {
    createdAt: { type: Date, default: Date.now },
    scheduledAt: {
      start: {type: Date, default: null},
      end: {type: Date, default: null}
    },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
  },

  // References and status
  createdBy: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
  team: {type: mongoose.Schema.Types.ObjectId, ref: "Team"},
  results: {type: mongoose.Schema.Types.Mixed, default: null},
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
});

module.exports = mongoose.model("SessionRequest", sessionRequestSchema);
