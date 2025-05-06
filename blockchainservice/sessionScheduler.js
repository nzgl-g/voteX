const blockchainController = require('./blockchainController');

/**
 * Schedules blockchain events for a session at start and end times
 * @param {Object} session - The session object with lifecycle information
 * @returns {void}
 */
async function scheduleSessionBlockchainEvents(session) {
  try {
    if (!blockchainController.getStatus().isInitialized) {
      console.error('Blockchain controller not initialized. Cannot schedule session events.');
      return;
    }
    
    const sessionId = session._id.toString();
    const startTime = new Date(session.sessionLifecycle.scheduledAt.start).getTime();
    const endTime = new Date(session.sessionLifecycle.scheduledAt.end).getTime();
    const now = Date.now();
    
    // Schedule session start on blockchain
    if (startTime > now) {
      const delay = startTime - now;
      console.log(`Scheduling session ${sessionId} to start on blockchain in ${Math.floor(delay / 1000)} seconds`);
      
      setTimeout(async () => {
        try {
          // Extract choices based on session type
          let choices = [];
          if (session.type === 'election') {
            choices = session.candidates.map(c => c._id.toString());
          } else if (session.type === 'poll') {
            choices = session.options.map(o => o._id.toString());
          } else if (session.type === 'tournament') {
            choices = session.participants.map(p => p._id.toString());
          }
          
          // Create session on blockchain
          const startResult = await blockchainController.createSession(sessionId, choices, session.subtype);
          
          console.log(`Session ${sessionId} started on blockchain. Transaction hash: ${startResult.transactionHash}`);
          
          // Update session in database (this would be done by your server code)
          // await Session.findByIdAndUpdate(sessionId, {
          //   'sessionLifecycle.startedAt': new Date(),
          //   'blockchain.registered': true,
          //   'blockchain.startTransaction': startResult.transactionHash,
          //   'blockchain.lastSyncedAt': new Date()
          // });
        } catch (error) {
          console.error(`Error starting session ${sessionId} on blockchain:`, error);
        }
      }, delay);
    }
    
    // Schedule session end on blockchain
    if (endTime > now) {
      const delay = endTime - now;
      console.log(`Scheduling session ${sessionId} to end on blockchain in ${Math.floor(delay / 60000)} minutes`);
      
      setTimeout(async () => {
        try {
          // End session on blockchain
          const endResult = await blockchainController.endSession(sessionId);
          
          // Get results from blockchain
          const results = await blockchainController.getSessionResults(sessionId);
          
          console.log(`Session ${sessionId} ended on blockchain. Transaction hash: ${endResult.transactionHash}`);
          
          // Update session in database (this would be done by your server code)
          // await Session.findByIdAndUpdate(sessionId, {
          //   'sessionLifecycle.endedAt': new Date(),
          //   'results': results.results,
          //   'blockchain.endTransaction': endResult.transactionHash,
          //   'blockchain.lastSyncedAt': new Date()
          // });
        } catch (error) {
          console.error(`Error ending session ${sessionId} on blockchain:`, error);
        }
      }, delay);
    }
  } catch (error) {
    console.error('Error scheduling session blockchain events:', error);
  }
}

/**
 * Re-schedules all active sessions from the database
 * @param {Array} sessions - Array of active sessions
 * @returns {void}
 */
async function rescheduleAllSessions(sessions) {
  if (!Array.isArray(sessions) || sessions.length === 0) {
    console.log('No sessions to reschedule');
    return;
  }
  
  console.log(`Rescheduling ${sessions.length} active sessions`);
  
  for (const session of sessions) {
    await scheduleSessionBlockchainEvents(session);
  }
}

/**
 * Synchronizes session results from blockchain to database
 * @param {string} sessionId - The session ID to synchronize
 * @returns {Promise<object>} - The synchronized results
 */
async function syncSessionResults(sessionId) {
  try {
    if (!blockchainController.getStatus().isInitialized) {
      throw new Error('Blockchain controller not initialized');
    }
    
    const results = await blockchainController.getSessionResults(sessionId);
    
    // In a real implementation, you would update the database
    // await Session.findByIdAndUpdate(sessionId, {
    //   'results': results.results,
    //   'blockchain.lastSyncedAt': new Date()
    // });
    
    return results;
  } catch (error) {
    console.error(`Error synchronizing results for session ${sessionId}:`, error);
    throw error;
  }
}

module.exports = {
  scheduleSessionBlockchainEvents,
  rescheduleAllSessions,
  syncSessionResults
}; 