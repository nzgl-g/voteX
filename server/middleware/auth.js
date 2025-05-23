const jwt = require("jsonwebtoken");
const User = require("../models/User");
module.exports = async function (req, res, next) {
  const token = req.header("authorization");
  if (!token) {
    return res.send("no token provided");
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id).select("username email");
    if (!user) {
      return res.status(404).send("User not found");
    }
    req.user = user;
    next();
  } catch (ex) {
    return res.send("token not valid");
  }
};
