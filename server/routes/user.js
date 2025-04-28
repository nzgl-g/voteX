const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const auth = require("../middleware/auth");
const isTeamLeader = require("../middleware/isTeamLeader");
const router = express.Router();

/**  Log out */
router.post("/logout", auth, (req, res) => {
  // Invalidate token (frontend handles this mostly)
  res.status(200).send({ message: "Logged out successfully." });
});

/**  Get current user profile */

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    res.status(200).send(user);
  } catch (error) {
    res.status(500).send({ error: "Server error" });
  }
});

/**  Update user profile */
router.put("/me", auth, async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });
    res.status(200).send(user);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**  Delete user account */
router.delete("/me", auth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.status(200).send({ message: "Account deleted successfully." });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// /**  Add Team Member (Only Team Leaders) */
// router.post("/:userId/team-members", auth, isTeamLeader, async (req, res) => {
//   try {
//     const { memberId } = req.body;
//     const userId = req.user._id;

//     if (
//       !mongoose.Types.ObjectId.isValid(memberId) ||
//       !mongoose.Types.ObjectId.isValid(userId)
//     ) {
//       return res.status(400).send("Invalid user ID.");
//     }

//     const leader = await User.findById(userId);
//     if (!leader || leader.role !== "team_leader") {
//       return res.status(403).send("Only team leaders can add members.");
//     }

//     if (leader.teamMembers.includes(memberId)) {
//       return res.status(400).send("User is already a team member.");
//     }

//     leader.teamMembers.push(memberId);
//     await leader.save();

//     res.status(200).send({ message: "Member added successfully.", leader });
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// });

// /**  Remove Team Member (Only Team Leaders) */
// router.delete(
//   "/:userId/team-members/:memberId",
//   auth,
//   isTeamLeader,
//   async (req, res) => {
//     try {
//       const { memberId } = req.params;
//       const userId = req.user.id;
//       if (
//         !mongoose.Types.ObjectId.isValid(memberId) ||
//         !mongoose.Types.ObjectId.isValid(userId)
//       ) {
//         return res.status(400).send("Invalid user ID.");
//       }

//       const leader = await User.findById(userId);
//       if (!leader || leader.role !== "team_leader") {
//         return res.status(403).send("Only team leaders can remove members.");
//       }

//       if (!leader.teamMembers.includes(memberId)) {
//         return res.status(400).send("User is not a team member.");
//       }

//       leader.teamMembers = leader.teamMembers.filter(
//         (id) => id.toString() !== memberId
//       );
//       await leader.save();

//       res.status(200).send({ message: "Member removed successfully.", leader });
//     } catch (err) {
//       res.status(500).send(err.message);
//     }
//   }
// );

//admin below . add middleware later.

// /**  Get All Users (Admin Only) */
// router.get("/", auth, async (req, res) => {
//   try {
//     const users = await User.find().select("-password"); // Exclude password
//     res.status(200).send(users);
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// });

// /**  Get Specific User (Admin Only) */
// router.get("/:id", auth, async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id).select("-password");
//     if (!user) return res.status(404).send("User not found.");
//     res.status(200).send(user);
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// });

// /**  Delete User (Admin Only) */
// router.delete("/:id", auth, async (req, res) => {
//   try {
//     await User.findByIdAndDelete(req.params.id);
//     res.status(200).send({ message: "User deleted successfully." });
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// });

module.exports = router;

/** Change user role (Admin only) */
// router.put("/:id/role", auth, async (req, res) => {
//   try {
//     const { role } = req.body;
//     if (!["voter", "team_leader", "admin"].includes(role)) {
//       return res.status(400).send("Invalid role.");
//     }

//     const user = await User.findByIdAndUpdate(
//       req.params.id,
//       { role },
//       { new: true }
//     );
//     res.status(200).send(user);
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// });

// i didnt test these routes in the front but they should work in postman
