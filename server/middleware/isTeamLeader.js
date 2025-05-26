const Team = require("../models/Team");
const Task = require("../models/Task");
const Event = require("../models/Event");
const SessionParticipant = require("../models/SessionParticipants");

module.exports = async function isTeamLeader(req, res, next) {
  try {
    if (!req.user) {
      return res.status(400).json({ message: "User not authenticated" });
    }
    
    // For tasks routes
    if (req.params.taskId) {
      console.log(`Checking task permissions for taskId: ${req.params.taskId}`);
      const task = await Task.findById(req.params.taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Get the session ID from the task
      const taskSessionId = task.session;
      console.log(`Task belongs to session: ${taskSessionId}`);
      
      const participant = await SessionParticipant.findOne({
        sessionId: taskSessionId,
        userId: req.user._id,
      });
      
      if (!participant) {
        return res.status(403).json({ 
          message: "Access denied. Not a participant in this session",
          userId: req.user._id,
          sessionId: taskSessionId
        });
      }
      
      if (participant.role !== "team_leader") {
        return res.status(403).json({
          message: "Access denied. Not authorized as team leader",
          role: participant.role,
          requiresRole: "team_leader"
        });
      }

      req.sessionId = taskSessionId;
      return next();
    }
    
    // For team routes
    if (req.params.teamId) {
      const team = await Team.findById(req.params.teamId);
      if (!team) return res.status(404).json({ message: "Team not found" });
      
      if (!team.leader.equals(req.user._id)) {
        return res.status(403).json({ 
          message: "Access denied. Not authorized as team leader",
          leaderId: team.leader,
          userId: req.user._id
        });
      }
      
      req.team = team;
      return next();
    }
    
    // For event routes
    if (req.params.eventId) {
      const event = await Event.findById(req.params.eventId);
      if (!event) return res.status(404).json({ message: "Event not found" });

      const participant = await SessionParticipant.findOne({
        sessionId: event.session,
        userId: req.user._id,
      });

      if (!participant || participant.role !== "team_leader") {
        return res.status(403).json({ 
          message: "Access denied. Not authorized as team leader for this event",
          hasParticipant: !!participant,
          role: participant?.role || "none" 
        });
      }

      req.sessionId = event.session;
      req.event = event;
      return next();
    }

    // For general session-based routes
    const sessionId = req.body.session || req.params.sessionId;
    if (!sessionId) {
      return res.status(400).json({ 
        message: "Session ID required",
        params: req.params,
        bodyHasSession: !!req.body.session
      });
    }

    const participant = await SessionParticipant.findOne({
      sessionId,
      userId: req.user._id,
    });

    if (!participant) {
      return res.status(403).json({ 
        message: "Access denied. Not a participant in this session",
        sessionId: sessionId,
        userId: req.user._id
      });
    }
    
    if (participant.role !== "team_leader") {
      return res.status(403).json({ 
        message: "Access denied. Not authorized as team leader",
        role: participant.role,
        requiresRole: "team_leader"
      });
    }

    req.sessionId = sessionId;
    return next();
  } catch (err) {
    console.error("isTeamLeader middleware error:", err);
    res.status(500).json({ 
      message: "Server error in permission check",
      error: err.message
    });
  }
};
