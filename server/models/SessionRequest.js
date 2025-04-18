import mongoose from 'mongoose';

const SessionRequestSchema = new mongoose.Schema({
  user: {
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
      isArchived: { type: Boolean, default: false },
    //will need this later when we use offers . 
    //offer model not ready
    // offer:{
    //     type: mongoose.Schema.Types.ObjectId,
    //         ref: "Offer",
    // }
}});
export default mongoose.model("SessionRequest", SessionRequestSchema);
