const Agenda = require("agenda");
const mongoose = require("mongoose");
const Session = require("../models/Sessions");

const agenda = new Agenda({
  db: {
    address: process.env.MONGO_URI,
    collection: "agendaJobs",
  },
});

agenda.define("check and push session", async () => {
  try {
    const currentTime = new Date();
    const sessions = await Session.find({
      "sessionLifecycle.scheduledAt.start": { $lte: currentTime },
      "sessionLifecycle.startedAt": null,
    }).select("_id sessionLifecycle.scheduledAt");
    //just to debug . chof biha ila kayn sessions t9dr tdirlhm push doka
    if (sessions.length === 0) {
      console.log("No sessions ready for the blockchain.");
      return;
    }

    for (const session of sessions) {
      const scheduledStart = session.sessionLifecycle.scheduledAt.start;
      console.log(
        `Processing session ${session._id} with start time ${scheduledStart}`
      );
      await Session.findByIdAndUpdate(session._id, {
        $set: { "sessionLifecycle.startedAt": new Date() },
      });
      //hna code ta3k
      //call function that connects session with chain . rani jayb session id . cha lazm other properties
      console.log(`Pushed session ${session._id} to the blockchain.`);
    }
  } catch (error) {
    console.error(`Error in 'check and push session' job: ${error.message}`);
  }
});
const startAgenda = async () => {
  try {
    console.log("Starting Agenda...");

    await agenda.start();
    await agenda.purge();
    await agenda.every("30 seconds", "check and push session");
  } catch (error) {
    console.error("Failed to start Agenda:", error);
    throw error;
  }
};

module.exports = { agenda, startAgenda };
