import jwt from 'jsonwebtoken';

export default function isTeamLeader(req, res, next) {
  const token = req.header("authorization");
  if (!token) {
    return res.status(401).send("No token provided");
  }
  try {
    const decoded = jwt.verify(token, "hello");
    if (decoded.role !== "team_leader") {
      return res.status(403).send("Access denied. Not authorized as team leader");
    }
    req.user = decoded;
    next();
  } catch (ex) {
    return res.status(400).send("Invalid token");
  }
}