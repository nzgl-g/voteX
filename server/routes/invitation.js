const mongoose = require("mongoose");
const express = require("express");
const auth = require("../middleware/auth");
const Invitation = require("../models/Invitation");
const Team = require("../models/Team");

const router = express.Router();
// Accept an invitation
router.post("/:invitationId/accept", auth, async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.invitationId);

    // Validate invitation
    if (!invitation) return res.status(404).send("Invitation not found");
    if (!invitation.userId.equals(req.user._id)) {
      return res.status(403).send("Not authorized");
    }
    if (invitation.status !== "pending") {
      return res.status(400).send("Invitation already processed");
    }

    // Add user to team
    const team = await Team.findById(invitation.teamId);
    if (!team) return res.status(404).send("Team not found");

    if (team.members.includes(req.user._id)) {
      return res.status(400).send("User already in team");
    }

    // Update team and invitation
    team.members.push(req.user._id);
    invitation.status = "accepted";

    await Promise.all([team.save(), invitation.save()]);

    res.status(200).send({ message: "Successfully joined team", team });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Decline an invitation
router.post("/:invitationId/decline", auth, async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.invitationId);

    if (!invitation) return res.status(404).send("Invitation not found");

    if (!invitation.userId.equals(req.user._id)) {
      return res.status(403).send("Not authorized to decline this invitation");
    }
    if (invitation.status !== "pending") {
      return res.status(400).send("Invitation already processed");
    }

    invitation.status = "declined";
    await invitation.save();

    res.status(200).send({ message: "Invitation declined" });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
