/**
 * Backend Integration Example
 * 
 * This file shows how to integrate the blockchain contracts with a Node.js backend.
 * It uses ethers.js v6 and can be adapted for use in an Express.js application.
 */

const { ethers } = require('ethers');
const VoteSystemBlockchain = require('../utils/contract-interface');
require('dotenv').config();

// These would come from your environment variables
const PROVIDER_URL = process.env.PROVIDER_URL || 'http://localhost:8545';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000000';
const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

/**
 * Initialize blockchain connection with admin wallet
 */
function initBlockchainConnection() {
  try {
    // Create provider from URL
    const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
    
    // Create wallet from private key
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    // Create vote system interface
    const voteSystem = new VoteSystemBlockchain(provider, FACTORY_ADDRESS);
    voteSystem.connect(wallet);
    
    console.log('Blockchain connection initialized');
    console.log('Connected wallet address:', wallet.address);
    
    return { provider, wallet, voteSystem };
  } catch (error) {
    console.error('Error initializing blockchain connection:', error);
    throw error;
  }
}

/**
 * Example: Create a new voting session
 */
async function createVotingSession(voteSystem, sessionData) {
  try {
    const {
      sessionId,
      participants,
      endTimestamp,
      mode,
      maxChoices
    } = sessionData;
    
    console.log('Creating session with data:', sessionData);
    
    const sessionAddress = await voteSystem.createSession(
      sessionId,
      participants,
      endTimestamp,
      mode,
      maxChoices
    );
    
    console.log('Session created at address:', sessionAddress);
    return sessionAddress;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

/**
 * Example: Poll for latest voting results
 */
async function pollVotingResults(voteSystem, sessionAddress, intervalMs = 10000) {
  console.log(`Starting to poll results for session ${sessionAddress} every ${intervalMs}ms`);
  
  // Initial fetch
  let results = await voteSystem.getResults(sessionAddress);
  console.log('Initial results:', results);
  
  // Set up interval
  const intervalId = setInterval(async () => {
    try {
      const status = await voteSystem.getStatus(sessionAddress);
      
      if (!status.isActive) {
        console.log('Voting session has ended. Final results:');
        results = await voteSystem.getResults(sessionAddress);
        console.log(results);
        clearInterval(intervalId);
        return;
      }
      
      results = await voteSystem.getResults(sessionAddress);
      console.log('Updated results:', results);
    } catch (error) {
      console.error('Error polling results:', error);
    }
  }, intervalMs);
  
  // Return a function to stop polling
  return () => clearInterval(intervalId);
}

/**
 * Example: Track session events
 */
async function trackSessionEvents(provider, sessionAddress) {
  try {
    const voteSystem = new VoteSystemBlockchain(provider, FACTORY_ADDRESS);
    const session = voteSystem.getSession(sessionAddress);
    
    // Listen for vote cast events
    session.on('VoteCast', (voter, choices, event) => {
      console.log('Vote cast by:', voter);
      console.log('Choices:', choices);
      console.log('Transaction:', event.log.transactionHash);
    });
    
    // Listen for ranked vote cast events
    session.on('RankedVoteCast', (voter, choices, ranks, event) => {
      console.log('Ranked vote cast by:', voter);
      console.log('Choices:', choices);
      console.log('Ranks:', ranks.map(r => Number(r)));
      console.log('Transaction:', event.log.transactionHash);
    });
    
    console.log(`Now tracking events for session at ${sessionAddress}`);
    
    // Return a function to stop tracking
    return () => {
      session.removeAllListeners();
      console.log('Stopped tracking events');
    };
  } catch (error) {
    console.error('Error setting up event tracking:', error);
    throw error;
  }
}

/**
 * Example: Get all sessions and their details
 */
async function getAllSessions(voteSystem) {
  try {
    // Get all session IDs
    const sessionIds = await voteSystem.getAllSessionIds();
    console.log('All session IDs:', sessionIds.map(id => Number(id)));
    
    // Get details for each session
    const sessionPromises = [];
    for (const id of sessionIds) {
      const address = await voteSystem.getSessionAddress(id);
      if (address !== ethers.ZeroAddress) {
        sessionPromises.push(voteSystem.getSessionDetails(address));
      }
    }
    
    const sessions = await Promise.all(sessionPromises);
    console.log('All sessions:', sessions);
    
    return sessions;
  } catch (error) {
    console.error('Error getting all sessions:', error);
    throw error;
  }
}

// Example of using these functions in an Express.js API:
/*
const express = require('express');
const app = express();
app.use(express.json());

// Initialize blockchain connection
const { provider, voteSystem } = initBlockchainConnection();

// Create a new voting session
app.post('/api/sessions', async (req, res) => {
  try {
    const sessionData = req.body;
    const sessionAddress = await createVotingSession(voteSystem, sessionData);
    
    res.status(201).json({
      success: true,
      sessionAddress,
      message: 'Session created successfully'
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get session results
app.get('/api/sessions/:address/results', async (req, res) => {
  try {
    const { address } = req.params;
    const results = await voteSystem.getResults(address);
    
    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error getting results:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all sessions
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await getAllSessions(voteSystem);
    
    res.json({
      success: true,
      sessions
    });
  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
*/

module.exports = {
  initBlockchainConnection,
  createVotingSession,
  pollVotingResults,
  trackSessionEvents,
  getAllSessions
}; 