const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  let token = req.header("authorization"); // Authorization header

  console.log("Received Token:", token); // Debugging

  if (!token) {
    return res.status(401).send("No token provided");
  }

  // Remove "Bearer " prefix if present
  if (token.startsWith("Bearer ")) {
    token = token.slice(7, token.length);
  }

  try {
    const decoded = jwt.verify(token, "hello"); // Ensure the secret matches the one used in generation
    console.log("Decoded Token:", decoded); // Debugging
    console.log("Token:", token); //
    req.user = decoded;
    next();
  } catch (ex) {
    console.error("Token verification failed:", ex.message);
    return res.status(401).send("Token not valid");
  }
};
