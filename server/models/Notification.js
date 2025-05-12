const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Users receiving the notification

  targetType: {
    type: String,
    enum: ["user", "team", "all"],
    default: "user",
  },
  teamId: {
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
      "team-member-accepted",
      "team-member-declined",
      "session-edit-request",
      "session-edit-approved",
      "task-assigned",
      "task-completed",
      "task-uncompleted",
      "team-member-removed",
      "support-response",
      "system",
    ],
    required: true,
  },
  message: { type: String, required: true },
  category: {
    type: String,
    enum: ["Alert", "Interaction"],
    required: true,
    default: "Alert",
  },
  link: { type: String, required: true },
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
