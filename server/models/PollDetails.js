import mongoose from "mongoose";
const pollDetailsSchema = new mongoose.Schema({
  options: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VoteOption",
      required: true,
    },
  ],
});
export default mongoose.model("PollDetails", pollDetailsSchema);
