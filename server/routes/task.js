const express = require("express");
const isTeamLeader = require("../middleware/isTeamLeader");
const auth = require("../middleware/auth");
const Task = require("../models/Task");
const sendNotification = require("../helpers/sendNotification");

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
    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const isAssigned = task.assignedMembers.some((memberId) =>
      memberId.equals(req.user._id)
    );

    if (!isAssigned) {
      return res
        .status(403)
        .json({ message: "You are not assigned to this task" });
    }
    if (task.status === "completed") {
      return res
        .status(400)
        .json({ message: "Task is already marked as completed" });
    }

    task.status = "completed";
    await task.save();
    await sendNotification(req, {
      recipients: [team.leader],
      type: "task-completed",
      message: `A member has completed the task "${task.title}".`,
      link: `/tasks/${task._id}`,
      targetType: "team-leader",
    });
    res.json({ message: "Task marked as completed", task });
  } catch (err) {
    console.error("Error updating task:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});
module.exports = router;
