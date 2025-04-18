import mongoose from "mongoose";
const ApprovalDetailsSchema = new mongoose.Schema({
    candidates: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
          unique:true,
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
    maxApprovals: { type: Number, default: 1 },
});
export default mongoose.model("ApprovalDetails", ApprovalDetailsSchema);
