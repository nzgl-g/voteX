/**
 * Vote Routes
 * 
 * Express routes for voting operations on the blockchain.
 */

const express = require('express');
const router = express.Router();
const voteController = require('../controllers/voteController');

/**
 * @route POST /vote/cast
 * @desc Cast a vote in a session
 * @access Private
 */
router.post('/cast', async (req, res) => {
  try {
    const { sessionId, voterId, choiceId, weight } = req.body;
    
    // Validate request body
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    if (!voterId) {
      return res.status(400).json({ error: 'Voter ID is required' });
    }
    
    if (!choiceId) {
      return res.status(400).json({ error: 'Choice ID is required' });
    }
    
    // Call controller method
    const result = await voteController.castVote({
      sessionId,
      voterId,
      choiceId,
      weight: weight || 1
    });
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error casting vote:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /vote/:sessionId/:voterId/has-voted
 * @desc Check if a voter has already voted in a session
 * @access Public
 */
router.get('/:sessionId/:voterId/has-voted', async (req, res) => {
  try {
    const { sessionId, voterId } = req.params;
    
    // Call controller method
    const result = await voteController.hasVoted(sessionId, voterId);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    
    return res.status(200).json(result);
  } catch (error) {
    console.error(`Error checking if voter ${req.params.voterId} has voted in session ${req.params.sessionId}:`, error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router; 