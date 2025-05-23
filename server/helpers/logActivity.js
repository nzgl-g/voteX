const ActivityLog = require("../models/ActivityLog");

async function logActivity({ sessionId, userId, action }) {
  try {
    await ActivityLog.create({
      session: sessionId,
      actor: userId,
      action,
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}

module.exports = logActivity;
