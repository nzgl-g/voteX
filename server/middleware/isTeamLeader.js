const Team = require("../models/Team");
const Task = require("../models/Task");
const Event = require("../models/Event");
const SessionParticipant = require("../models/SessionParticipants");

module.exports = async function isTeamLeader(req, res, next) {
  try {
    if (!req.user) {
      return res.status(400).send("user not auth");
    }
    if (req.params.teamId) {
      const team = await Team.findById(req.params.teamId);
      if (!team) return res.status(404).send("Team not found");
      if (!team.leader.equals(req.user._id)) {
        return res
          .status(403)
          .send("Access denied. Not authorized as team leader");
      }
      req.team = team;
      return next();
    }
    if (req.params.taskId) {
      const task = await Task.findById(req.params.taskId);
      if (!task) return res.status(404).send("Task not found");

      const participant = await SessionParticipant.findOne({
        sessionId: task.session,
        userId: req.user._id,
        role: "team_leader",
      });
      if (!participant || participant.role !== "team_leader") {
        return res
          .status(403)
          .send("Access denied. Not authorized as team leader");
      }

      req.sessionId = task.session;
      return next();
    }
    if (req.params.eventId) {
      const event = await Event.findById(req.params.eventId);
      if (!event) return res.status(404).send("Event not found");

      const participant = await SessionParticipant.findOne({
        sessionId: event.session,
        userId: req.user._id,
      });

      if (!participant || participant.role !== "team_leader") {
        return res
          .status(403)
          .send("Access denied. Not authorized as team leader");
      }

      req.sessionId = event.session;
      req.event = event;
      return next();
    }

    const sessionId = req.body.session || req.params.sessionId;
    if (!sessionId) {
      return res.status(400).send("Session ID or Team ID required");
    }

    const participant = await SessionParticipant.findOne({
      sessionId,
      userId: req.user._id,
    });

    if (!participant || participant.role !== "team_leader") {
      return res
        .status(403)
        .send("Access denied. Not authorized as team leader");
    }

    req.sessionId = sessionId;
    return next();
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};
