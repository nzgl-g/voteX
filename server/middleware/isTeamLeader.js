module.exports = function (req, res, next) {
  if (!req.user || req.user.role !== "team_leader") {
    return res
      .status(403)
      .json({ error: "Only team leaders can perform this action." });
  }
  next();
};
