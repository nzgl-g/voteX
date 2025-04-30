const express = require("express");
const isTeamLeader = require("../middleware/isTeamLeader");
const auth = require("../middleware/auth");
const Task = require("../models/Task");

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
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
//body
// {
//     "title": "Design homepage layout",
//     "description": "Create the initial layout for the homepage UI",
//     "priority": "high",
//     "dueDate": "2025-05-10T23:59:00.000Z",
//     "assignedMembers": ["6810b2b3837ce29367d98d99"],
//     "session": "68109a226d834d87fae01b4c",
//     "color": "#FFD700"
//   }

// Get all tasks for a session
router.get("/session/:sessionId", async (req, res) => {
  try {
    const tasks = await Task.find({ session: req.params.sessionId });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single task
router.get("/:taskId", async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a task (team leader only)
router.put("/:taskId", isTeamLeader, async (req, res) => {
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
router.delete("/:taskId", isTeamLeader, async (req, res) => {
  try {
    const deleted = await Task.findByIdAndDelete(req.params.taskId);
    if (!deleted) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Assign/unassign members to a task (team leader only)
router.patch("/:taskId/assign", isTeamLeader, async (req, res) => {
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

module.exports = router;
