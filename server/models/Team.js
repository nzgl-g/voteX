const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Session",
    required: false,
  },
  sessionName: String,
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

module.exports = mongoose.model("Team", teamSchema);

//added a team model to keep api requests simple we getting data for the dashboard
//idk how it would work with the drop down menu idea but it should still be needed
