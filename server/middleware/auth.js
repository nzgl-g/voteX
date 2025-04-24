const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const token = req.header("authorization");
  if (!token) {
    return res.send("no token provided");
  }
  try {
    const decoded = jwt.verify(token, "hello");
    req.user = decoded;
    next();
  } catch (ex) {
    return res.send("token not valid");
  }
};
