const express = require('express');
const router = express.Router();
const contractService = require('./contractService');
const { validate, schemas } = require('./validation');
const logger = require('../lib/logger');

// Initialize contract connection
router.get('/initialize', async (req, res) => {
    try {
        const isInitialized = await contractService.initialize();
        res.json({ 
            success: true, 
            message: 'Contract initialized successfully',
            isInitialized 
        });
    } catch (error) {
        logger.error('Contract initialization failed:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Contract initialization failed',
            details: error.message 
        });
    }
});

// Create a new voting session
router.post('/session/start', validate(schemas.createSession), async (req, res) => {
    try {
        const { sessionId, choices, voteMode } = req.body;
        const txHash = await contractService.createSession(sessionId, choices, voteMode);
        res.json({ 
            success: true, 
            message: 'Session created successfully',
            txHash 
        });
    } catch (error) {
        logger.error('Session creation failed:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Session creation failed',
            details: error.message 
        });
    }
});

// End a voting session
router.post('/session/end', validate(schemas.endSession), async (req, res) => {
    try {
        const { sessionId } = req.body;
        const txHash = await contractService.endSession(sessionId);
        res.json({ 
            success: true, 
            message: 'Session ended successfully',
            txHash 
        });
    } catch (error) {
        logger.error('Session end failed:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Session end failed',
            details: error.message 
        });
    }
});

// Get session status and results
router.get('/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const sessionStatus = await contractService.getSessionStatus(sessionId);
        res.json({ 
            success: true, 
            data: sessionStatus 
        });
    } catch (error) {
        logger.error('Session status retrieval failed:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Session status retrieval failed',
            details: error.message 
        });
    }
});

// Cast a vote (SINGLE or MULTIPLE mode)
router.post('/vote', validate(schemas.castVote), async (req, res) => {
    try {
        const { sessionId, choiceIds } = req.body;
        const txHash = await contractService.castVote(sessionId, choiceIds);
        res.json({ 
            success: true, 
            message: 'Vote cast successfully',
            txHash 
        });
    } catch (error) {
        logger.error('Vote casting failed:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Vote casting failed',
            details: error.message 
        });
    }
});

// Cast a ranked vote
router.post('/vote/ranked', validate(schemas.castRankedVote), async (req, res) => {
    try {
        const { sessionId, rankedChoices } = req.body;
        const txHash = await contractService.castRankedVote(sessionId, rankedChoices);
        res.json({ 
            success: true, 
            message: 'Ranked vote cast successfully',
            txHash 
        });
    } catch (error) {
        logger.error('Ranked vote casting failed:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ranked vote casting failed',
            details: error.message 
        });
    }
});

module.exports = router; 