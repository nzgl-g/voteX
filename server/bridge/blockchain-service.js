/**
 * Blockchain Service
 * Handles interactions with the blockchain
 */

const ethers = require("ethers");
const config = require("./config");
const fs = require("fs");
const path = require("path");

// Load contract ABIs
const votingFactoryAbi = require("../../blockchain/artifacts/contracts/VotingFactory.sol/VotingFactory.json").abi;
const votingSessionAbi = require("../../blockchain/artifacts/contracts/VotingSession.sol/VotingSession.json").abi;
const voteCounterAbi = require("../../blockchain/artifacts/contracts/VoteCounter.sol/VoteCounter.json").abi;

class BlockchainService {
  constructor() {
    this.provider = null;
    this.factoryContract = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the blockchain service
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    try {
      // Create provider
      this.provider = new ethers.providers.JsonRpcProvider(config.defaultProviderUrl);
      
      // Check connection
      await this.provider.getBlockNumber();
      
      // Connect to factory contract if address is set
      if (config.contracts.votingFactory) {
        this.factoryContract = new ethers.Contract(
          config.contracts.votingFactory,
          votingFactoryAbi,
          this.provider
        );
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error("Failed to initialize blockchain service:", error);
      this.isInitialized = false;
      return false;
    }
  }
  
  /**
   * Check if the service is ready for use
   * @returns {Object} Status of the service
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      providerConnected: this.provider !== null,
      factoryConnected: this.factoryContract !== null,
      factoryAddress: config.contracts.votingFactory || null
    };
  }
  
  /**
   * Set the factory contract address
   * @param {string} address Factory contract address
   * @returns {boolean} Success status
   */
  setFactoryAddress(address) {
    try {
      if (!ethers.utils.isAddress(address)) {
        throw new Error("Invalid Ethereum address");
      }
      
      config.contracts.votingFactory = address;
      
      if (this.provider) {
        this.factoryContract = new ethers.Contract(
          address,
          votingFactoryAbi,
          this.provider
        );
      }
      
      return true;
    } catch (error) {
      console.error("Failed to set factory address:", error);
      return false;
    }
  }
  
  /**
   * Get all deployed voting sessions
   * @returns {Promise<Array>} Array of session addresses
   */
  async getDeployedSessions() {
    this.ensureInitialized();
    
    try {
      return await this.factoryContract.getDeployedSessions();
    } catch (error) {
      console.error("Failed to get deployed sessions:", error);
      throw error;
    }
  }
  
  /**
   * Get sessions created by a specific team leader
   * @param {string} teamLeaderAddress Address of the team leader
   * @returns {Promise<Array>} Array of session addresses
   */
  async getTeamLeaderSessions(teamLeaderAddress) {
    this.ensureInitialized();
    
    try {
      return await this.factoryContract.getTeamLeaderSessions(teamLeaderAddress);
    } catch (error) {
      console.error("Failed to get team leader sessions:", error);
      throw error;
    }
  }
  
  /**
   * Create a voting session
   * @param {Object} sessionParams Session parameters
   * @param {string} signerPrivateKey Private key for transaction signing
   * @returns {Promise<Object>} Created session information
   */
  async createSession(sessionParams, signerPrivateKey) {
    this.ensureInitialized();
    
    try {
      // Create wallet for signing
      const wallet = new ethers.Wallet(signerPrivateKey, this.provider);
      
      // Connect to factory with signer
      const factoryWithSigner = this.factoryContract.connect(wallet);
      
      // Call createVotingSession
      const tx = await factoryWithSigner.createVotingSession(
        sessionParams.options,
        sessionParams.sessionType,
        sessionParams.votingMode,
        sessionParams.sessionName,
        sessionParams.maxChoices || 0,
        sessionParams.minRankedChoices || 0,
        sessionParams.maxRankedChoices || 0,
        {
          gasLimit: config.gas.limit,
          gasPrice: config.gas.price
        }
      );
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      // Get session address from event
      const event = receipt.events.find(e => e.event === 'SessionCreated');
      const sessionAddress = event.args.sessionAddress;
      
      return {
        success: true,
        sessionAddress,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error("Failed to create voting session:", error);
      throw error;
    }
  }
  
  /**
   * Get session details
   * @param {string} sessionAddress Address of the session contract
   * @returns {Promise<Object>} Session details
   */
  async getSessionDetails(sessionAddress) {
    this.ensureInitialized();
    
    try {
      const sessionContract = new ethers.Contract(
        sessionAddress,
        votingSessionAbi,
        this.provider
      );
      
      // Get metadata
      const metadata = await sessionContract.getSessionMetadata();
      const options = await sessionContract.getOptions();
      const teamLeader = await sessionContract.teamLeader();
      const votesCount = await sessionContract.votesCount();
      
      return {
        address: sessionAddress,
        name: metadata._sessionName,
        sessionType: metadata._sessionType,
        votingMode: metadata._votingMode,
        state: metadata._state,
        maxChoices: metadata._maxChoices,
        minRankedChoices: metadata._minRankedChoices,
        maxRankedChoices: metadata._maxRankedChoices,
        options,
        teamLeader,
        votesCount
      };
    } catch (error) {
      console.error(`Failed to get session details for ${sessionAddress}:`, error);
      throw error;
    }
  }
  
  /**
   * Get session results
   * @param {string} sessionAddress Address of the session contract
   * @returns {Promise<Object>} Session results
   */
  async getSessionResults(sessionAddress) {
    this.ensureInitialized();
    
    try {
      const sessionContract = new ethers.Contract(
        sessionAddress,
        votingSessionAbi,
        this.provider
      );
      
      // Get session metadata
      const metadata = await sessionContract.getSessionMetadata();
      
      // Get options
      const options = await sessionContract.getOptions();
      
      // Get votes count
      const votesCount = await sessionContract.votesCount();
      
      // Get results based on voting mode
      if (metadata._votingMode === config.votingModes.RANKED) {
        // For ranked choice, we need to calculate off-chain
        // Return first choice counts as a simple indicator
        return {
          votingMode: metadata._votingMode,
          votesCount,
          message: "Ranked choice results need additional processing",
          options,
          // We don't have access to all ranked votes from this endpoint
          // Full ranked processing would need to be done in a separate flow
        };
      } else {
        // For single and multiple choice, get direct results
        const results = await sessionContract.getResults();
        
        // Format results
        const formattedResults = options.map((option, index) => ({
          option,
          votes: results[index].toNumber()
        }));
        
        return {
          votingMode: metadata._votingMode,
          votesCount: votesCount.toNumber(),
          options,
          results: formattedResults
        };
      }
    } catch (error) {
      console.error(`Failed to get session results for ${sessionAddress}:`, error);
      throw error;
    }
  }
  
  /**
   * Start a voting session
   * @param {string} sessionAddress Address of the session contract
   * @param {string} signerPrivateKey Private key for transaction signing
   * @returns {Promise<Object>} Transaction result
   */
  async startSession(sessionAddress, signerPrivateKey) {
    this.ensureInitialized();
    
    try {
      // Create wallet for signing
      const wallet = new ethers.Wallet(signerPrivateKey, this.provider);
      
      // Connect to session contract with signer
      const sessionContract = new ethers.Contract(
        sessionAddress,
        votingSessionAbi,
        wallet
      );
      
      // Call startSession
      const tx = await sessionContract.startSession({
        gasLimit: config.gas.limit,
        gasPrice: config.gas.price
      });
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error(`Failed to start session ${sessionAddress}:`, error);
      throw error;
    }
  }
  
  /**
   * End a voting session
   * @param {string} sessionAddress Address of the session contract
   * @param {string} signerPrivateKey Private key for transaction signing
   * @returns {Promise<Object>} Transaction result
   */
  async endSession(sessionAddress, signerPrivateKey) {
    this.ensureInitialized();
    
    try {
      // Create wallet for signing
      const wallet = new ethers.Wallet(signerPrivateKey, this.provider);
      
      // Connect to session contract with signer
      const sessionContract = new ethers.Contract(
        sessionAddress,
        votingSessionAbi,
        wallet
      );
      
      // Call endSession
      const tx = await sessionContract.endSession({
        gasLimit: config.gas.limit,
        gasPrice: config.gas.price
      });
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error(`Failed to end session ${sessionAddress}:`, error);
      throw error;
    }
  }
  
  /**
   * Cast a vote
   * @param {string} sessionAddress Address of the session contract
   * @param {Object} voteParams Vote parameters
   * @param {string} signerPrivateKey Private key for transaction signing
   * @returns {Promise<Object>} Transaction result
   */
  async castVote(sessionAddress, voteParams, signerPrivateKey) {
    this.ensureInitialized();
    
    try {
      // Create wallet for signing
      const wallet = new ethers.Wallet(signerPrivateKey, this.provider);
      
      // Connect to session contract with signer
      const sessionContract = new ethers.Contract(
        sessionAddress,
        votingSessionAbi,
        wallet
      );
      
      // Get session metadata
      const metadata = await sessionContract.getSessionMetadata();
      
      // Call appropriate voting function based on voting mode
      let tx;
      
      if (metadata._votingMode === config.votingModes.SINGLE) {
        tx = await sessionContract.voteSingle(voteParams.optionIndex, {
          gasLimit: config.gas.limit,
          gasPrice: config.gas.price
        });
      } else if (metadata._votingMode === config.votingModes.MULTIPLE) {
        tx = await sessionContract.voteMultiple(voteParams.optionIndexes, {
          gasLimit: config.gas.limit,
          gasPrice: config.gas.price
        });
      } else if (metadata._votingMode === config.votingModes.RANKED) {
        tx = await sessionContract.voteRanked(voteParams.rankedOptions, {
          gasLimit: config.gas.limit,
          gasPrice: config.gas.price
        });
      } else {
        throw new Error("Unsupported voting mode");
      }
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.transactionHash
      };
    } catch (error) {
      console.error(`Failed to cast vote for session ${sessionAddress}:`, error);
      throw error;
    }
  }
  
  /**
   * Check if a voter has already voted
   * @param {string} sessionAddress Address of the session contract
   * @param {string} voterAddress Address of the voter
   * @returns {Promise<boolean>} Whether the voter has voted
   */
  async hasVoted(sessionAddress, voterAddress) {
    this.ensureInitialized();
    
    try {
      const sessionContract = new ethers.Contract(
        sessionAddress,
        votingSessionAbi,
        this.provider
      );
      
      return await sessionContract.hasAddressVoted(voterAddress);
    } catch (error) {
      console.error(`Failed to check if voter ${voterAddress} has voted in session ${sessionAddress}:`, error);
      throw error;
    }
  }
  
  /**
   * Ensure the service is initialized
   * @throws {Error} If not initialized
   */
  ensureInitialized() {
    if (!this.isInitialized || !this.provider || !this.factoryContract) {
      throw new Error("Blockchain service not initialized");
    }
  }
}

// Create singleton instance
const blockchainService = new BlockchainService();

module.exports = blockchainService; 