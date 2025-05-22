const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  let { limit = 5, skip = 0 } = req.query;
  const userId = req.user._id;

  limit = parseInt(limit);
  skip = parseInt(skip);

  // Fallback/default handling
  if (isNaN(limit) || limit < 1 || limit > 50) limit = 5;
  if (isNaN(skip) || skip < 0) skip = 0;

  try {
    const notifications = await Notification.getUserNotifications(
      userId,
      limit,
      skip
    );
    res.json(notifications);
  } catch (err) {
    console.error("Failed to fetch notifications:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
// Mark a notification as read
router.patch("/:notificationId/read", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const notificationId = req.params.notificationId;
    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    const isRecipient = notification.recipients.some(
      (recipientId) => recipientId.toString() === userId.toString()
    );

    if (!isRecipient) {
      return res
        .status(403)
        .json({ error: "Not authorized to read this notification" });
    }
    const alreadyRead = notification.readBy.some(
      (readerId) => readerId.toString() === userId.toString()
    );

    if (alreadyRead) {
      return res
        .status(200)
        .json({ message: "Notification already marked as read" });
    }
    await Notification.markAsRead(notificationId, userId);
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    console.error("Failed to mark notification as read:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
