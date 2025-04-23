const mongoose = require("mongoose");
const SessionRequestSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  isArchived: { type: Boolean, default: false },

  // Session details from the form
  name: { type: String, required: true }, // Consistent with `Session` model
  description: { type: String, default: "" },
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
  startTime: { type: Date }, // Matches `Session` model   required: true
  endTime: { type: Date }, // Matches `Session`  model  required: true
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

// Future Offer Feature
// offer: {
//   type: mongoose.Schema.Types.ObjectId,
//   ref: "Offer",
// }
//this depends on the payment plans . can be ignored for now
module.exports = mongoose.model("SessionRequest", SessionRequestSchema);
