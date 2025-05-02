const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Users receiving the notification

  targetType: {
    type: String,
    enum: ["user", "team", "all"],
    default: "user",
  },
  teamId: {
    // Optional field for team-based notifications
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: function () {
      return this.targetType === "team";
    },
  },
  type: {
    type: String,
    enum: [
      "vote-started",
      "vote-ended",
      "team-invite",
      "candidate-invite",
      "support-response",
      "system",
    ],
    required: true,
  },
  message: { type: String, required: true },
  link: { type: String, required: true }, // Link to redirect user to relevant session, team, etc.
  timestamp: { type: Date, default: Date.now },
});

notificationSchema.statics.getUserNotifications = function (
    userId,
    limit = 5,
    skip = 0
) {
  return this.find({ recipients: userId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
};
notificationSchema.pre("save", function (next) {
  if (this.targetType === "all") {
    this.recipients = [];
  }
  next();
});
const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
