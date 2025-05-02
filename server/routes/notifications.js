const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");
const { v4: uuidv4 } = require('uuid');

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

// POST /api/notifications/send
router.post('/send', (req, res) => {
  try {
    const { message, type = 'info', userId = null } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    // Create notification payload
    const notification = {
      id: uuidv4(),
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };

    // Get the sendNotification function from app
    const { sendNotification } = req.app;
    
    if (typeof sendNotification !== 'function') {
      return res.status(500).json({ 
        success: false, 
        error: 'Notification service not available' 
      });
    }

    // Send notification
    sendNotification(userId, notification);

    return res.status(200).json({ 
      success: true, 
      message: 'Notification sent successfully',
      notification
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to send notification' 
    });
  }
});

module.exports = router;
