const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  fullName: {
    type: String,
    required: false, // Optional field
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Prefer not to say"],
    required: true,
  },
  walletAddress: {
    type: String,
    required: false,
    default: "",
    validate: {
      validator: (v) => v === "" || /^0x[a-fA-F0-9]{40}$/.test(v),
      message: "Invalid Ethereum wallet address",
    },
  },
  profilePic: {
    type: String,
    default: "",
  },
});

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET);
  return token;
};

module.exports = mongoose.model("User", userSchema);
