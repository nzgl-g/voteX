# Blockchain Service for Voting System

This service provides a bridge between the voting application and the Ethereum blockchain. It handles session lifecycle management, vote tracking, and result retrieval from the blockchain.

## Structure

- `blockchainController.js` - Core functionality for interacting with the blockchain
- `blockchainRoutes.js` - API routes for blockchain management
- `voteTracker.js` - Routes for vote tracking and result display
- `sessionScheduler.js` - Utilities for scheduling session events
- `index.js` - Main entry point for the service

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
BLOCKCHAIN_PRIVATE_KEY=0x...  # Private key with 0x prefix
CONTRACT_ADDRESS=0x...        # Deployed contract address
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545  # Optional, defaults to localhost
```

## Usage

### In Your Express Application

```javascript
const express = require('express');
const app = express();
const initBlockchainService = require('./blockchainservice');

// Initialize the blockchain service
const blockchainService = initBlockchainService(app);

// Later, you can use the blockchain service in other parts of your application
// Example: Schedule blockchain events for a new session
const session = await Session.findById(sessionId);
const { scheduleEvents } = blockchainService;
await scheduleEvents([session]);
```

### Manual Initialization (if not using environment variables)

```bash
curl -X POST http://localhost:2000/votex/api/blockchain/initialize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"privateKey": "0x...", "contractAddress": "0x..."}'
```

## API Endpoints

### Blockchain Management
- `POST /votex/api/blockchain/initialize` - Initialize the blockchain service
- `GET /votex/api/blockchain/status` - Check service status
- `POST /votex/api/blockchain/sessions/:sessionId/start` - Start voting on blockchain
- `POST /votex/api/blockchain/sessions/:sessionId/end` - End voting on blockchain
- `GET /votex/api/blockchain/sessions/:sessionId` - Get session details
- `GET /votex/api/blockchain/sessions/:sessionId/results` - Get raw results
- `GET /votex/api/blockchain/sessions/:sessionId/voter/:address` - Check if address voted

### Vote Tracking
- `GET /votex/api/sessions/:sessionId/vote` - Check if voting is active
- `GET /votex/api/sessions/:sessionId/vote/results` - Get formatted results
- `POST /votex/api/sessions/:sessionId/vote/track` - Track vote in database

## Integration with Sessions

For automatic blockchain session management, modify your session creation/update logic to call the session scheduler:

```javascript
const { scheduleSessionBlockchainEvents } = require('./blockchainservice/sessionScheduler');

// After creating or updating a session
await scheduleSessionBlockchainEvents(session);
```

## Requirements

- Node.js 16+
- Running Ethereum node (local or testnet)
- Deployed VotingSystem contract
- Express server application

## Error Handling

The service includes comprehensive error handling and will log detailed error messages. Check your application logs for any issues during operation.

## Security Notes

- Store private keys securely using environment variables
- Implement proper authentication for blockchain management endpoints
- Validate all blockchain transactions before committing to database 