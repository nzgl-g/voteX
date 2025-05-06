const express = require('express');
const router = express.Router();
const blockchainController = require('./blockchainController');

// Middleware to check if blockchain is initialized
const requireBlockchainInit = (req, res, next) => {
  try {
    if (!blockchainController.getStatus().isInitialized) {
      return res.status(503).json({
        success: false,
        message: 'Blockchain service not initialized. Please initialize first.'
      });
    }
    next();
  } catch (error) {
    console.error('Error in blockchain middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error in blockchain service',
      error: error.message
    });
  }
};

/**
 * @route   POST /votex/api/blockchain/initialize
 * @desc    Initialize blockchain controller with private key and contract address
 * @access  Admin only
 */
router.post('/initialize', async (req, res) => {
  try {
    const { privateKey, contractAddress } = req.body;
    
    if (!privateKey || !contractAddress) {
      return res.status(400).json({
        success: false,
        message: 'Private key and contract address are required'
      });
    }
    
    // Validate private key format
    if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
      return res.status(400).json({
        success: false,
        message: 'Invalid private key format. Must start with 0x and be 64 hex characters.'
      });
    }
    
    // Validate contract address format
    if (!contractAddress.startsWith('0x') || contractAddress.length !== 42) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contract address format. Must start with 0x and be 40 hex characters.'
      });
    }
    
    await blockchainController.initialize(privateKey, contractAddress);
    
    res.status(200).json({
      success: true,
      message: 'Blockchain service initialized successfully',
      status: blockchainController.getStatus()
    });
  } catch (error) {
    console.error('Error initializing blockchain:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize blockchain service',
      error: error.message
    });
  }
});

/**
 * @route   GET /votex/api/blockchain/status
 * @desc    Get blockchain controller status
 * @access  Public
 */
router.get('/status', (req, res) => {
  try {
    const status = blockchainController.getStatus();
    res.status(200).json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Error getting blockchain status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blockchain status',
      error: error.message
    });
  }
});

/**
 * @route   POST /votex/api/blockchain/sessions/:sessionId/start
 * @desc    Start a voting session on the blockchain
 * @access  Admin only
 */
router.post('/sessions/:sessionId/start', requireBlockchainInit, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { choices, voteType } = req.body;
    
    if (!choices || !Array.isArray(choices) || choices.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Choices array is required and cannot be empty'
      });
    }
    
    if (!voteType) {
      return res.status(400).json({
        success: false,
        message: 'Vote type is required (single, multiple, or ranked)'
      });
    }
    
    const result = await blockchainController.createSession(sessionId, choices, voteType);
    
    res.status(200).json({
      success: true,
      message: 'Session started on blockchain successfully',
      data: result
    });
  } catch (error) {
    console.error(`Error starting session on blockchain:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to start session on blockchain',
      error: error.message
    });
  }
});

/**
 * @route   POST /votex/api/blockchain/sessions/:sessionId/end
 * @desc    End a voting session on the blockchain
 * @access  Admin only
 */
router.post('/sessions/:sessionId/end', requireBlockchainInit, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const result = await blockchainController.endSession(sessionId);
    
    res.status(200).json({
      success: true,
      message: 'Session ended on blockchain successfully',
      data: result
    });
  } catch (error) {
    console.error(`Error ending session on blockchain:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to end session on blockchain',
      error: error.message
    });
  }
});

/**
 * @route   GET /votex/api/blockchain/sessions/:sessionId
 * @desc    Get session details from blockchain
 * @access  Public
 */
router.get('/sessions/:sessionId', requireBlockchainInit, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Get session status
    const isActive = await blockchainController.isSessionActive(sessionId);
    const voteMode = await blockchainController.getSessionVoteMode(sessionId);
    
    res.status(200).json({
      success: true,
      data: {
        sessionId,
        isActive,
        voteMode
      }
    });
  } catch (error) {
    console.error(`Error getting session details from blockchain:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to get session details from blockchain',
      error: error.message
    });
  }
});

/**
 * @route   GET /votex/api/blockchain/sessions/:sessionId/results
 * @desc    Get voting results from blockchain
 * @access  Public
 */
router.get('/sessions/:sessionId/results', requireBlockchainInit, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const results = await blockchainController.getSessionResults(sessionId);
    
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error(`Error getting session results from blockchain:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to get session results from blockchain',
      error: error.message
    });
  }
});

/**
 * @route   GET /votex/api/blockchain/sessions/:sessionId/voter/:address
 * @desc    Check if an address has voted in a session
 * @access  Public
 */
router.get('/sessions/:sessionId/voter/:address', requireBlockchainInit, async (req, res) => {
  try {
    const { sessionId, address } = req.params;
    
    // Validate address format
    if (!address.startsWith('0x') || address.length !== 42) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Ethereum address format. Must start with 0x and be 40 hex characters.'
      });
    }
    
    const hasVoted = await blockchainController.hasAddressVoted(sessionId, address);
    
    res.status(200).json({
      success: true,
      data: {
        sessionId,
        address,
        hasVoted
      }
    });
  } catch (error) {
    console.error(`Error checking if address has voted:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to check voting status',
      error: error.message
    });
  }
});

module.exports = router; 