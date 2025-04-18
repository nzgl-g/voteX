import express from 'express';
const router = express.Router();
import User from '../models/User.js';
import auth from '../middleware/auth.js';
router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.send("error while looking for user details");
  }
  res.send(user);
});

export default router;
