const mongoose = require("mongoose");

const sessionDetailsSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Session",
    required: true,
  },

  // Unified Candidates for Elections & Tournaments
  candidates: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  candidateRequests: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
    },
  ],

  maxChoices: { type: Number, default: 1 }, // Used for elections & polls if we decide to make limitations based on payment plans . can be ignored

  // Poll Fields
  options: [
    {
      text: String,
      addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
  ],

  // Tournament Fields
  tournamentType: {
    type: String,
    enum: ["Round Robin", "Knockout", "Swiss", null],
    default: null,
  },
  bracket: { type: mongoose.Schema.Types.Mixed, default: {} }, // Stores matchups dynamically
  maxRounds: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SessionDetails", sessionDetailsSchema);
