/**
 * Vote Controller
 * 
 * Handles operations related to voting on the blockchain.
 * This controller provides methods to cast votes and check if a user has voted.
 */

const ethers = require('ethers');
const blockchainConnector = require('../utils/blockchainConnector');

/**
 * Cast a vote in a session
 * @param {Object} params - Vote parameters
 * @param {string} params.sessionId - Session identifier
 * @param {string} params.voterId - Voter identifier
 * @param {string} params.choiceId - Choice identifier
 * @param {number} params.weight - Vote weight
 * @returns {Promise<Object>} - Transaction receipt
 */
async function castVote({ sessionId, voterId, choiceId, weight = 1 }) {
  try {
    blockchainConnector.checkInitialized();
    
    if (!sessionId) {
      throw new Error('Session ID is required');
    }
    
    if (!voterId) {
      throw new Error('Voter ID is required');
    }
    
    if (!choiceId) {
      throw new Error('Choice ID is required');
    }
    
    // Call the contract method
    const tx = await blockchainConnector.contract.castVote(
      sessionId, 
      voterId, 
      choiceId, 
      weight
    );
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return {
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      sessionId,
      voterId,
      choiceId
    };
  } catch (error) {
    console.error(`Failed to cast vote for session ${sessionId}:`, error);
    return {
      success: false,
      error: error.message,
      sessionId
    };
  }
}

/**
 * Check if a voter has already voted in a session
 * @param {string} sessionId - Session identifier
 * @param {string} voterId - ID of the voter
 * @returns {Promise<Object>} - Whether the voter has voted
 */
async function hasVoted(sessionId, voterId) {
  try {
    blockchainConnector.checkInitialized();
    
    const hasVoted = await blockchainConnector.contract.hasVoted(sessionId, voterId);
    
    return {
      success: true,
      hasVoted,
      sessionId,
      voterId
    };
  } catch (error) {
    console.error(`Failed to check if voter ${voterId} has voted in session ${sessionId}:`, error);
    return {
      success: false,
      error: error.message,
      sessionId,
      voterId
    };
  }
}

module.exports = {
  castVote,
  hasVoted
}; 