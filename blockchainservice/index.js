const express = require('express');
const blockchainController = require('./blockchainController');
const blockchainRoutes = require('./blockchainRoutes');
const voteTracker = require('./voteTracker');
const { rescheduleAllSessions } = require('./sessionScheduler');

/**
 * Initializes the blockchain service with routes and auto-initialization
 * @param {Object} app - Express app instance
 * @returns {Object} - Blockchain service API
 */
function initBlockchainService(app) {
  // Register routes
  app.use('/votex/api/blockchain', blockchainRoutes);
  app.use('/votex/api/sessions', voteTracker);
  
  // Auto-initialize from environment variables if available
  const { BLOCKCHAIN_PRIVATE_KEY, CONTRACT_ADDRESS } = process.env;
  
  if (BLOCKCHAIN_PRIVATE_KEY && CONTRACT_ADDRESS) {
    console.log('Auto-initializing blockchain service from environment variables');
    
    blockchainController.initialize(BLOCKCHAIN_PRIVATE_KEY, CONTRACT_ADDRESS)
      .then(() => {
        console.log('Blockchain service auto-initialized successfully');
        
        // Optionally, re-schedule active sessions on startup
        // This would require fetching active sessions from your database
        // Example:
        // const Session = require('../models/Session');
        // Session.find({ 'sessionLifecycle.active': true })
        //   .then(sessions => rescheduleAllSessions(sessions))
        //   .catch(error => console.error('Error rescheduling sessions:', error));
      })
      .catch(error => {
        console.error('Error auto-initializing blockchain service:', error);
      });
  } else {
    console.log('Blockchain service needs manual initialization. Use POST /votex/api/blockchain/initialize');
  }
  
  // Return blockchain service API for use in other parts of the application
  return {
    controller: blockchainController,
    scheduleEvents: rescheduleAllSessions
  };
}

module.exports = initBlockchainService; 