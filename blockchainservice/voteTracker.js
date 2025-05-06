const express = require('express');
const router = express.Router();
const blockchainController = require('./blockchainController');

/**
 * @route   GET /votex/api/sessions/:sessionId/vote
 * @desc    Check if voting is active for a session
 * @access  Public
 */
router.get('/:sessionId/vote', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Check if blockchain is initialized
    if (!blockchainController.getStatus().isInitialized) {
      return res.status(503).json({
        success: false,
        message: 'Blockchain service not initialized'
      });
    }
    
    // Check if session is active
    const isActive = await blockchainController.isSessionActive(sessionId);
    
    if (!isActive) {
      return res.status(400).json({
        success: false,
        message: 'Session is not active on the blockchain'
      });
    }
    
    // Get vote mode
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
    console.error(`Error checking voting status:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to check voting status',
      error: error.message
    });
  }
});

/**
 * @route   GET /votex/api/sessions/:sessionId/vote/results
 * @desc    Get formatted voting results
 * @access  Public
 */
router.get('/:sessionId/vote/results', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Check if blockchain is initialized
    if (!blockchainController.getStatus().isInitialized) {
      return res.status(503).json({
        success: false,
        message: 'Blockchain service not initialized'
      });
    }
    
    // Get results from blockchain
    const blockchainResults = await blockchainController.getSessionResults(sessionId);
    
    // Format results based on session type
    // This is a placeholder - in a real implementation, you'd look up the session type and candidates/options
    const formattedResults = {
      sessionId,
      resultsRaw: blockchainResults.results,
      choices: blockchainResults.choices,
      total: Object.values(blockchainResults.results).reduce((a, b) => a + b, 0)
    };
    
    res.status(200).json({
      success: true,
      data: formattedResults
    });
  } catch (error) {
    console.error(`Error getting voting results:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to get voting results',
      error: error.message
    });
  }
});

/**
 * @route   POST /votex/api/sessions/:sessionId/vote/track
 * @desc    Track a vote in the database
 * @access  Public (but would typically be secured)
 */
router.post('/:sessionId/vote/track', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId, walletAddress, transactionHash } = req.body;
    
    if (!userId || !walletAddress || !transactionHash) {
      return res.status(400).json({
        success: false,
        message: 'userId, walletAddress, and transactionHash are required'
      });
    }
    
    // This is a placeholder for database interaction
    // In a real implementation, you would update the SessionParticipant model
    console.log(`Tracking vote for session ${sessionId}:`, {
      userId,
      walletAddress,
      transactionHash
    });
    
    // Placeholder for database update
    // const updated = await SessionParticipant.findOneAndUpdate(
    //   { userId, sessionId },
    //   { walletAddress, voteTransactionHash: transactionHash },
    //   { new: true }
    // );
    
    res.status(200).json({
      success: true,
      message: 'Vote tracked successfully',
      data: {
        sessionId,
        userId,
        walletAddress,
        transactionHash
      }
    });
  } catch (error) {
    console.error(`Error tracking vote:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to track vote',
      error: error.message
    });
  }
});

module.exports = router; 