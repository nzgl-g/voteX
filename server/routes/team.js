const express = require("express");
const mongoose = require("mongoose");
const Team = require("../models/Team");
const User = require("../models/User");
const auth = require("../middleware/auth");
const isTeamLeader = require("../middleware/isTeamLeader");
const router = express.Router();

/** 🔹 Get all teams (Only those the user is part of) */
router.get("/", auth, async (req, res) => {
  try {
    const teams = await Team.find({
      $or: [{ leader: req.user._id }, { members: req.user._id }],
    }).populate("leader members", "username email");

    res.status(200).send(teams);
  } catch (err) {
    res.status(500).send(err.message);
  }
});
/** 🔹 Get all members of a team (Only if user is in the team) */
router.get("/:teamId/members", auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId).populate(
      "members",
      "username email"
    );

    if (!team) return res.status(404).send("Team not found.");

    // Check if user is in the team
    if (
      team.leader.toString() !== req.user._id.toString() &&
      !team.members.some((m) => m._id.toString() === req.user._id.toString())
    ) {
      return res.status(403).send("Access denied.");
    }

    res.status(200).send(team.members);
  } catch (err) {
    res.status(500).send(err.message);
  }
});
/** 🔹 Get a specific team by ID (Only if user is in the team) */
router.get("/:teamId", auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId).populate(
      "leader members",
      "username email"
    );

    if (!team) return res.status(404).send("Team not found.");
    if (
      team.leader.toString() !== req.user._id.toString() &&
      !team.members.some((m) => m.toString() === req.user._id.toString())
    ) {
      return res.status(403).send("Access denied.");
    }

    res.status(200).send(team);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Send an invitation to a user to join a team
router.post("/:teamId/invite", auth, isTeamLeader, async (req, res) => {
  try {
    const { email } = req.body; // Email of the user to invite
    const team = await Team.findById(req.params.teamId);

    if (!team) return res.status(404).send("Team not found.");

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(404).send("User not found.");

    // Check if the user is already a member of the team
    if (team.members.includes(user._id)) {
      return res.status(400).send("User is already in the team.");
    }

    // Create an invitation
    const invitation = new Invitation({
      teamId: team._id,
      userId: user._id,
      invitedBy: req.user._id, // ID of the team leader who sent the invitation
    });

    // Save the invitation
    await invitation.save();

    res.status(200).send({ message: "Invitation sent successfully." });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/** 🔹 Remove a team member (Only Team Leaders) */
router.delete(
  "/:teamId/members/:memberId",
  auth,
  isTeamLeader,
  async (req, res) => {
    try {
      const { teamId, memberId } = req.params;
      const team = await Team.findById(teamId);
      if (!team) return res.status(404).send("Team not found.");

      if (!team.members.includes(memberId)) {
        return res.status(400).send("User is not in the team.");
      }

      // Prevent the leader from removing themselves
      if (team.leader.toString() === memberId) {
        return res.status(400).send("Leader cannot remove themselves.");
      }

      team.members = team.members.filter((id) => id.toString() !== memberId);
      await team.save();

      res.status(200).send({ message: "Member removed successfully.", team });
    } catch (err) {
      res.status(500).send(err.message);
    }
  }
);

module.exports = router;

// currently using simple middleware to make testing the logic easy
// after everything is done we can add moed detailed middleware .

// also there is an error . idk if its the route or my front request . the basic structure is here . when error appear i can easily fix the route that cause it . just tell me
