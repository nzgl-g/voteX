// const mongoose = require("mongoose");
// const tournamentDetailsSchema = new mongoose.Schema({
//     candidates: [
//         {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "User",
//           required: true,
//           unique:true,
//         },
//       ],
//       candidateRequests: [
//         {
//           user: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "User",
//             required:true,
//           },
//           status: {
//             type: String,
//             enum: ["pending", "approved", "rejected"],
//             default: "pending",

//           },
//         },
//       ],
//     rounds: [
//         {
//             matches: [
//                 {
//                     candidate1: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//                     candidate2: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//                     winner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//                 },
//             ],
//         },
//     ],
// });
// module.exports = mongoose.model("tournament", tournamentDetailsSchema);

// this is an old model that i didnt delete . i might need to get the properties from here to add to session details for more accurate tournament rounds . keep it for now
