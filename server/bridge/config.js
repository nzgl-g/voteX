/**
 * Configuration for blockchain bridge
 * Handles settings and constants for blockchain communication
 */

const config = {
  // Default provider URL (can be overridden by environment variables)
  defaultProviderUrl: process.env.BLOCKCHAIN_PROVIDER_URL || "http://127.0.0.1:8545",
  
  // Contract addresses
  contracts: {
    // Factory contract address (should be set after deployment)
    votingFactory: process.env.VOTING_FACTORY_ADDRESS || "",
    
    // VoteCounter contract address (if deployed separately)
    voteCounter: process.env.VOTE_COUNTER_ADDRESS || ""
  },
  
  // Session types mapping
  sessionTypes: {
    POLL: 0,
    ELECTION: 1
  },
  
  // Voting modes mapping
  votingModes: {
    SINGLE: 0,
    MULTIPLE: 1,
    RANKED: 2
  },
  
  // Session states mapping
  sessionStates: {
    CREATED: 0,
    STARTED: 1,
    ENDED: 2
  },
  
  // Gas settings
  gas: {
    limit: process.env.GAS_LIMIT || 3000000,
    price: process.env.GAS_PRICE || "20000000000" // 20 gwei
  },
  
  // Metadata storage configuration
  metadata: {
    // Could be 'ipfs', 'database', etc.
    storageType: process.env.METADATA_STORAGE_TYPE || 'database'
  }
};

module.exports = config; 