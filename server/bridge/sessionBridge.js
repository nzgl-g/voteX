/**
 * Session Bridge - Connect blockchain operations to session management
 * 
 * This module provides route handlers for blockchain-related session operations
 */

const express = require('express');
const router = express.Router();
const blockchainBridge = require('./blockchainBridge');
const auth = require('../middleware/auth');
const Session = require('../models/Sessions');
const Team = require('../models/Team');

/**
 * Deploy a session to blockchain
 * 
 * POST /api/blockchain/sessions/:sessionId/deploy
 */
router.post('/sessions/:sessionId/deploy', auth, async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    const { fromTime, candidateIds = [] } = req.body;
    
    // Validate session ID
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    // Fetch session from database
    const session = await Session.findById(sessionId).populate('team');
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Check authorization (team leader only)
    if (!session.team || !session.team.leader.equals(req.user._id)) {
      return res.status(403).json({
        error: 'Only team leader can deploy session to blockchain'
      });
    }
    
    // Check if already deployed
    if (session.contractAddress) {
      return res.status(400).json({
        error: 'Session already deployed to blockchain',
        contractAddress: session.contractAddress
      });
    }
    
    // Prepare participant list for contract
    let participants = [];
    
    if (session.type === 'election' && session.candidates) {
      // For elections, the participants are candidate names/IDs
      participants = session.candidates.map(candidate => 
        candidate._id.toString() || candidate.id.toString()
      );
    } else if (session.type === 'poll' && session.options) {
      // For polls, the participants are option names/IDs
      participants = session.options.map(option => 
        option._id.toString() || option.id.toString()
      );
    } else {
      return res.status(400).json({ 
        error: 'Session has no valid candidates or options to deploy' 
      });
    }
    
    // Calculate end timestamp (from request or session data)
    const endTime = fromTime || 
      (session.sessionLifecycle.endedAt ? new Date(session.sessionLifecycle.endedAt) : 
      session.sessionLifecycle.scheduledAt?.end ? new Date(session.sessionLifecycle.scheduledAt.end) : 
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Default 7 days
    
    const endTimestamp = Math.floor(endTime.getTime() / 1000);
    
    // Get vote mode based on session subtype
    let voteMode = 0; // Single (default)
    if (session.subtype === 'multiple') voteMode = 1;
    if (session.subtype === 'ranked') voteMode = 2;
    
    // Get max choices
    const maxChoices = session.maxChoices || 1;
    
    // Prepare deployment data
    const deploymentData = {
      participants,
      endTimestamp,
      voteMode,
      maxChoices
    };
    
    console.log('Deploying session to blockchain:', deploymentData);
    
    // Deploy to blockchain
    const contractAddress = await blockchainBridge.deploySession(
      sessionId,
      deploymentData
    );
    
    // Update session with contract address
    session.contractAddress = contractAddress;
    
    // Set session as started
    if (!session.sessionLifecycle.startedAt) {
      session.sessionLifecycle.startedAt = new Date();
    }
    
    // Save changes
    await session.save();
    
    // Set up background polling for vote results
    blockchainBridge.pollVoteResults(
      contractAddress,
      async (resultData) => {
        try {
          // Prepare vote counts in the format expected by sessionService
          const voteCounts = resultData.participants.map((id, index) => ({
            id: id,
            votes: resultData.votes[index]
          }));
          
          // Prepare the update data
          const updateData = {
            type: session.type,
            voteCounts,
            voterCount: resultData.voterCount,
            source: 'blockchain'
          };
          
          // Call the session update API
          const apiUrl = `${req.protocol}://${req.get('host')}/api/sessions/${sessionId}/vote-counts`;
          
          // Make a server-side request to update the vote counts
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': req.headers.authorization
            },
            body: JSON.stringify(updateData)
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update vote counts: ${errorText}`);
          }
          
          console.log(`Updated vote counts for session ${sessionId}`);
        } catch (error) {
          console.error(`Error updating vote counts for session ${sessionId}:`, error);
        }
      },
      15000 // Poll every 15 seconds
    );
    
    // Return success with contract address
    res.status(200).json({
      message: 'Session deployed to blockchain successfully',
      contractAddress
    });
  } catch (error) {
    console.error('Error deploying session to blockchain:', error);
    res.status(500).json({
      error: 'Failed to deploy session to blockchain',
      details: error.message
    });
  }
});

/**
 * Get voting results from blockchain
 * 
 * GET /api/blockchain/sessions/:sessionId/results
 */
router.get('/sessions/:sessionId/results', auth, async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    
    // Fetch session to get contract address
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Check if session has contract address
    if (!session.contractAddress) {
      return res.status(400).json({ error: 'Session not deployed to blockchain' });
    }
    
    // Get results from blockchain
    const results = await blockchainBridge.getVoteResults(session.contractAddress);
    
    // Return the results
    res.status(200).json(results);
  } catch (error) {
    console.error('Error getting blockchain results:', error);
    res.status(500).json({
      error: 'Failed to get blockchain results',
      details: error.message
    });
  }
});

/**
 * Check if a contract exists at an address
 * 
 * GET /api/blockchain/contract-exists/:address
 */
router.get('/contract-exists/:address', auth, async (req, res) => {
  try {
    const address = req.params.address;
    
    if (!address || !address.startsWith('0x')) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }
    
    const exists = await blockchainBridge.contractExists(address);
    
    res.status(200).json({ exists });
  } catch (error) {
    console.error('Error checking contract existence:', error);
    res.status(500).json({
      error: 'Failed to check contract existence',
      details: error.message
    });
  }
});

module.exports = router; 