import mongoose from "mongoose";
const electionDetailsSchema = new mongoose.Schema({
  candidates: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,

    },
  ],
  candidateRequests: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required:true,
      },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",

      },
    },
  ],
});
export default mongoose.model("ElectionDetails", electionDetailsSchema);
