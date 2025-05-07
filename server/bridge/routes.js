/**
 * Blockchain Bridge Routes
 * API routes for the blockchain bridge
 */

const express = require("express");
const controllers = require("./controllers");

const router = express.Router();

// Initialize blockchain connection
// GET /blockchain/initialize
router.get("/initialize", controllers.initialize);

// Create a new voting session
// POST /blockchain/create-session
router.post("/create-session", controllers.createSession);

// Get session status
// GET /blockchain/session/:address/status
router.get("/session/:address/status", controllers.getSessionStatus);

// Get session details
// GET /blockchain/session/:address/details
router.get("/session/:address/details", controllers.getSessionDetails);

// Get session votes/results
// GET /blockchain/session/:address/votes
router.get("/session/:address/votes", controllers.getSessionVotes);

// Start a session
// POST /blockchain/session/:address/start
router.post("/session/:address/start", controllers.startSession);

// End a session
// POST /blockchain/session/:address/end
router.post("/session/:address/end", controllers.endSession);

// Cast a vote
// POST /blockchain/session/:address/vote
router.post("/session/:address/vote", controllers.castVote);

// Check if a voter has already voted
// GET /blockchain/session/:address/has-voted/:voter
router.get("/session/:address/has-voted/:voter", controllers.hasVoted);

// Get all sessions for a team leader
// GET /blockchain/team-leader/:address/sessions
router.get("/team-leader/:address/sessions", controllers.getTeamLeaderSessions);

module.exports = router; 