import mongoose from "mongoose";
const tournamentDetailsSchema = new mongoose.Schema({

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
    rounds: [
        {
            matches: [
                {
                    candidate1: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                    candidate2: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                    winner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                },
            ],
        },
    ],
});
export default mongoose.model("TournamentDetails", tournamentDetailsSchema);
