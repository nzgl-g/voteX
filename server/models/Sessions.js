import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["election", "approval ", "poll", "tournament", "ranked"],
    required: true,
  },
  details: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "type",
  },
  description: {
    type: String,
    default: null,
  },
  requestId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "requests",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  results: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  voterList: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  isApproved: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ["ongoing", "completed", "canceled", "scheduled"],
    default: "scheduled",
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: {
    type: Date,
    default: Date.now,
  },
  available: {
    type: Boolean,
    default: false,
  },
  hiddenAt: {
    type: Date,
    default: null,
  },
  visibleAt: {
    type: Date,
    default: null,
  },
});
export default mongoose.model("Session", sessionSchema);
