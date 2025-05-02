const express = require("express");
const mongoose = require("mongoose");

const Team = require("../models/Team");
const Invitation = require("../models/Invitation");
const User = require("../models/User");
const auth = require("../middleware/auth");
const isTeamLeader = require("../middleware/isTeamLeader");
const sendNotification = require("../helpers/sendNotification");

const router = express.Router();

/**  Get all teams (Only those the user is part of) */
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
/** Get all members of a team (Only if user is in the team) */
router.get("/:teamId/members", auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId)
      .populate("leader", "username email fullName")
      .populate("members", "username email fullName");

    if (!team) return res.status(404).send("Team not found.");

    // Check if user is in the team
    const isLeader = team.leader._id.equals(req.user._id);
    const isMember = team.members.some((u) => u._id.equals(req.user._id));

    if (!isLeader && !isMember) {
      return res.status(403).send("Access denied.");
    }

    res.status(200).send({
      leader: team.leader,
      members: team.members,
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});
/**  Get a specific team by ID (Only if user is in the team) */
router.get("/:teamId", auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId).populate(
      "leader members",
      "username email"
    );

    if (!team) return res.status(404).send("Team not found.");

    const isLeader = team.leader._id.equals(req.user._id);
    const isMember = team.members.some((u) => u._id.equals(req.user._id));

    if (!isLeader && !isMember) {
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
    const { email } = req.body;
    const { teamId } = req.params;
    // Validate email
    if (!email) return res.status(400).send("Email is required");

    // Find team and user in parallel for better performance
    const [team, user] = await Promise.all([
      Team.findById(teamId),
      User.findOne({ email }),
    ]);

    if (!team) return res.status(404).send("Team not found");
    if (!user) return res.status(404).send("User not found");

    // Check if user is already a member or the leader
    const isMember = team.members.some((member) => member.equals(user._id));
    const isLeader = team.leader.equals(user._id);

    if (isMember || isLeader) {
      return res.status(400).send("User is already part of the team");
    }

    // Check for existing pending invitation
    const existingInvite = await Invitation.findOne({
      teamId,
      userId: user._id,
      status: "pending",
    });

    if (existingInvite) {
      return res.status(400).send("Pending invitation already exists");
    }

    // Create and save invitation
    const invitation = new Invitation({
      teamId,
      userId: user._id,
      invitedBy: req.user._id,
      status: "pending",
    });

    await invitation.save();
    await sendNotification(req, {
      recipients: [user._id],
      type: "team-invite",
      message: `You've been invited to join the team of "${team.sessionName}"`,
      link: `/teams/${teamId}`, // update this later when front is ready
      targetType: "user",
    });
    // const notification = new Notification({
    //   recipients: [user._id],
    //   type: "team-invite",
    //   message: `You've been invited to join the team of "${team.sessionName}"`,
    //   link: `/teams/${teamId}`, //idk kifh rak dayr f front . gotta check laater
    //   targetType: "user",
    // });

    // await notification.save();
    // io.to(user._id.toString()).emit("new-notification", notification);
    res.status(201).json({
      message: "Invitation sent successfully",
      invitationId: invitation._id,
    });
  } catch (err) {
    console.error("Invitation error:", err);
    res.status(500).send("Failed to send invitation");
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

      const memberObjectId = new mongoose.Types.ObjectId(memberId);

      const team = await Team.findById(teamId);
      if (!team) return res.status(404).json({ error: "Team not found" });

      // Check if member exists in team (using ObjectId comparison)
      const isMember = team.members.some((id) => id.equals(memberObjectId));
      if (!isMember) {
        return res.status(400).json({ error: "User is not in the team" });
      }

      // Prevent leader self-removal (using ObjectId comparison)
      if (team.leader.equals(memberObjectId)) {
        return res
          .status(400)
          .json({ error: "Leader cannot remove themselves" });
      }

      // Filter using ObjectId comparison
      team.members = team.members.filter((id) => !id.equals(memberObjectId));
      await team.save();

      res.status(200).json({
        success: true,
        message: "Member removed successfully",
        team: await Team.findById(teamId).populate("members"), // Return fresh data
      });
    } catch (err) {
      console.error("Remove member error:", err);
      res.status(500).json({
        error: "Server error",
        details: err.message,
      });
    }
  }
);

module.exports = router;

// currently using simple middleware to make testing the logic easy
// after everything is done we can add moed detailed middleware .

// also there is an error . idk if its the route or my front request . the basic structure is here . when error appear i can easily fix the route that cause it . just tell me
