const Notification = require("../models/Notification");

const sendNotification = async (
  req,
  { recipients, type, message, link, targetType }
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

  await notification.save();

  recipients.forEach((id) => {
    io.to(id.toString()).emit("new-notification", {
      _id: notification._id,
      type: notification.type,
      message: notification.message,
      link: notification.link,
      createdAt: notification.createdAt,
    });
  });

  return notification;
};

module.exports = sendNotification;
