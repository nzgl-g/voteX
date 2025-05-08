const Notification = require("../models/Notification");
const Team = require("../models/Team");

const sendNotification = async (
  req,
  { recipients, type, message, link, targetType, teamId, extraData = {} }
) => {
  const io = req.app.get("io");
  const interactionTypes = [
    "team-invite",
    "candidate-invite",
    "session-edit-request",
    "task-assigned",
  ];
  const category = interactionTypes.includes(type) ? "Interaction" : "Alert";
  const notification = new Notification({
    recipients,
    type,
    message,
    link,
    targetType,
    category,
    teamId: targetType === "team" ? teamId : undefined,
    createdAt: new Date(),
  });
  if (targetType === "team" && !teamId) {
    throw new Error("teamId is required when targetType is 'team'");
  }
  await notification.save();
  const payload = {
    type,
    message,
    link,
    targetType,
    category,
    createdAt: notification.createdAt,
    ...extraData,
  };
  if (targetType === "all") {
    io.emit("new-notification", payload);
  } else if (targetType === "team" && teamId) {
    try {
      const team = await Team.findById(teamId).select("members");
      if (team) {
        team.members.forEach((memberId) => {
          io.to(memberId.toString()).emit("new-notification", payload);
        });
      }
    } catch (err) {
      console.error("Error sending team notification:", err.message);
    }
  } else {
    recipients.forEach((id) => {
      io.to(id.toString()).emit("new-notification", payload);
    });
  }

  return notification;
};

module.exports = sendNotification;
