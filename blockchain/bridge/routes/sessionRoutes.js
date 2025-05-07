/**
 * Session Routes
 * 
 * Express routes for session management on the blockchain.
 */

const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

/**
 * @route POST /sessions/create
 * @desc Create a new session on the blockchain
 * @access Private
 */
router.post('/create', async (req, res) => {
  try {
    const { sessionId, choices, voteMode } = req.body;
    
    // Validate request body
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    if (!choices || !Array.isArray(choices) || choices.length === 0) {
      return res.status(400).json({ error: 'Choices must be a non-empty array' });
    }
    
    if (!voteMode) {
      return res.status(400).json({ error: 'Vote mode is required' });
    }
    
    // Call controller method
    const result = await sessionController.createSession({ sessionId, choices, voteMode });
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    
    return res.status(201).json(result);
  } catch (error) {
    console.error('Error creating session:', error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /sessions/:sessionId/end
 * @desc End a session on the blockchain
 * @access Private
 */
router.post('/:sessionId/end', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Call controller method
    const result = await sessionController.endSession(sessionId);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    
    return res.status(200).json(result);
  } catch (error) {
    console.error(`Error ending session ${req.params.sessionId}:`, error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /sessions/:sessionId/active
 * @desc Check if a session is active
 * @access Public
 */
router.get('/:sessionId/active', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Call controller method
    const result = await sessionController.isSessionActive(sessionId);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    
    return res.status(200).json(result);
  } catch (error) {
    console.error(`Error checking if session ${req.params.sessionId} is active:`, error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /sessions/:sessionId/choices
 * @desc Get session choices
 * @access Public
 */
router.get('/:sessionId/choices', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Call controller method
    const result = await sessionController.getSessionChoices(sessionId);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    
    return res.status(200).json(result);
  } catch (error) {
    console.error(`Error getting session ${req.params.sessionId} choices:`, error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /sessions/:sessionId/vote-mode
 * @desc Get session vote mode
 * @access Public
 */
router.get('/:sessionId/vote-mode', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Call controller method
    const result = await sessionController.getSessionVoteMode(sessionId);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    
    return res.status(200).json(result);
  } catch (error) {
    console.error(`Error getting session ${req.params.sessionId} vote mode:`, error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /sessions/:sessionId/results
 * @desc Get session results
 * @access Public
 */
router.get('/:sessionId/results', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Call controller method
    const result = await sessionController.getSessionResults(sessionId);
    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    
    return res.status(200).json(result);
  } catch (error) {
    console.error(`Error getting session ${req.params.sessionId} results:`, error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router; 