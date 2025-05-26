const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Event = require("../models/Event");
const SessionParticipant = require("../models/SessionParticipants");
const isTeamLeader = require("../middleware/isTeamLeader");
router.get("/session/:sessionId", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const sessionId = req.params.sessionId;
    const participant = await SessionParticipant.findOne({
      sessionId,
      userId,
      role: { $in: ["team_leader", "team_member"] },
    });
    if (!participant) {
      return res.status(403).json({
        message: "Access denied: not a team member or leader in this session",
      });
    }
    const events = await Event.find({ session: sessionId });

    if (!events || events.length === 0) {
      return res.status(200).json({ message: "No events for this session" });
    }
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
});
router.post("/", auth, isTeamLeader, async (req, res) => {
  try {
    const {
      session,
      title,
      description,
      startDate,
      endDate,
      allDay,
      location,
      color,
    } = req.body;

    if (!session || !title || !startDate || !endDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (!allDay) {
      const hasStartTime =
        start.getUTCHours() !== 0 || start.getUTCMinutes() !== 0;
      const hasEndTime = end.getUTCHours() !== 0 || end.getUTCMinutes() !== 0;

      if (!hasStartTime || !hasEndTime) {
        return res.status(400).json({
          message:
            "Start time and end time must include a valid time (not midnight) when allDay is false.",
        });
      }
    }
    const newEvent = new Event({
      session,
      title,
      description,
      startDate: start,
      endDate: end,
      allDay,
      location,
      color,
    });

    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
});
router.put("/:eventId", auth, isTeamLeader, async (req, res) => {
  try {
    const event = req.event;
    const updates = req.body;

    delete updates._id;

    Object.keys(updates).forEach((key) => {
      event[key] = updates[key];
    });

    await event.save();

    res.status(200).json({ message: "Event updated successfully", event });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.delete("/:eventId", auth, isTeamLeader, async (req, res) => {
  try {
    const event = req.event;
    if (!event) return res.status(404).json({ message: "Event not found" });

    await event.deleteOne();

    res.status(200).json({ message: "Event deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
