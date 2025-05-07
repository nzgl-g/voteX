/**
 * Status Controller
 * 
 * Handles operations related to the blockchain connection status.
 * This controller provides methods to initialize the blockchain connection
 * and check its status.
 */

const blockchainConnector = require('../utils/blockchainConnector');

/**
 * Initialize the blockchain connection
 * @param {Object} options - Initialization options
 * @param {string} options.privateKey - Private key for signing transactions
 * @param {string} options.contractAddress - Address of the deployed contract
 * @param {string} options.providerUrl - URL of the Ethereum provider
 * @returns {Promise<Object>} - Initialization status
 */
async function initialize(options = {}) {
  try {
    const result = await blockchainConnector.initialize(options);
    
    return {
      success: true,
      initialized: result
    };
  } catch (error) {
    console.error('Failed to initialize blockchain connection:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get the status of the blockchain connection
 * @returns {Promise<Object>} - Connection status
 */
async function getStatus() {
  try {
    const status = await blockchainConnector.getStatus();
    
    return {
      success: true,
      ...status
    };
  } catch (error) {
    console.error('Failed to get blockchain status:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  initialize,
  getStatus
}; 