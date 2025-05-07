/**
 * Blockchain Bridge - Main Entry Point
 * 
 * This module serves as a bridge between the server and blockchain contracts.
 * It provides an interface for the server to interact with the blockchain
 * without directly modifying server code.
 */

const express = require('express');
const router = express.Router();
const sessionRoutes = require('./routes/sessionRoutes');
const voteRoutes = require('./routes/voteRoutes');
const statusRoutes = require('./routes/statusRoutes');

// Register routes
router.use('/sessions', sessionRoutes);
router.use('/vote', voteRoutes);
router.use('/status', statusRoutes);

// Export the router
module.exports = router;

// Export controllers for direct use
module.exports.controllers = {
  sessionController: require('./controllers/sessionController'),
  voteController: require('./controllers/voteController'),
  statusController: require('./controllers/statusController')
};

// Export utilities
module.exports.utils = {
  blockchainConnector: require('./utils/blockchainConnector')
}; 