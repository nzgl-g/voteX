const ethers = require('ethers');
const fs = require('fs');
const path = require('path');

let provider;
let wallet;
let contract;
let isInitialized = false;

/**
 * Initializes the blockchain connection with a private key and contract address
 * @param {string} privateKey - The private key for the blockchain wallet (with 0x prefix)
 * @param {string} contractAddress - The address of the deployed VotingSystem contract
 * @returns {Promise<boolean>} - True if initialization was successful
 */
async function initialize(privateKey, contractAddress) {
  try {
    // Setup provider (default to localhost if not specified)
    const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
    provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Check if provider is connected
    await provider.getBlockNumber();
    
    // Setup wallet
    wallet = new ethers.Wallet(privateKey, provider);
    
    // Load contract ABI
    const contractInfo = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '../blockchain/contracts_info/VotingSystem.json'),
        'utf8'
      )
    );
    
    // Setup contract instance
    contract = new ethers.Contract(
      contractAddress,
      contractInfo.abi,
      wallet
    );
    
    isInitialized = true;
    console.log('Blockchain connection initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing blockchain connection:', error);
    isInitialized = false;
    throw new Error(`Blockchain initialization failed: ${error.message}`);
  }
}

/**
 * Checks if the blockchain controller is initialized
 * @returns {boolean} - True if initialized
 */
function checkInitialization() {
  if (!isInitialized) {
    throw new Error('Blockchain controller not initialized. Call initialize() first.');
  }
  return true;
}

/**
 * Creates a new voting session on the blockchain
 * @param {string} sessionId - The unique identifier for the session
 * @param {string[]} choices - Array of choice IDs for the session
 * @param {string} voteType - The type of vote (single, multiple, ranked)
 * @returns {Promise<object>} - Transaction receipt
 */
async function createSession(sessionId, choices, voteType) {
  checkInitialization();
  
  try {
    // Map vote type string to enum value (0: SINGLE, 1: MULTIPLE, 2: RANKED)
    const voteMode = mapVoteTypeToEnum(voteType);
    
    // Create session transaction
    const tx = await contract.createSession(sessionId, choices, voteMode);
    const receipt = await tx.wait();
    
    console.log(`Session ${sessionId} created on blockchain. Transaction hash: ${receipt.hash}`);
    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      status: 'success'
    };
  } catch (error) {
    console.error(`Error creating session ${sessionId} on blockchain:`, error);
    throw new Error(`Failed to create session: ${error.message}`);
  }
}

/**
 * Ends a voting session on the blockchain
 * @param {string} sessionId - The unique identifier for the session
 * @returns {Promise<object>} - Transaction receipt
 */
async function endSession(sessionId) {
  checkInitialization();
  
  try {
    // End session transaction
    const tx = await contract.endSession(sessionId);
    const receipt = await tx.wait();
    
    console.log(`Session ${sessionId} ended on blockchain. Transaction hash: ${receipt.hash}`);
    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      status: 'success'
    };
  } catch (error) {
    console.error(`Error ending session ${sessionId} on blockchain:`, error);
    throw new Error(`Failed to end session: ${error.message}`);
  }
}

/**
 * Gets results for a session from the blockchain
 * @param {string} sessionId - The unique identifier for the session
 * @returns {Promise<object>} - Session results
 */
async function getSessionResults(sessionId) {
  checkInitialization();
  
  try {
    // Get session choices
    const choices = await contract.getSessionChoices(sessionId);
    
    // Get results for each choice
    const results = {};
    for (const choiceId of choices) {
      const count = await contract.getChoiceResult(sessionId, choiceId);
      results[choiceId] = Number(count);
    }
    
    return {
      sessionId,
      results,
      choices
    };
  } catch (error) {
    console.error(`Error getting results for session ${sessionId}:`, error);
    throw new Error(`Failed to get session results: ${error.message}`);
  }
}

/**
 * Checks if a session is active on the blockchain
 * @param {string} sessionId - The unique identifier for the session
 * @returns {Promise<boolean>} - True if session is active
 */
async function isSessionActive(sessionId) {
  checkInitialization();
  
  try {
    const active = await contract.isSessionActive(sessionId);
    return active;
  } catch (error) {
    console.error(`Error checking if session ${sessionId} is active:`, error);
    throw new Error(`Failed to check session status: ${error.message}`);
  }
}

/**
 * Checks if an address has voted in a session
 * @param {string} sessionId - The unique identifier for the session
 * @param {string} address - The Ethereum address to check
 * @returns {Promise<boolean>} - True if address has voted
 */
async function hasAddressVoted(sessionId, address) {
  checkInitialization();
  
  try {
    const hasVoted = await contract.hasVoted(sessionId, address);
    return hasVoted;
  } catch (error) {
    console.error(`Error checking if address ${address} has voted in session ${sessionId}:`, error);
    throw new Error(`Failed to check voting status: ${error.message}`);
  }
}

/**
 * Gets the voting mode for a session
 * @param {string} sessionId - The unique identifier for the session
 * @returns {Promise<string>} - The voting mode (single, multiple, ranked)
 */
async function getSessionVoteMode(sessionId) {
  checkInitialization();
  
  try {
    const voteMode = await contract.getSessionVoteMode(sessionId);
    return mapEnumToVoteType(voteMode);
  } catch (error) {
    console.error(`Error getting vote mode for session ${sessionId}:`, error);
    throw new Error(`Failed to get session vote mode: ${error.message}`);
  }
}

/**
 * Maps vote type string to contract enum value
 * @param {string} voteType - The vote type (single, multiple, ranked)
 * @returns {number} - Enum value (0: SINGLE, 1: MULTIPLE, 2: RANKED)
 */
function mapVoteTypeToEnum(voteType) {
  const voteTypeLower = voteType.toLowerCase();
  
  if (voteTypeLower === 'single' || voteTypeLower === 'election') {
    return 0; // SINGLE
  } else if (voteTypeLower === 'multiple' || voteTypeLower === 'poll') {
    return 1; // MULTIPLE
  } else if (voteTypeLower === 'ranked' || voteTypeLower === 'tournament') {
    return 2; // RANKED
  } else {
    throw new Error(`Unknown vote type: ${voteType}`);
  }
}

/**
 * Maps contract enum value to vote type string
 * @param {number} voteMode - Enum value (0: SINGLE, 1: MULTIPLE, 2: RANKED)
 * @returns {string} - The vote type (single, multiple, ranked)
 */
function mapEnumToVoteType(voteMode) {
  switch (Number(voteMode)) {
    case 0:
      return 'single';
    case 1:
      return 'multiple';
    case 2:
      return 'ranked';
    default:
      throw new Error(`Unknown vote mode enum value: ${voteMode}`);
  }
}

/**
 * Returns the status of the blockchain controller
 * @returns {object} - Status object
 */
function getStatus() {
  return {
    isInitialized,
    provider: isInitialized ? provider.connection.url : null,
    wallet: isInitialized ? wallet.address : null,
    contract: isInitialized ? contract.target : null
  };
}

// Export functions
module.exports = {
  initialize,
  createSession,
  endSession,
  getSessionResults,
  isSessionActive,
  hasAddressVoted,
  getSessionVoteMode,
  getStatus
}; 