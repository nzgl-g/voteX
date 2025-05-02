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

module.exports = router;