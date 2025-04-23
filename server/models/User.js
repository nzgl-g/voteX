const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const userSchema = new mongoose.Schema({
  //add profile pic later
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    enum: ["admin", "team_leader", "team_member", "candidate", "voter"],
    default: "voter",
  },
  teamMembers: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
userSchema.pre("save", function (next) {
  if (this.role !== "team_leader" && this.teamMembers.length > 0) {
    return next(new Error("Only team leaders can have team members."));
  }
  next();
});
userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id, role: this.role }, "hello");
  return token;
};
module.exports = mongoose.model("User", userSchema);

// on top of the current properties we need to add the ones u shoed me in the candidate page . we can handle this after all the logic is done
//or when u handle the front for it . ill make the changes when u tell me
