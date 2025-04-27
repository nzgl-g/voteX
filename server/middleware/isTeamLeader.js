const Team = require("../models/Team");

module.exports = async function isTeamLeader(req, res, next) {
  try {
    const team = await Team.findById(req.params.teamId);

    if (!team) {
      return res.status(404).send("Team not found");
    }

    // Compare ObjectIds properly
    if (!team.leader.equals(req.user._id)) {
      return res
        .status(403)
        .send("Access denied. Not authorized as team leader");
    }

    req.team = team; // Attach team to request for later use
    next();
  } catch (err) {
    res.status(500).send("Server error");
  }
};
