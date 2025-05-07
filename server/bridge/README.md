# Blockchain Bridge

A server-side bridge module that handles communication between the backend server and the blockchain voting system.

## Overview

The Blockchain Bridge provides a RESTful API for interacting with the blockchain voting system. It serves as a middleware between the frontend application and the blockchain, handling the complexities of blockchain interactions and providing a clean, standardized interface.

## Architecture

The bridge consists of the following components:

1. **API Routes** - RESTful endpoints for voting session management and voting
2. **Blockchain Service** - Service for interacting with the blockchain contracts
3. **Metadata Service** - Service for storing and retrieving additional session metadata
4. **Controllers** - Business logic for handling API requests

## API Endpoints

### Initialization

- **GET /blockchain/initialize**
  - Purpose: Pre-check before session deployment
  - Returns: Blockchain readiness status, configuration options

### Session Management

- **POST /blockchain/create-session**
  - Purpose: Create a new voting session
  - Body:
    - `options`: Array of option strings
    - `sessionType`: 0 (Poll) or 1 (Election)
    - `votingMode`: 0 (Single), 1 (Multiple), or 2 (Ranked)
    - `sessionName`: Name of the session
    - `maxChoices`: For multiple choice voting
    - `minRankedChoices`: For ranked choice voting
    - `maxRankedChoices`: For ranked choice voting
    - `privateKey`: Ethereum private key for signing the transaction
    - `description`: Optional session description
    - `category`: Optional session category
    - `tags`: Optional array of tags

- **GET /blockchain/session/:address/status**
  - Purpose: Check session state
  - Returns: Session status (Created, Started, or Ended)

- **GET /blockchain/session/:address/details**
  - Purpose: Get session details
  - Returns: On-chain and off-chain session data

- **GET /blockchain/session/:address/votes**
  - Purpose: Get voting results
  - Returns: Vote counts for each option

- **POST /blockchain/session/:address/start**
  - Purpose: Start a voting session
  - Body:
    - `privateKey`: Ethereum private key for signing the transaction

- **POST /blockchain/session/:address/end**
  - Purpose: End a voting session
  - Body:
    - `privateKey`: Ethereum private key for signing the transaction

### Voting

- **POST /blockchain/session/:address/vote**
  - Purpose: Cast a vote
  - Body:
    - `privateKey`: Ethereum private key for signing the transaction
    - `optionIndex`: For single choice voting
    - `optionIndexes`: Array for multiple choice voting
    - `rankedOptions`: Array for ranked choice voting

- **GET /blockchain/session/:address/has-voted/:voter**
  - Purpose: Check if a voter has already voted
  - Returns: Boolean indicating whether the voter has voted

### Team Leader

- **GET /blockchain/team-leader/:address/sessions**
  - Purpose: Get all sessions created by a team leader
  - Returns: Array of session details

## Usage Examples

### Initialize

```javascript
// Check blockchain readiness
fetch('/blockchain/initialize')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('Blockchain is ready');
    } else {
      console.error('Blockchain is not ready');
    }
  });
```

### Create a Session

```javascript
// Create a new voting session
fetch('/blockchain/create-session', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    sessionName: 'My Voting Session',
    sessionType: 0, // Poll
    votingMode: 0, // Single choice
    options: ['Option A', 'Option B', 'Option C'],
    privateKey: '0x...' // Ethereum private key
  })
})
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('Session created:', data.sessionAddress);
    } else {
      console.error('Failed to create session:', data.error);
    }
  });
```

### Cast a Vote

```javascript
// Cast a vote in a single choice session
fetch('/blockchain/session/0x123.../vote', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    optionIndex: 1, // Vote for the second option
    privateKey: '0x...' // Ethereum private key
  })
})
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('Vote cast successfully');
    } else {
      console.error('Failed to cast vote:', data.error);
    }
  });
```

## Contract Integration

The bridge interacts with the following smart contracts:

1. **VotingFactory** - Factory contract for creating new voting sessions
2. **VotingSession** - Individual voting session contract
3. **VoteCounter** - Helper contract for vote counting

Make sure these contracts are deployed and their addresses are properly configured.

## Configuration

The bridge can be configured through environment variables:

- `BLOCKCHAIN_PROVIDER_URL` - Ethereum provider URL (default: http://localhost:8545)
- `VOTING_FACTORY_ADDRESS` - Address of the deployed VotingFactory contract
- `VOTE_COUNTER_ADDRESS` - Address of the deployed VoteCounter contract (if used)
- `GAS_LIMIT` - Gas limit for transactions (default: 3000000)
- `GAS_PRICE` - Gas price in wei (default: 20 gwei)

## Security Considerations

1. Private keys should never be stored on the server. They should be transmitted securely and used only for the duration of the transaction.
2. Consider implementing additional authentication and authorization mechanisms to restrict access to the API endpoints.
3. Implement rate limiting to prevent abuse.
4. Use HTTPS for all API communication.

## Error Handling

The API follows a consistent error handling pattern:

- HTTP 400 for client errors (invalid parameters)
- HTTP 500 for server errors (blockchain interaction failures)
- All error responses include `success: false` and an error message 