const express = require('express');
const router = express.Router();
const blockchainController = require('../utils/blockchainController');
const Session = require('../models/Sessions');
const auth = require('../middleware/auth');
const isTeamLeader = require('../middleware/isTeamLeader');

// Initialize blockchain controller
router.post('/initialize', auth, async (req, res) => {
  try {
    const { privateKey, contractAddress } = req.body;
    
    if (!privateKey || !contractAddress) {
      return res.status(400).json({
        success: false,
        message: 'Private key and contract address are required'
      });
    }
    
    await blockchainController.initialize(privateKey, contractAddress);
    
    return res.status(200).json({
      success: true,
      message: 'Blockchain controller initialized successfully'
    });
  } catch (error) {
    console.error('Error initializing blockchain controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initialize blockchain controller',
      error: error.message
    });
  }
});

// Get blockchain controller status
router.get('/status', auth, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        initialized: blockchainController.initialized,
        contractAddress: blockchainController.contractAddress
      }
    });
  } catch (error) {
    console.error('Error getting blockchain status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get blockchain status',
      error: error.message
    });
  }
});

// Start a session on the blockchain
router.post('/sessions/:sessionId/start', auth, isTeamLeader, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Check if blockchain controller is initialized
    if (!blockchainController.initialized) {
      return res.status(500).json({
        success: false,
        message: 'Blockchain controller not initialized'
      });
    }
    
    // Find session in database
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: `Session ${sessionId} not found`
      });
    }
    
    // Check if session is already started in blockchain
    const isActive = await blockchainController.isSessionActive(sessionId);
    if (isActive) {
      return res.status(400).json({
        success: false,
        message: `Session ${sessionId} is already active on the blockchain`
      });
    }
    
    // Prepare choices based on session type
    let choices = [];
    let voteMode = session.subtype; // Use subtype (single, multiple, ranked)
    
    if (session.type === 'election') {
      // For elections, get candidate IDs
      choices = session.candidates.map(candidate => candidate._id.toString());
    } else if (session.type === 'poll') {
      // For polls, get option IDs
      choices = session.options.map(option => option._id.toString());
    } else if (session.type === 'tournament') {
      // For tournaments, get participant IDs
      choices = session.participants.map(participant => participant._id.toString());
    }
    
    // Create session on blockchain
    const result = await blockchainController.createSession(sessionId, choices, voteMode);
    
    // Update session status in database
    session.sessionLifecycle.startedAt = new Date();
    await session.save();
    
    // Emit an event via socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(sessionId).emit('session-started', {
        sessionId,
        timestamp: new Date()
      });
    }
    
    return res.status(200).json({
      success: true,
      message: `Session ${sessionId} started on blockchain successfully`,
      data: result
    });
  } catch (error) {
    console.error(`Error starting session on blockchain:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to start session on blockchain',
      error: error.message
    });
  }
});

// End a session on the blockchain
router.post('/sessions/:sessionId/end', auth, isTeamLeader, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Check if blockchain controller is initialized
    if (!blockchainController.initialized) {
      return res.status(500).json({
        success: false,
        message: 'Blockchain controller not initialized'
      });
    }
    
    // Find session in database
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: `Session ${sessionId} not found`
      });
    }
    
    // Check if session is active on blockchain
    const isActive = await blockchainController.isSessionActive(sessionId);
    if (!isActive) {
      return res.status(400).json({
        success: false,
        message: `Session ${sessionId} is not active on the blockchain or doesn't exist`
      });
    }
    
    // End session on blockchain
    const result = await blockchainController.endSession(sessionId);
    
    // Update session status in database
    session.sessionLifecycle.endedAt = new Date();
    
    // Fetch final results from blockchain
    const blockchainResults = await blockchainController.getSessionResults(sessionId);
    session.results = blockchainResults.results;
    
    await session.save();
    
    // Emit an event via socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(sessionId).emit('session-ended', {
        sessionId,
        timestamp: new Date(),
        results: blockchainResults
      });
    }
    
    return res.status(200).json({
      success: true,
      message: `Session ${sessionId} ended on blockchain successfully`,
      data: {
        transaction: result,
        results: blockchainResults
      }
    });
  } catch (error) {
    console.error(`Error ending session on blockchain:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to end session on blockchain',
      error: error.message
    });
  }
});

// Get session details from blockchain
router.get('/sessions/:sessionId', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Check if blockchain controller is initialized
    if (!blockchainController.initialized) {
      return res.status(500).json({
        success: false,
        message: 'Blockchain controller not initialized'
      });
    }
    
    // Get blockchain session details
    const isActive = await blockchainController.isSessionActive(sessionId);
    
    if (!isActive) {
      // Check if session exists
      try {
        await blockchainController.getSessionChoices(sessionId);
      } catch (error) {
        return res.status(404).json({
          success: false,
          message: `Session ${sessionId} not found on blockchain`
        });
      }
    }
    
    const choices = await blockchainController.getSessionChoices(sessionId);
    const voteMode = await blockchainController.getSessionVoteMode(sessionId);
    
    return res.status(200).json({
      success: true,
      data: {
        sessionId,
        active: isActive,
        choices,
        voteMode
      }
    });
  } catch (error) {
    console.error(`Error getting blockchain session details:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get blockchain session details',
      error: error.message
    });
  }
});

// Get session results from blockchain
router.get('/sessions/:sessionId/results', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Check if blockchain controller is initialized
    if (!blockchainController.initialized) {
      return res.status(500).json({
        success: false,
        message: 'Blockchain controller not initialized'
      });
    }
    
    // Check if session exists on blockchain
    try {
      await blockchainController.getSessionChoices(sessionId);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: `Session ${sessionId} not found on blockchain`
      });
    }
    
    // Get session results
    const results = await blockchainController.getSessionResults(sessionId);
    
    return res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error(`Error getting blockchain session results:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get blockchain session results',
      error: error.message
    });
  }
});

// Check if voter has voted in a session
router.get('/sessions/:sessionId/hasVoted/:voterAddress', auth, async (req, res) => {
  try {
    const { sessionId, voterAddress } = req.params;
    
    // Check if blockchain controller is initialized
    if (!blockchainController.initialized) {
      return res.status(500).json({
        success: false,
        message: 'Blockchain controller not initialized'
      });
    }
    
    // Check if voter has voted
    const hasVoted = await blockchainController.hasVoted(sessionId, voterAddress);
    
    return res.status(200).json({
      success: true,
      data: {
        sessionId,
        voterAddress,
        hasVoted
      }
    });
  } catch (error) {
    console.error(`Error checking if voter has voted:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check if voter has voted',
      error: error.message
    });
  }
});

module.exports = router; 