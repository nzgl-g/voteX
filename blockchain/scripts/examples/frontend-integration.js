/**
 * Frontend Integration Example
 * 
 * This file shows how to integrate the blockchain contracts with a frontend app.
 * It uses ethers.js v6 and can be adapted for use in a Next.js application.
 */

// Import ethers and our contract interface
const { ethers } = require('ethers');
const VoteSystemBlockchain = require('../utils/contract-interface');

// These would come from your environment variables or config
const FACTORY_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Example address

/**
 * Connect to MetaMask or other injected provider
 */
async function connectWallet() {
  // In browser environment
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Create ethers provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      console.log('Connected to wallet:', accounts[0]);
      
      return { provider, signer, account: accounts[0] };
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
      throw error;
    }
  } else {
    throw new Error('MetaMask not available');
  }
}

/**
 * Get vote system blockchain interface
 */
function getVoteSystem(provider, signer) {
  const voteSystem = new VoteSystemBlockchain(provider, FACTORY_ADDRESS);
  
  if (signer) {
    voteSystem.connect(signer);
  }
  
  return voteSystem;
}

/**
 * Example: Create a new voting session
 */
async function createVotingSession(signer, sessionData) {
  try {
    const voteSystem = getVoteSystem(signer.provider, signer);
    
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
 * Example: Cast a vote in a voting session
 */
async function castVote(signer, sessionAddress, choices, ranks = []) {
  try {
    const voteSystem = getVoteSystem(signer.provider, signer);
    
    console.log('Casting vote with choices:', choices);
    if (ranks.length > 0) {
      console.log('With ranks:', ranks);
    }
    
    const receipt = await voteSystem.vote(sessionAddress, choices, ranks);
    
    console.log('Vote cast successfully in transaction:', receipt.hash);
    return receipt;
  } catch (error) {
    console.error('Error casting vote:', error);
    throw error;
  }
}

/**
 * Example: Get voting results
 */
async function getVotingResults(provider, sessionAddress) {
  try {
    const voteSystem = getVoteSystem(provider);
    
    const results = await voteSystem.getResults(sessionAddress);
    
    console.log('Voting results:', results);
    return results;
  } catch (error) {
    console.error('Error getting results:', error);
    throw error;
  }
}

/**
 * Example: Check if user has voted
 */
async function checkIfVoted(provider, sessionAddress, userAddress) {
  try {
    const voteSystem = getVoteSystem(provider);
    
    const hasVoted = await voteSystem.hasVoted(sessionAddress, userAddress);
    
    console.log('User has voted:', hasVoted);
    return hasVoted;
  } catch (error) {
    console.error('Error checking vote status:', error);
    throw error;
  }
}

/**
 * Example: Get session details
 */
async function getSessionDetails(provider, sessionAddress) {
  try {
    const voteSystem = getVoteSystem(provider);
    
    const details = await voteSystem.getSessionDetails(sessionAddress);
    
    console.log('Session details:', details);
    return details;
  } catch (error) {
    console.error('Error getting session details:', error);
    throw error;
  }
}

// In a Next.js component, you might use these functions like this:
/*
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
// Import the functions above or create similar ones

export default function VotingComponent() {
  const [wallet, setWallet] = useState(null);
  const [sessionAddress, setSessionAddress] = useState('0x...');
  const [choice, setChoice] = useState('');
  const [results, setResults] = useState(null);
  
  // Connect wallet on component mount
  useEffect(() => {
    async function connect() {
      try {
        const connection = await connectWallet();
        setWallet(connection);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    }
    
    connect();
  }, []);
  
  // Get session details and results
  useEffect(() => {
    if (wallet && sessionAddress) {
      getSessionDetails(wallet.provider, sessionAddress)
        .then(details => console.log('Session details:', details));
      
      getVotingResults(wallet.provider, sessionAddress)
        .then(results => setResults(results));
    }
  }, [wallet, sessionAddress]);
  
  // Handle vote submission
  async function handleVote() {
    if (!wallet || !sessionAddress || !choice) return;
    
    try {
      await castVote(wallet.signer, sessionAddress, [choice]);
      alert('Vote cast successfully!');
      
      // Refresh results
      const newResults = await getVotingResults(wallet.provider, sessionAddress);
      setResults(newResults);
    } catch (error) {
      console.error('Error casting vote:', error);
      alert('Failed to cast vote: ' + error.message);
    }
  }
  
  // Render component
  return (
    <div>
      <h1>Voting Session</h1>
      {wallet ? (
        <p>Connected: {wallet.account}</p>
      ) : (
        <button onClick={connectWallet}>Connect Wallet</button>
      )}
      
      {results && (
        <div>
          <h2>Current Results</h2>
          <ul>
            {results.participants.map((participant, index) => (
              <li key={index}>
                {participant}: {results.votes[index]} votes
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div>
        <h2>Cast Your Vote</h2>
        <select value={choice} onChange={e => setChoice(e.target.value)}>
          <option value="">Select an option</option>
          {results && results.participants.map((participant, index) => (
            <option key={index} value={participant}>
              {participant}
            </option>
          ))}
        </select>
        <button onClick={handleVote} disabled={!wallet || !choice}>
          Submit Vote
        </button>
      </div>
    </div>
  );
}
*/

module.exports = {
  connectWallet,
  getVoteSystem,
  createVotingSession,
  castVote,
  getVotingResults,
  checkIfVoted,
  getSessionDetails
}; 