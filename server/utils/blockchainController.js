const ethers = require('ethers');
const path = require('path');
const fs = require('fs');

class BlockchainController {
  constructor() {
    this.initialized = false;
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.contractAddress = null;
    this.contractAbi = null;
  }

  async initialize(privateKey, contractAddress) {
    try {
      // Load contract ABI
      const contractInfoPath = path.resolve(__dirname, '../../blockchain/contracts_info/VotingSystem.json');
      const contractInfo = JSON.parse(fs.readFileSync(contractInfoPath, 'utf8'));
      this.contractAbi = contractInfo.abi;
      
      // Setup provider - using local network by default
      this.provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
      
      // Setup wallet
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      
      // Setup contract
      this.contractAddress = contractAddress;
      this.contract = new ethers.Contract(contractAddress, this.contractAbi, this.wallet);
      
      // Verify connection
      await this.provider.getNetwork();
      
      this.initialized = true;
      console.log('Blockchain controller initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize blockchain controller:', error);
      this.initialized = false;
      throw error;
    }
  }

  async createSession(sessionId, choices, voteMode) {
    if (!this.initialized) {
      throw new Error('Blockchain controller not initialized');
    }

    try {
      // Convert voteMode from string to enum value (0, 1, 2)
      const voteModeEnum = this._getVoteModeEnum(voteMode);
      
      // Call contract method
      const tx = await this.contract.createSession(sessionId, choices, voteModeEnum);
      const receipt = await tx.wait();
      
      // Extract event info
      const event = receipt.logs
        .filter(log => log.fragment && log.fragment.name === 'SessionCreated')
        .map(log => ({
          sessionId: log.args[0],
          choicesCount: log.args[1].toString(),
          voteMode: log.args[2]
        }))[0];
      
      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        event: event || null
      };
    } catch (error) {
      console.error(`Error creating blockchain session ${sessionId}:`, error);
      throw error;
    }
  }

  async endSession(sessionId) {
    if (!this.initialized) {
      throw new Error('Blockchain controller not initialized');
    }

    try {
      const tx = await this.contract.endSession(sessionId);
      const receipt = await tx.wait();
      
      // Extract event info
      const event = receipt.logs
        .filter(log => log.fragment && log.fragment.name === 'SessionEnded')
        .map(log => ({
          sessionId: log.args[0]
        }))[0];
      
      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        event: event || null
      };
    } catch (error) {
      console.error(`Error ending blockchain session ${sessionId}:`, error);
      throw error;
    }
  }

  async isSessionActive(sessionId) {
    if (!this.initialized) {
      throw new Error('Blockchain controller not initialized');
    }

    try {
      return await this.contract.isSessionActive(sessionId);
    } catch (error) {
      console.error(`Error checking if session ${sessionId} is active:`, error);
      throw error;
    }
  }

  async getSessionChoices(sessionId) {
    if (!this.initialized) {
      throw new Error('Blockchain controller not initialized');
    }

    try {
      return await this.contract.getSessionChoices(sessionId);
    } catch (error) {
      console.error(`Error getting choices for session ${sessionId}:`, error);
      throw error;
    }
  }

  async getSessionVoteMode(sessionId) {
    if (!this.initialized) {
      throw new Error('Blockchain controller not initialized');
    }

    try {
      const voteMode = await this.contract.getSessionVoteMode(sessionId);
      return this._getVoteModeString(voteMode);
    } catch (error) {
      console.error(`Error getting vote mode for session ${sessionId}:`, error);
      throw error;
    }
  }

  async getSessionResults(sessionId) {
    if (!this.initialized) {
      throw new Error('Blockchain controller not initialized');
    }

    try {
      // Get all choices for this session
      const choices = await this.contract.getSessionChoices(sessionId);
      
      // Get results for each choice
      const results = {};
      for (const choiceId of choices) {
        const votes = await this.contract.getChoiceResult(sessionId, choiceId);
        results[choiceId] = votes.toString();
      }
      
      return {
        sessionId,
        choices,
        results
      };
    } catch (error) {
      console.error(`Error getting results for session ${sessionId}:`, error);
      throw error;
    }
  }

  async hasVoted(sessionId, voterAddress) {
    if (!this.initialized) {
      throw new Error('Blockchain controller not initialized');
    }

    try {
      return await this.contract.hasVoted(sessionId, voterAddress);
    } catch (error) {
      console.error(`Error checking if ${voterAddress} has voted in session ${sessionId}:`, error);
      throw error;
    }
  }

  // Helper method to convert string vote mode to enum value
  _getVoteModeEnum(voteModeString) {
    switch (voteModeString.toLowerCase()) {
      case 'single':
        return 0; // SINGLE
      case 'multiple':
        return 1; // MULTIPLE
      case 'ranked':
        return 2; // RANKED
      default:
        throw new Error(`Invalid vote mode: ${voteModeString}`);
    }
  }

  // Helper method to convert enum value to string vote mode
  _getVoteModeString(voteModeEnum) {
    switch (Number(voteModeEnum)) {
      case 0:
        return 'single';
      case 1:
        return 'multiple';
      case 2:
        return 'ranked';
      default:
        throw new Error(`Invalid vote mode enum: ${voteModeEnum}`);
    }
  }
}

// Create singleton instance
const blockchainController = new BlockchainController();
module.exports = blockchainController; 