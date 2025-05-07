/**
 * Blockchain Bridge Controllers
 * Handlers for blockchain bridge API endpoints
 */

const blockchainService = require("./blockchain-service");
const metadataService = require("./metadata-service");
const config = require("./config");
const ethers = require("ethers");

/**
 * Initialize blockchain connection
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
async function initialize(req, res) {
  try {
    // Initialize blockchain service
    const initialized = await blockchainService.initialize();
    
    // Get status information
    const status = blockchainService.getStatus();
    
    // Return readiness status and configuration
    return res.status(200).json({
      success: initialized,
      status,
      sessionTypes: config.sessionTypes,
      votingModes: config.votingModes,
      sessionStates: config.sessionStates
    });
  } catch (error) {
    console.error("Failed to initialize blockchain connection:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to initialize blockchain connection",
      message: error.message
    });
  }
}

/**
 * Create a new voting session
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
async function createSession(req, res) {
  try {
    // Extract session parameters from request body
    const {
      options,
      sessionType,
      votingMode,
      sessionName,
      maxChoices,
      minRankedChoices,
      maxRankedChoices,
      privateKey,
      description,
      category,
      tags
    } = req.body;
    
    // Validate required parameters
    if (!options || !Array.isArray(options) || options.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid options array"
      });
    }
    
    if (sessionType === undefined || votingMode === undefined || !sessionName) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters"
      });
    }
    
    if (!privateKey) {
      return res.status(400).json({
        success: false,
        error: "Private key is required for signing transactions"
      });
    }
    
    // Validate session type and voting mode
    if (sessionType !== config.sessionTypes.POLL && sessionType !== config.sessionTypes.ELECTION) {
      return res.status(400).json({
        success: false,
        error: "Invalid session type"
      });
    }
    
    if (
      votingMode !== config.votingModes.SINGLE &&
      votingMode !== config.votingModes.MULTIPLE &&
      votingMode !== config.votingModes.RANKED
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid voting mode"
      });
    }
    
    // Additional validation based on voting mode
    if (votingMode === config.votingModes.MULTIPLE && (!maxChoices || maxChoices <= 0 || maxChoices > options.length)) {
      return res.status(400).json({
        success: false,
        error: "Invalid maxChoices for multiple choice voting"
      });
    }
    
    if (votingMode === config.votingModes.RANKED) {
      if (!minRankedChoices || minRankedChoices <= 0) {
        return res.status(400).json({
          success: false,
          error: "Invalid minRankedChoices for ranked choice voting"
        });
      }
      
      if (!maxRankedChoices || maxRankedChoices < minRankedChoices || maxRankedChoices > options.length) {
        return res.status(400).json({
          success: false,
          error: "Invalid maxRankedChoices for ranked choice voting"
        });
      }
    }
    
    // Create session parameters
    const sessionParams = {
      options,
      sessionType,
      votingMode,
      sessionName,
      maxChoices: maxChoices || 0,
      minRankedChoices: minRankedChoices || 0,
      maxRankedChoices: maxRankedChoices || 0
    };
    
    // Create voting session
    const result = await blockchainService.createSession(sessionParams, privateKey);
    
    // Get team leader address from the private key
    const wallet = new ethers.Wallet(privateKey);
    const teamLeaderAddress = wallet.address;
    
    // Store metadata
    const metadata = await metadataService.storeMetadata({
      sessionAddress: result.sessionAddress,
      teamLeaderAddress,
      ...sessionParams,
      description: description || "",
      category: category || "general",
      tags: tags || []
    });
    
    return res.status(201).json({
      success: true,
      sessionAddress: result.sessionAddress,
      transactionHash: result.transactionHash,
      metadata
    });
  } catch (error) {
    console.error("Failed to create voting session:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create voting session",
      message: error.message
    });
  }
}

/**
 * Get session status
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
async function getSessionStatus(req, res) {
  try {
    const { address } = req.params;
    
    if (!address || !ethers.utils.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: "Invalid session address"
      });
    }
    
    // Get session details from blockchain
    const details = await blockchainService.getSessionDetails(address);
    
    return res.status(200).json({
      success: true,
      address,
      state: details.state,
      sessionType: details.sessionType,
      votingMode: details.votingMode,
      votesCount: details.votesCount
    });
  } catch (error) {
    console.error(`Failed to get session status for ${req.params.address}:`, error);
    return res.status(500).json({
      success: false,
      error: "Failed to get session status",
      message: error.message
    });
  }
}

/**
 * Get session details
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
async function getSessionDetails(req, res) {
  try {
    const { address } = req.params;
    
    if (!address || !ethers.utils.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: "Invalid session address"
      });
    }
    
    // Get on-chain details
    const onChainDetails = await blockchainService.getSessionDetails(address);
    
    // Get off-chain metadata
    let metadata = null;
    try {
      metadata = await metadataService.getMetadata(address);
    } catch (error) {
      console.warn(`No off-chain metadata found for session ${address}`);
    }
    
    return res.status(200).json({
      success: true,
      onChain: onChainDetails,
      offChain: metadata
    });
  } catch (error) {
    console.error(`Failed to get session details for ${req.params.address}:`, error);
    return res.status(500).json({
      success: false,
      error: "Failed to get session details",
      message: error.message
    });
  }
}

/**
 * Get session votes/results
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
async function getSessionVotes(req, res) {
  try {
    const { address } = req.params;
    
    if (!address || !ethers.utils.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: "Invalid session address"
      });
    }
    
    // Get votes from blockchain
    const results = await blockchainService.getSessionResults(address);
    
    return res.status(200).json({
      success: true,
      address,
      results
    });
  } catch (error) {
    console.error(`Failed to get session votes for ${req.params.address}:`, error);
    return res.status(500).json({
      success: false,
      error: "Failed to get session votes",
      message: error.message
    });
  }
}

/**
 * End a voting session
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
async function endSession(req, res) {
  try {
    const { address } = req.params;
    const { privateKey } = req.body;
    
    if (!address || !ethers.utils.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: "Invalid session address"
      });
    }
    
    if (!privateKey) {
      return res.status(400).json({
        success: false,
        error: "Private key is required for signing transactions"
      });
    }
    
    // End session on blockchain
    const result = await blockchainService.endSession(address, privateKey);
    
    // Update metadata if available
    try {
      await metadataService.updateSessionState(address, 2); // Ended
    } catch (error) {
      console.warn(`Failed to update metadata state for session ${address}:`, error.message);
    }
    
    return res.status(200).json({
      success: true,
      address,
      transactionHash: result.transactionHash
    });
  } catch (error) {
    console.error(`Failed to end session ${req.params.address}:`, error);
    return res.status(500).json({
      success: false,
      error: "Failed to end session",
      message: error.message
    });
  }
}

/**
 * Start a voting session
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
async function startSession(req, res) {
  try {
    const { address } = req.params;
    const { privateKey } = req.body;
    
    if (!address || !ethers.utils.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: "Invalid session address"
      });
    }
    
    if (!privateKey) {
      return res.status(400).json({
        success: false,
        error: "Private key is required for signing transactions"
      });
    }
    
    // Start session on blockchain
    const result = await blockchainService.startSession(address, privateKey);
    
    // Update metadata if available
    try {
      await metadataService.updateSessionState(address, 1); // Started
    } catch (error) {
      console.warn(`Failed to update metadata state for session ${address}:`, error.message);
    }
    
    return res.status(200).json({
      success: true,
      address,
      transactionHash: result.transactionHash
    });
  } catch (error) {
    console.error(`Failed to start session ${req.params.address}:`, error);
    return res.status(500).json({
      success: false,
      error: "Failed to start session",
      message: error.message
    });
  }
}

/**
 * Cast a vote
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
async function castVote(req, res) {
  try {
    const { address } = req.params;
    const { privateKey, optionIndex, optionIndexes, rankedOptions } = req.body;
    
    if (!address || !ethers.utils.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: "Invalid session address"
      });
    }
    
    if (!privateKey) {
      return res.status(400).json({
        success: false,
        error: "Private key is required for signing transactions"
      });
    }
    
    // Get session details to determine voting mode
    const details = await blockchainService.getSessionDetails(address);
    
    // Validate vote parameters based on voting mode
    let voteParams = {};
    
    if (details.votingMode === config.votingModes.SINGLE) {
      if (optionIndex === undefined) {
        return res.status(400).json({
          success: false,
          error: "Option index is required for single choice voting"
        });
      }
      voteParams.optionIndex = optionIndex;
    } else if (details.votingMode === config.votingModes.MULTIPLE) {
      if (!optionIndexes || !Array.isArray(optionIndexes)) {
        return res.status(400).json({
          success: false,
          error: "Option indexes array is required for multiple choice voting"
        });
      }
      voteParams.optionIndexes = optionIndexes;
    } else if (details.votingMode === config.votingModes.RANKED) {
      if (!rankedOptions || !Array.isArray(rankedOptions)) {
        return res.status(400).json({
          success: false,
          error: "Ranked options array is required for ranked choice voting"
        });
      }
      voteParams.rankedOptions = rankedOptions;
    }
    
    // Cast vote on blockchain
    const result = await blockchainService.castVote(address, voteParams, privateKey);
    
    return res.status(200).json({
      success: true,
      address,
      transactionHash: result.transactionHash
    });
  } catch (error) {
    console.error(`Failed to cast vote for session ${req.params.address}:`, error);
    return res.status(500).json({
      success: false,
      error: "Failed to cast vote",
      message: error.message
    });
  }
}

/**
 * Check if a voter has already voted
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
async function hasVoted(req, res) {
  try {
    const { address, voter } = req.params;
    
    if (!address || !ethers.utils.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: "Invalid session address"
      });
    }
    
    if (!voter || !ethers.utils.isAddress(voter)) {
      return res.status(400).json({
        success: false,
        error: "Invalid voter address"
      });
    }
    
    // Check if voter has voted
    const voted = await blockchainService.hasVoted(address, voter);
    
    return res.status(200).json({
      success: true,
      address,
      voter,
      hasVoted: voted
    });
  } catch (error) {
    console.error(`Failed to check if voter ${req.params.voter} has voted in session ${req.params.address}:`, error);
    return res.status(500).json({
      success: false,
      error: "Failed to check if voter has voted",
      message: error.message
    });
  }
}

/**
 * Get all sessions for a team leader
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 */
async function getTeamLeaderSessions(req, res) {
  try {
    const { address } = req.params;
    
    if (!address || !ethers.utils.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: "Invalid team leader address"
      });
    }
    
    // Get sessions from blockchain
    const sessions = await blockchainService.getTeamLeaderSessions(address);
    
    // Get metadata for each session
    const sessionsWithMetadata = await Promise.all(
      sessions.map(async (sessionAddress) => {
        try {
          const onChainDetails = await blockchainService.getSessionDetails(sessionAddress);
          
          let metadata = null;
          try {
            metadata = await metadataService.getMetadata(sessionAddress);
          } catch (error) {
            // Ignore missing metadata
          }
          
          return {
            address: sessionAddress,
            onChain: onChainDetails,
            offChain: metadata
          };
        } catch (error) {
          console.error(`Failed to get details for session ${sessionAddress}:`, error);
          return {
            address: sessionAddress,
            error: error.message
          };
        }
      })
    );
    
    return res.status(200).json({
      success: true,
      teamLeader: address,
      sessions: sessionsWithMetadata
    });
  } catch (error) {
    console.error(`Failed to get sessions for team leader ${req.params.address}:`, error);
    return res.status(500).json({
      success: false,
      error: "Failed to get team leader sessions",
      message: error.message
    });
  }
}

module.exports = {
  initialize,
  createSession,
  getSessionStatus,
  getSessionDetails,
  getSessionVotes,
  endSession,
  startSession,
  castVote,
  hasVoted,
  getTeamLeaderSessions
}; 