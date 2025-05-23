const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ActivityLog = require("../models/ActivityLog");
const Team = require("../models/Team");
// Get all activity logs for a specific session
router.get("/:sessionId", auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;
    const team = await Team.findOne({ session: sessionId });
    if (!team) return res.status(404).send("Team not found for session");
    const isLeader = team.leader.equals(userId);
    const isMember = team.members.some((memberId) => memberId.equals(userId));

    if (!isLeader && !isMember) {
      return res.status(403).send("Access denied: not a team member or leader");
    }
    const logs = await ActivityLog.find({ session: sessionId })
      .sort({ timestamp: -1 })
      .populate("actor", "fullName username email");

    res.json(logs);
  } catch (err) {
    console.error("Error fetching activity logs:", err);
    res.status(500).send("Failed to fetch activity logs");
  }
});

module.exports = router;
