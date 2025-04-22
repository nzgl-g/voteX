const jwt = require("jsonwebtoken");
module.exports = function (req, res, next) {
  const token = req.header("Authorization");
  if (!token) {
    return res.status(401).send("No token provided");
  }
  try {
    const tokenParts = token.split(" ");
    const actualToken =
      tokenParts.length === 2 && tokenParts[0] === "Bearer"
        ? tokenParts[1]
        : token;

    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET || "hello");

    if (decoded.role !== "admin") {
      return res.status(403).send("Not allowed");
    }

    req.user = decoded;
    next();
  } catch (ex) {
    return res.status(401).send("Invalid token");
  }
};
