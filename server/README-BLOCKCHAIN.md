# Blockchain Integration Guide

This document explains how the backend server integrates with the blockchain voting system.

## Overview

The server interacts with the blockchain for the following purposes:

1. **Session Management**: Creating and ending voting sessions on the blockchain.
2. **Vote Management**: Processing and verifying votes from users.
3. **Result Retrieval**: Getting voting results from the blockchain.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Ensure the blockchain project is set up and running:
   - The smart contracts should be deployed to a local or test network
   - The contract address and ABI files should be copied to `../../blockchain/contracts_info/`

3. Configure environment variables:
   - Create a `.env` file in the server directory with:
   
```
BLOCKCHAIN_PROVIDER_URL=http://localhost:8545
ADMIN_PRIVATE_KEY=admin_wallet_private_key_without_0x_prefix
VOTING_SYSTEM_CONTRACT_ADDRESS=deployed_contract_address
```

## Initialization

The blockchain service must be initialized before use. This usually happens when the server starts:

```javascript
// In index.js or a startup script
const blockchainController = require('./utils/blockchainController');

async function initializeBlockchain() {
  try {
    const privateKey = process.env.ADMIN_PRIVATE_KEY;
    const contractAddress = process.env.VOTING_SYSTEM_CONTRACT_ADDRESS;
    const providerUrl = process.env.BLOCKCHAIN_PROVIDER_URL;
    
    await blockchainController.initialize(privateKey, contractAddress, providerUrl);
    console.log('Blockchain integration initialized successfully');
  } catch (error) {
    console.error('Failed to initialize blockchain integration:', error);
  }
}

initializeBlockchain();
```

## API Routes

The server provides several API endpoints for blockchain interaction:

### Initialization

- `POST /api/blockchain/initialize`: Initialize the blockchain controller with a private key and contract address.

### Session Management

- `POST /api/blockchain/sessions/:sessionId/start`: Manually start a session on the blockchain.
- `POST /api/blockchain/sessions/:sessionId/end`: Manually end a session on the blockchain.
- `POST /api/blockchain/sessions/:sessionId/schedule/start`: Schedule a session to start at a specific time.
- `POST /api/blockchain/sessions/:sessionId/schedule/end`: Schedule a session to end at a specific time.

### Status and Results

- `GET /api/blockchain/sessions/:sessionId/status`: Check if a session is active on the blockchain.
- `GET /api/blockchain/sessions/:sessionId/results`: Get voting results for a session from the blockchain.

## Vote Mode Mapping

The server maps session subtypes to blockchain vote modes:

| Session Subtype | Blockchain Vote Mode |
|-----------------|----------------------|
| `single`        | SINGLE (0)           |
| `multiple`      | MULTIPLE (1)         |
| `ranked`        | RANKED (2)           |

## Workflow

1. **Session Creation**:
   - When a session is created in the database, it is not immediately created on the blockchain.
   - The session is created on the blockchain when it starts (either manually or at the scheduled start time).

2. **Vote Casting**:
   - Votes are cast directly to the blockchain by the user's wallet
   - The blockchain emits events that the server listens for to update the UI in real-time

3. **Session Ending**:
   - When a session is ended (either manually or at the scheduled end time), the server calls the blockchain
   - The blockchain prevents any further votes and finalizes the results
   - The server retrieves the results and stores them in the database

## Security Considerations

- The server uses a dedicated admin wallet for blockchain interactions.
- Only the server can create and end sessions on the blockchain.
- Voters use their own wallets to sign votes, ensuring authentication and preventing double-voting.
- All votes are recorded on the blockchain, providing transparency and auditability.

## Event Listening

The server listens for blockchain events to update the UI in real-time:

```javascript
// Event listener setup
blockchainService.listenForVoteEvents((eventData) => {
  // eventData contains information about the vote
  const { sessionId, voter, timestamp, transactionHash, blockNumber } = eventData;
  
  // Notify clients via Socket.io
  io.to(sessionId).emit('vote-cast', {
    sessionId,
    voter,
    timestamp
  });
});
```

## Testing

For development and testing, a mock endpoint is provided:

- `POST /api/blockchain/mock/sessions/:sessionId/vote`: Simulates a vote without actual blockchain interaction. 