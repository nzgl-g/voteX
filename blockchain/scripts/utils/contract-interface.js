const { ethers } = require('ethers');
const VoteSessionFactoryABI = require('../../artifacts/contracts/VoteSessionFactory.sol/VoteSessionFactory.json').abi;
const VoteSessionABI = require('../../artifacts/contracts/VoteSession.sol/VoteSession.json').abi;

/**
 * Vote System Blockchain Interface
 * This utility provides methods to interact with the voting system contracts
 */
class VoteSystemBlockchain {
  constructor(provider, factoryAddress) {
    this.provider = provider;
    this.factoryAddress = factoryAddress;
    this.factory = new ethers.Contract(factoryAddress, VoteSessionFactoryABI, provider);
  }

  /**
   * Connect to the blockchain with a signer (for transactions)
   * @param {Signer} signer - Ethers.js signer object
   */
  connect(signer) {
    this.signer = signer;
    this.factoryWithSigner = this.factory.connect(signer);
    return this;
  }

  /**
   * Create a new voting session
   * @param {number} sessionId - Unique identifier for the session
   * @param {string[]} participants - List of participant names/identifiers
   * @param {number} endTimestamp - Unix timestamp when the session will end
   * @param {number} mode - Vote mode (0: Single, 1: Multiple, 2: Ranked)
   * @param {number} maxChoices - Maximum number of choices allowed in multiple/ranked mode
   * @returns {Promise<string>} - Address of the deployed session contract
   */
  async createSession(sessionId, participants, endTimestamp, mode, maxChoices) {
    if (!this.signer) {
      throw new Error('Signer required for this operation. Call connect() first.');
    }

    const tx = await this.factoryWithSigner.createVoteSession(
      sessionId,
      participants,
      endTimestamp,
      mode,
      maxChoices
    );

    const receipt = await tx.wait();
    
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
    return sessionAddress;
  }

  /**
   * Get a session contract instance
   * @param {string} sessionAddress - Address of the session contract
   * @returns {Contract} - Ethers.js contract instance
   */
  getSession(sessionAddress) {
    return new ethers.Contract(sessionAddress, VoteSessionABI, this.provider);
  }

  /**
   * Get a session contract instance with signer
   * @param {string} sessionAddress - Address of the session contract
   * @returns {Contract} - Ethers.js contract instance with signer
   */
  getSessionWithSigner(sessionAddress) {
    if (!this.signer) {
      throw new Error('Signer required for this operation. Call connect() first.');
    }
    const session = this.getSession(sessionAddress);
    return session.connect(this.signer);
  }

  /**
   * Cast a vote in a session
   * @param {string} sessionAddress - Address of the session contract
   * @param {string[]} choices - Array of participant identifiers (names) being voted for
   * @param {number[]} ranks - Array of ranks for each choice (only used in Ranked mode)
   * @returns {Promise<TransactionReceipt>} - Transaction receipt
   */
  async vote(sessionAddress, choices, ranks = []) {
    if (!this.signer) {
      throw new Error('Signer required for this operation. Call connect() first.');
    }
    
    const session = this.getSessionWithSigner(sessionAddress);
    const tx = await session.vote(choices, ranks);
    return await tx.wait();
  }

  /**
   * Get session results
   * @param {string} sessionAddress - Address of the session contract
   * @returns {Promise<{participants: string[], votes: number[]}>} - Voting results
   */
  async getResults(sessionAddress) {
    const session = this.getSession(sessionAddress);
    const [participants, votes] = await session.getResults();
    
    return {
      participants,
      votes: votes.map(v => Number(v))
    };
  }

  /**
   * Get session status
   * @param {string} sessionAddress - Address of the session contract
   * @returns {Promise<{isActive: boolean, remainingTime: number}>} - Session status
   */
  async getStatus(sessionAddress) {
    const session = this.getSession(sessionAddress);
    const [isActive, remainingTime] = await session.getStatus();
    
    return {
      isActive,
      remainingTime: Number(remainingTime)
    };
  }

  /**
   * Check if an address has voted in a session
   * @param {string} sessionAddress - Address of the session contract
   * @param {string} voterAddress - Address to check
   * @returns {Promise<boolean>} - True if address has voted
   */
  async hasVoted(sessionAddress, voterAddress) {
    const session = this.getSession(sessionAddress);
    return await session.checkVoted(voterAddress);
  }

  /**
   * Get session details
   * @param {string} sessionAddress - Address of the session contract
   * @returns {Promise<Object>} - Session details
   */
  async getSessionDetails(sessionAddress) {
    const session = this.getSession(sessionAddress);
    
    const [
      sessionId,
      voteMode,
      maxChoices,
      endTimestamp,
      creator,
      status,
      voterCount
    ] = await Promise.all([
      session.sessionId(),
      session.voteMode(),
      session.maxChoices(),
      session.endTimestamp(),
      session.creator(),
      session.getStatus(),
      session.getVoterCount()
    ]);

    // Get all participants
    const participantCount = await this._getParticipantCount(session);
    const participantPromises = [];
    for (let i = 0; i < participantCount; i++) {
      participantPromises.push(session.participants(i));
    }
    const participants = await Promise.all(participantPromises);

    return {
      sessionId: Number(sessionId),
      voteMode: Number(voteMode),
      maxChoices: Number(maxChoices),
      endTimestamp: Number(endTimestamp),
      creator,
      participants,
      isActive: status.isActive,
      remainingTime: Number(status.remainingTime),
      voterCount: Number(voterCount)
    };
  }

  /**
   * Get all sessions from the factory
   * @returns {Promise<number[]>} - Array of session IDs
   */
  async getAllSessionIds() {
    return await this.factory.getAllSessionIds();
  }

  /**
   * Get session contract address by ID
   * @param {number} sessionId - Session ID
   * @returns {Promise<string>} - Session contract address
   */
  async getSessionAddress(sessionId) {
    return await this.factory.sessions(sessionId);
  }

  /**
   * Helper method to get participant count from a session
   * @private
   */
  async _getParticipantCount(session) {
    let count = 0;
    try {
      while (true) {
        await session.participants(count);
        count++;
      }
    } catch (e) {
      // Reached the end of the array
    }
    return count;
  }
}

module.exports = VoteSystemBlockchain; 