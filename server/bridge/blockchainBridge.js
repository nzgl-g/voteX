/**
 * Blockchain Bridge - Server-side blockchain interaction
 * 
 * This service handles communication between the backend server and blockchain
 * for tasks like deploying sessions and fetching vote counts.
 */

const { ethers } = require('ethers');
require('dotenv').config();

// Contract ABIs - simplified for interface only
const VOTE_SESSION_FACTORY_ABI = [
  "function createVoteSession(uint256 sessionId, string[] memory participants, uint256 endTimestamp, uint8 mode, uint8 maxChoices) external returns (address sessionAddress)",
  "function sessions(uint256) external view returns (address)",
  "function getAllSessionIds() external view returns (uint256[] memory)",
  "event SessionCreated(uint256 indexed sessionId, address sessionAddress, address creator)"
];

const VOTE_SESSION_ABI = [
  "function getResults() external view returns (string[] memory participantNames, uint256[] memory voteCounts)",
  "function getVoterCount() external view returns (uint256)",
  "function getStatus() external view returns (bool isActive, uint256 remainingTime)"
];

// Environment configurations
const FACTORY_ADDRESS = process.env.VOTE_FACTORY_ADDRESS;
const PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY;
const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545';

/**
 * BlockchainBridge class handles interactions with blockchain contracts
 */
class BlockchainBridge {
  constructor() {
    // Initialize provider based on environment
    this.provider = new ethers.JsonRpcProvider(RPC_URL);
    
    // Initialize wallet if private key is available
    if (PRIVATE_KEY) {
      this.wallet = new ethers.Wallet(PRIVATE_KEY, this.provider);
      console.log(`Blockchain bridge initialized with wallet: ${this.wallet.address}`);
    } else {
      console.warn('WARNING: No private key provided. Blockchain bridge limited to read-only operations.');
    }
    
    // Initialize factory contract
    if (FACTORY_ADDRESS) {
      this.factory = new ethers.Contract(
        FACTORY_ADDRESS,
        VOTE_SESSION_FACTORY_ABI,
        this.wallet || this.provider
      );
      console.log(`Connected to factory at: ${FACTORY_ADDRESS}`);
    } else {
      console.error('ERROR: Vote factory address not provided. Blockchain bridge cannot function properly.');
    }
  }

  /**
   * Deploy a new voting session contract
   * @param {string} sessionId - Database ID of the session
   * @param {Object} sessionData - Session data for contract deployment
   * @returns {Promise<string>} - Deployed contract address
   */
  async deploySession(sessionId, sessionData) {
    if (!this.wallet || !this.factory) {
      throw new Error('Blockchain bridge not properly initialized for write operations');
    }

    try {
      const {
        participants,
        endTimestamp,
        voteMode,
        maxChoices
      } = sessionData;

      console.log(`Deploying session ${sessionId} with ${participants.length} participants`);
      
      // Convert session ID to BigInt for blockchain
      const numericSessionId = BigInt(sessionId);
      
      // Deploy the contract
      const tx = await this.factory.createVoteSession(
        numericSessionId,
        participants,
        endTimestamp,
        voteMode,
        maxChoices
      );
      
      console.log(`Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`Transaction confirmed: ${receipt.hash}`);
      
      // Extract the session address from the event
      const event = receipt.logs
        .map(log => {
          try {
            return this.factory.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        })
        .find(event => event && event.name === 'SessionCreated');
      
      if (!event) {
        throw new Error('Session creation event not found in transaction');
      }
      
      const sessionAddress = event.args.sessionAddress;
      console.log(`Session deployed at: ${sessionAddress}`);
      
      return sessionAddress;
    } catch (error) {
      console.error('Error deploying session:', error);
      throw error;
    }
  }

  /**
   * Get voting results from blockchain
   * @param {string} sessionAddress - Address of the deployed session contract
   * @returns {Promise<{participants: string[], votes: number[], voterCount: number}>}
   */
  async getVoteResults(sessionAddress) {
    if (!this.provider) {
      throw new Error('Blockchain provider not initialized');
    }

    try {
      // Create contract instance
      const sessionContract = new ethers.Contract(
        sessionAddress,
        VOTE_SESSION_ABI,
        this.provider
      );
      
      // Get results and voter count
      const [results, voterCount, status] = await Promise.all([
        sessionContract.getResults(),
        sessionContract.getVoterCount(),
        sessionContract.getStatus()
      ]);
      
      // Extract data
      const [participants, votesBigInt] = results;
      const votes = votesBigInt.map(v => Number(v));
      
      return {
        participants,
        votes,
        voterCount: Number(voterCount),
        isActive: status[0],
        remainingTime: Number(status[1])
      };
    } catch (error) {
      console.error(`Error getting vote results for session ${sessionAddress}:`, error);
      throw error;
    }
  }

  /**
   * Start polling vote results for a session
   * @param {string} sessionAddress - Contract address 
   * @param {Function} updateCallback - Callback to update database with results
   * @param {number} interval - Polling interval in milliseconds (default: 15000)
   * @returns {Object} - Polling control object with stop method
   */
  pollVoteResults(sessionAddress, updateCallback, interval = 15000) {
    console.log(`Starting vote result polling for session ${sessionAddress}`);
    
    // Start polling
    const timerId = setInterval(async () => {
      try {
        console.log(`Polling vote results for session ${sessionAddress}`);
        const results = await this.getVoteResults(sessionAddress);
        
        // Format data for the callback
        const updateData = {
          participants: results.participants,
          votes: results.votes,
          voterCount: results.voterCount,
          source: 'blockchain'
        };
        
        // Call the callback to update database
        await updateCallback(updateData);
        console.log(`Updated vote counts for session ${sessionAddress}`);
        
        // If session is no longer active, stop polling
        if (!results.isActive) {
          console.log(`Session ${sessionAddress} has ended. Stopping polling.`);
          clearInterval(timerId);
        }
      } catch (error) {
        console.error(`Error polling vote results for session ${sessionAddress}:`, error);
      }
    }, interval);
    
    // Return control object to stop polling if needed
    return {
      stop: () => {
        console.log(`Manually stopping polling for session ${sessionAddress}`);
        clearInterval(timerId);
      }
    };
  }

  /**
   * Check if a contract exists at the given address
   * @param {string} address - Contract address to check
   * @returns {Promise<boolean>} - True if contract exists
   */
  async contractExists(address) {
    try {
      const code = await this.provider.getCode(address);
      // If there's deployed code (not "0x"), the contract exists
      return code !== '0x';
    } catch (error) {
      console.error(`Error checking contract at ${address}:`, error);
      return false;
    }
  }
}

// Create a singleton instance
const blockchainBridge = new BlockchainBridge();

module.exports = blockchainBridge; 