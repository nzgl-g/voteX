const Notification = require("../models/Notification");

const sendNotification = async (
  req,
  { recipients, type, message, link, targetType, teamId }
) => {
  const io = req.app.get("io");

  const notification = new Notification({
    recipients,
    type,
    message,
    link,
    targetType,
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
    createdAt: notification.createdAt,
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
