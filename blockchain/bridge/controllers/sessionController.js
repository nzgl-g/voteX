/**
 * Session Controller
 * 
 * Handles operations related to session management on the blockchain.
 * This controller provides methods to create, start, end, and query sessions.
 */

const blockchainConnector = require('../utils/blockchainConnector');

/**
 * Create a new session on the blockchain
 * @param {Object} params - Session parameters
 * @param {string} params.sessionId - Unique identifier for the session
 * @param {string[]} params.choices - Array of choice identifiers
 * @param {string} params.voteMode - Voting mode (SINGLE, MULTIPLE, RANKED)
 * @returns {Promise<Object>} - Transaction receipt
 */
async function createSession({ sessionId, choices, voteMode }) {
  try {
    blockchainConnector.checkInitialized();
    
    // Map vote mode string to enum value
    const voteModeMap = {
      'SINGLE': 0,
      'MULTIPLE': 1,
      'RANKED': 2
    };
    
    const voteModeValue = voteModeMap[voteMode.toUpperCase()];
    if (voteModeValue === undefined) {
      throw new Error(`Invalid vote mode: ${voteMode}`);
    }
    
    // Call contract method
    const tx = await blockchainConnector.contract.createSession(
      sessionId,
      choices,
      voteModeValue
    );
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      sessionId
    };
  } catch (error) {
    console.error(`Failed to create session ${sessionId}:`, error);
    return {
      success: false,
      error: error.message,
      sessionId
    };
  }
}

/**
 * End a session on the blockchain
 * @param {string} sessionId - Identifier of the session to end
 * @returns {Promise<Object>} - Transaction receipt
 */
async function endSession(sessionId) {
  try {
    blockchainConnector.checkInitialized();
    
    // Call contract method
    const tx = await blockchainConnector.contract.endSession(sessionId);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      sessionId
    };
  } catch (error) {
    console.error(`Failed to end session ${sessionId}:`, error);
    return {
      success: false,
      error: error.message,
      sessionId
    };
  }
}

/**
 * Check if a session is active on the blockchain
 * @param {string} sessionId - Session identifier
 * @returns {Promise<boolean>} - True if the session is active
 */
async function isSessionActive(sessionId) {
  try {
    blockchainConnector.checkInitialized();
    
    const isActive = await blockchainConnector.contract.isSessionActive(sessionId);
    
    return {
      success: true,
      isActive,
      sessionId
    };
  } catch (error) {
    console.error(`Failed to check if session ${sessionId} is active:`, error);
    return {
      success: false,
      error: error.message,
      sessionId
    };
  }
}

/**
 * Get session choices from the blockchain
 * @param {string} sessionId - Session identifier
 * @returns {Promise<Object>} - Session choices
 */
async function getSessionChoices(sessionId) {
  try {
    blockchainConnector.checkInitialized();
    
    const choices = await blockchainConnector.contract.getSessionChoices(sessionId);
    
    return {
      success: true,
      choices,
      sessionId
    };
  } catch (error) {
    console.error(`Failed to get session ${sessionId} choices:`, error);
    return {
      success: false,
      error: error.message,
      sessionId
    };
  }
}

/**
 * Get session vote mode from the blockchain
 * @param {string} sessionId - Session identifier
 * @returns {Promise<Object>} - Session vote mode
 */
async function getSessionVoteMode(sessionId) {
  try {
    blockchainConnector.checkInitialized();
    
    const voteModeValue = await blockchainConnector.contract.getSessionVoteMode(sessionId);
    
    // Map enum value to string
    const voteModeMap = ['SINGLE', 'MULTIPLE', 'RANKED'];
    const voteMode = voteModeMap[voteModeValue] || 'UNKNOWN';
    
    return {
      success: true,
      voteMode,
      voteModeValue,
      sessionId
    };
  } catch (error) {
    console.error(`Failed to get session ${sessionId} vote mode:`, error);
    return {
      success: false,
      error: error.message,
      sessionId
    };
  }
}

/**
 * Get session results from the blockchain
 * @param {string} sessionId - Session identifier
 * @returns {Promise<Object>} - Session results
 */
async function getSessionResults(sessionId) {
  try {
    blockchainConnector.checkInitialized();
    
    // First get the choices for the session
    const { choices } = await getSessionChoices(sessionId);
    
    if (!choices) {
      throw new Error(`Failed to get choices for session ${sessionId}`);
    }
    
    // Get results for each choice
    const results = {};
    for (const choiceId of choices) {
      const result = await blockchainConnector.contract.getChoiceResult(sessionId, choiceId);
      results[choiceId] = Number(result);
    }
    
    return {
      success: true,
      results,
      sessionId
    };
  } catch (error) {
    console.error(`Failed to get session ${sessionId} results:`, error);
    return {
      success: false,
      error: error.message,
      sessionId
    };
  }
}

module.exports = {
  createSession,
  endSession,
  isSessionActive,
  getSessionChoices,
  getSessionVoteMode,
  getSessionResults
}; 