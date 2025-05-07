/**
 * Example: Integration with Server's Agenda
 * 
 * This example shows how to integrate the blockchain bridge with the server's agenda
 * to automatically start and end sessions on the blockchain based on scheduled times.
 * 
 * Note: This is just an example and should not be used directly in production.
 * It demonstrates the pattern for integration without modifying server code.
 */

// Import controllers from the bridge
const { controllers } = require('../index');
const { sessionController, statusController } = controllers;

/**
 * Initialize the blockchain connection
 * This should be called when the server starts
 */
async function initializeBlockchain() {
  try {
    const result = await statusController.initialize({
      privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY,
      contractAddress: process.env.CONTRACT_ADDRESS,
      providerUrl: process.env.PROVIDER_URL || 'http://127.0.0.1:8545'
    });
    
    console.log('Blockchain connection initialized:', result.success);
    return result.success;
  } catch (error) {
    console.error('Failed to initialize blockchain connection:', error);
    return false;
  }
}

/**
 * Start a session on the blockchain
 * This should be called when a session is scheduled to start
 * @param {Object} session - Session object from the database
 */
async function startSessionOnBlockchain(session) {
  try {
    // Extract session data
    const sessionId = session._id.toString();
    
    // Extract choices based on session type
    let choices = [];
    if (session.type === 'election') {
      choices = session.candidates.map(c => c._id.toString());
    } else if (session.type === 'poll') {
      choices = session.options.map(o => o._id.toString());
    } else if (session.type === 'tournament') {
      choices = session.participants.map(p => p._id.toString());
    }
    
    // Map vote type to contract's vote mode
    let voteMode = 'SINGLE';
    if (session.voteType === 'multiple') {
      voteMode = 'MULTIPLE';
    } else if (session.voteType === 'ranked') {
      voteMode = 'RANKED';
    }
    
    // Create session on blockchain
    const result = await sessionController.createSession({
      sessionId,
      choices,
      voteMode
    });
    
    if (result.success) {
      console.log(`Session ${sessionId} started on blockchain successfully`);
      
      // Here you would update the session in the database to mark it as started on blockchain
      // This would typically be done in the server code
      
      return {
        success: true,
        transactionHash: result.transactionHash
      };
    } else {
      console.error(`Failed to start session ${sessionId} on blockchain:`, result.error);
      return {
        success: false,
        error: result.error
      };
    }
  } catch (error) {
    console.error(`Error starting session on blockchain:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * End a session on the blockchain
 * This should be called when a session is scheduled to end
 * @param {Object} session - Session object from the database
 */
async function endSessionOnBlockchain(session) {
  try {
    const sessionId = session._id.toString();
    
    // End session on blockchain
    const result = await sessionController.endSession(sessionId);
    
    if (result.success) {
      console.log(`Session ${sessionId} ended on blockchain successfully`);
      
      // Get session results
      const resultsResponse = await sessionController.getSessionResults(sessionId);
      
      if (resultsResponse.success) {
        console.log(`Session ${sessionId} results:`, resultsResponse.results);
        
        // Here you would update the session in the database with the results
        // This would typically be done in the server code
        
        return {
          success: true,
          transactionHash: result.transactionHash,
          results: resultsResponse.results
        };
      } else {
        console.error(`Failed to get results for session ${sessionId}:`, resultsResponse.error);
        return {
          success: true,
          transactionHash: result.transactionHash,
          resultsError: resultsResponse.error
        };
      }
    } else {
      console.error(`Failed to end session ${sessionId} on blockchain:`, result.error);
      return {
        success: false,
        error: result.error
      };
    }
  } catch (error) {
    console.error(`Error ending session on blockchain:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Example function to demonstrate how to integrate with the server's agenda
 * This is similar to what would be in the server's agenda.js file
 */
async function agendaJobExample() {
  try {
    // Initialize blockchain connection
    await initializeBlockchain();
    
    // Mock session data (this would come from the database in the real implementation)
    const mockSession = {
      _id: '60d21b4667d0d8992e610c85',
      type: 'election',
      voteType: 'single',
      candidates: [
        { _id: 'candidate1' },
        { _id: 'candidate2' },
        { _id: 'candidate3' }
      ],
      sessionLifecycle: {
        scheduledAt: {
          start: new Date(),
          end: new Date(Date.now() + 3600000) // 1 hour from now
        }
      }
    };
    
    // Start session on blockchain
    console.log('Starting session on blockchain...');
    const startResult = await startSessionOnBlockchain(mockSession);
    console.log('Start result:', startResult);
    
    // In the real implementation, this would be scheduled for the end time
    console.log('Simulating session end after 5 seconds...');
    setTimeout(async () => {
      console.log('Ending session on blockchain...');
      const endResult = await endSessionOnBlockchain(mockSession);
      console.log('End result:', endResult);
    }, 5000);
  } catch (error) {
    console.error('Error in agenda job:', error);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  // Load environment variables
  require('dotenv').config();
  
  console.log('Running agenda integration example...');
  agendaJobExample();
}

// Export functions for use in other modules
module.exports = {
  initializeBlockchain,
  startSessionOnBlockchain,
  endSessionOnBlockchain
}; 