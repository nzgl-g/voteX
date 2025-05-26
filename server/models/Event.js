const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    allDay: { type: Boolean, default: false },
    location: { type: String, default: null },
    color: { type: String, default: "#2196F3" }, // Default to a blue tone if none set
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Event", EventSchema);
