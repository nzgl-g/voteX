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
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
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
});
module.exports = mongoose.model("Session", sessionSchema);
