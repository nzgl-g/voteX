const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Users receiving the notification
    readBy: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] },
    ],

    targetType: {
      type: String,
      enum: ["user", "team", "all"],
      default: "user",
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      validate: {
        validator: function (v) {
          return (
            this.targetType !== "team" || (this.targetType === "team" && !!v)
          );
        },
        message: "teamId is required when targetType is 'team'",
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
        "session-edit-rejected",
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
    extraData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

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
notificationSchema.statics.markAsRead = async function (
  notificationId,
  userId
) {
  return this.findByIdAndUpdate(
    notificationId,
    { $addToSet: { readBy: userId } },
    { new: true }
  );
};
notificationSchema.pre("validate", function (next) {
  if (this.targetType === "all" && this.recipients.length > 0) {
    return next(new Error("Recipients must be empty when targetType is 'all'"));
  }
  next();
});
notificationSchema.pre("validate", function (next) {
  const interactionTypes = [
    "team-invite",
    "candidate-invite",
    "session-edit-request",
    "task-assigned",
  ];
  this.category = interactionTypes.includes(this.type)
    ? "Interaction"
    : "Alert";
  next();
});

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
