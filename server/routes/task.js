const express = require("express");
const isTeamLeader = require("../middleware/isTeamLeader");
const auth = require("../middleware/auth");
const Task = require("../models/Task");
const sendNotification = require("../helpers/sendNotification");
const Team = require("../models/Team");

const router = express.Router();

// Create a new task (team leader only)
router.post("/", auth, isTeamLeader, async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      dueDate,
      assignedMembers,
      session,
      color,
    } = req.body;

    const task = new Task({
      title,
      description,
      priority,
      dueDate,
      assignedMembers,
      session,
      color,
    });

    await task.save();
    await sendNotification(req, {
      recipients: assignedMembers,
      type: "task-assigned",
      message: `You have been assigned a new task: ${task.title}`,
      link: `/tasks/${task._id}`,
      targetType: "user",
    });

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/session/:sessionId", auth, async (req, res) => {
  try {
    const tasks = await Task.find({ session: req.params.sessionId });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single task
router.get("/:taskId", auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a task (team leader only)
router.put("/:taskId", auth, isTeamLeader, async (req, res) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.taskId,
      { $set: req.body },
      { new: true }
    );
    if (!updatedTask)
      return res.status(404).json({ message: "Task not found" });
    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a task (team leader only)
router.delete("/:taskId", auth, isTeamLeader, async (req, res) => {
  try {
    const deleted = await Task.findByIdAndDelete(req.params.taskId);
    if (!deleted) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Assign/unassign members to a task (team leader only)
router.patch("/:taskId/assign", auth, isTeamLeader, async (req, res) => {
  try {
    const { assignedMembers } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.taskId,
      { assignedMembers },
      { new: true }
    );
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.patch("/:taskId/complete", auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId).populate("session");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    if (!task.session) {
      return res.status(500).json({ message: "Session data is missing" });
    }
    const isAssigned = task.assignedMembers.some((memberId) =>
      memberId.equals(req.user._id)
    );

    if (!isAssigned) {
      return res
        .status(403)
        .json({ message: "You are not assigned to this task" });
    }

    const wasCompleted = task.status === "completed";
    task.status = wasCompleted ? "pending" : "completed";
    await task.save();

    const team = await Team.findById(task.session.team);
    if (!wasCompleted) {
      await sendNotification(req, {
        recipients: [team.leader],
        type: "task-completed",
        message: `A member has completed the task "${task.title}".`,
        link: `/tasks/${task._id}`,
        targetType: "user",
      });
    }
    if (wasCompleted) {
      await sendNotification(req, {
        recipients: [team.leader],
        type: "task-uncompleted",
        message: `A member has marked the task "${task.title}" as not completed.`,
        link: `/tasks/${task._id}`,
        targetType: "user",
      });
    }
    res.status(200).json({
      message: `Task marked as ${task.status}`,
      task,
    });
  } catch (err) {
    console.error("Error toggling task status:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
