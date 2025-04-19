import mongoose from 'mongoose';

const SessionRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  organization: String,
  banner: {
    id: String,
    url: String
  },
  sessionType: {
    type: String,
    enum: ["election", "approval", "poll", "tournament", "ranked"],
    required: true
  },
  votingMode: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  preparationSchedule: Date,
  accessControl: {
    type: String,
    enum: ["public", "private", "invite"],
    default: "public"
  },
  secretPhrase: String,
  displayLiveResults: {
    type: Boolean,
    default: true
  },
  verificationMethod: {
    type: String,
    default: "standard"
  },
  options: [{
    title: String,
    description: String
  }],
  candidates: [{
    name: String,
    email: String
  }],
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  isArchived: {
    type: Boolean,
    default: false
  }
});
export default mongoose.model("SessionRequest", SessionRequestSchema);
