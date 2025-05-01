const express = require("express");
const signupRouter = require("../routes/signUp");
const loginRouter = require("../routes/login");
const sessionRouter = require("../routes/session");
const userRouter = require("../routes/user");
const candidateRouter = require("../routes/candidate");
const voteRouter = require("../routes/vote");
const invitationRouter = require("../routes/invitation");
const teamRouter = require("../routes/team");
const taskRouter = require("../routes/task");
const notificationsRouter = require("../routes/notifications");
// const blockchainRouter = require("../routes/blockchain");

module.exports = function (app) {
  app.use("/votex/api/signup", signupRouter);
  app.use("/votex/api/login", loginRouter);
  app.use("/votex/api/sessions", sessionRouter);
  app.use("/votex/api/users", userRouter);
  app.use("/votex/api/teams", teamRouter);
  app.use("/votex/api/tasks", taskRouter);
  app.use("/votex/api/notifications", notificationsRouter);
  app.use("/votex/api/invitations", invitationRouter);
  app.use("/votex/api/sessions/:sessionId/vote", voteRouter);
  app.use("/votex/api/sessions/:sessionId/candidate", candidateRouter);
  // app.use("/votex/api/blockchain", blockchainRouter);
};
//dont bother with this file . it just makes the routes work
