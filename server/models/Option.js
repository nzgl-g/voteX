const mongoose = require("mongoose");
const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  //might need to know who made each option as a feature for teams
});
module.exports = mongoose.model("option", optionSchema);
