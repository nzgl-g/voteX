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
  - Response Example:
    ```json
    {
      "success": true,
      "status": {
        "isInitialized": true,
        "providerConnected": true,
        "factoryConnected": true,
        "factoryAddress": "0x1234..."
      },
      "sessionTypes": {
        "POLL": 0,
        "ELECTION": 1
      },
      "votingModes": {
        "SINGLE": 0,
        "MULTIPLE": 1,
        "RANKED": 2
      },
      "sessionStates": {
        "CREATED": 0,
        "STARTED": 1,
        "ENDED": 2
      }
    }
    ```

### Session Management

- **POST /blockchain/create-session**
  - Purpose: Create a new voting session
  - Body:
    ```json
    {
      "options": ["Option A", "Option B", "Option C"],
      "sessionType": 0,
      "votingMode": 0,
      "sessionName": "My Voting Session",
      "maxChoices": 2,
      "minRankedChoices": 1,
      "maxRankedChoices": 3,
      "privateKey": "0x...",
      "description": "Session description",
      "category": "general",
      "tags": ["tag1", "tag2"]
    }
    ```
  - Required Fields:
    - `options`: Array of option strings
    - `sessionType`: 0 (Poll) or 1 (Election)
    - `votingMode`: 0 (Single), 1 (Multiple), or 2 (Ranked)
    - `sessionName`: Name of the session
    - `privateKey`: Ethereum private key for signing the transaction
  - Optional Fields:
    - `maxChoices`: For multiple choice voting
    - `minRankedChoices`: For ranked choice voting
    - `maxRankedChoices`: For ranked choice voting
    - `description`: Optional session description
    - `category`: Optional session category
    - `tags`: Optional array of tags
  - Response Example:
    ```json
    {
      "success": true,
      "sessionAddress": "0x5678...",
      "transactionHash": "0x9abc...",
      "metadata": {
        "sessionAddress": "0x5678...",
        "teamLeaderAddress": "0xdef0...",
        "sessionName": "My Voting Session",
        "description": "Session description",
        "category": "general",
        "tags": ["tag1", "tag2"]
      }
    }
    ```

- **GET /blockchain/session/:address/status**
  - Purpose: Check session state
  - Parameters:
    - `address`: Ethereum address of the voting session
  - Response Example:
    ```json
    {
      "success": true,
      "address": "0x5678...",
      "state": 1,
      "sessionType": 0,
      "votingMode": 0,
      "votesCount": 5
    }
    ```

- **GET /blockchain/session/:address/details**
  - Purpose: Get session details
  - Parameters:
    - `address`: Ethereum address of the voting session
  - Response Example:
    ```json
    {
      "success": true,
      "onChain": {
        "address": "0x5678...",
        "name": "My Voting Session",
        "sessionType": 0,
        "votingMode": 0,
        "state": 1,
        "maxChoices": 0,
        "minRankedChoices": 0,
        "maxRankedChoices": 0,
        "options": ["Option A", "Option B", "Option C"],
        "teamLeader": "0xdef0...",
        "votesCount": 5
      },
      "offChain": {
        "sessionAddress": "0x5678...",
        "teamLeaderAddress": "0xdef0...",
        "sessionName": "My Voting Session",
        "description": "Session description",
        "category": "general",
        "tags": ["tag1", "tag2"],
        "state": 1,
        "startTime": "2023-05-01T12:00:00.000Z",
        "createdAt": "2023-05-01T10:00:00.000Z",
        "updatedAt": "2023-05-01T12:00:00.000Z"
      }
    }
    ```

- **GET /blockchain/session/:address/votes**
  - Purpose: Get voting results
  - Parameters:
    - `address`: Ethereum address of the voting session
  - Response Example:
    ```json
    {
      "success": true,
      "address": "0x5678...",
      "results": {
        "votingMode": 0,
        "votesCount": 5,
        "options": ["Option A", "Option B", "Option C"],
        "results": [
          { "option": "Option A", "votes": 3 },
          { "option": "Option B", "votes": 1 },
          { "option": "Option C", "votes": 1 }
        ]
      }
    }
    ```

- **POST /blockchain/session/:address/start**
  - Purpose: Start a voting session
  - Parameters:
    - `address`: Ethereum address of the voting session
  - Body:
    ```json
    {
      "privateKey": "0x..."
    }
    ```
  - Required Fields:
    - `privateKey`: Ethereum private key for signing the transaction
  - Response Example:
    ```json
    {
      "success": true,
      "address": "0x5678...",
      "transactionHash": "0x9abc..."
    }
    ```

- **POST /blockchain/session/:address/end**
  - Purpose: End a voting session
  - Parameters:
    - `address`: Ethereum address of the voting session
  - Body:
    ```json
    {
      "privateKey": "0x..."
    }
    ```
  - Required Fields:
    - `privateKey`: Ethereum private key for signing the transaction
  - Response Example:
    ```json
    {
      "success": true,
      "address": "0x5678...",
      "transactionHash": "0x9abc..."
    }
    ```

### Voting

- **POST /blockchain/session/:address/vote**
  - Purpose: Cast a vote
  - Parameters:
    - `address`: Ethereum address of the voting session
  - Body (Single Choice):
    ```json
    {
      "privateKey": "0x...",
      "optionIndex": 1
    }
    ```
  - Body (Multiple Choice):
    ```json
    {
      "privateKey": "0x...",
      "optionIndexes": [0, 2]
    }
    ```
  - Body (Ranked Choice):
    ```json
    {
      "privateKey": "0x...",
      "rankedOptions": [1, 0, 2]
    }
    ```
  - Required Fields:
    - `privateKey`: Ethereum private key for signing the transaction
    - One of the following based on voting mode:
      - `optionIndex`: For single choice voting
      - `optionIndexes`: Array for multiple choice voting
      - `rankedOptions`: Array for ranked choice voting
  - Response Example:
    ```json
    {
      "success": true,
      "address": "0x5678...",
      "transactionHash": "0x9abc..."
    }
    ```

- **GET /blockchain/session/:address/has-voted/:voter**
  - Purpose: Check if a voter has already voted
  - Parameters:
    - `address`: Ethereum address of the voting session
    - `voter`: Ethereum address of the voter
  - Response Example:
    ```json
    {
      "success": true,
      "address": "0x5678...",
      "voter": "0xabcd...",
      "hasVoted": true
    }
    ```

### Team Leader

- **GET /blockchain/team-leader/:address/sessions**
  - Purpose: Get all sessions created by a team leader
  - Parameters:
    - `address`: Ethereum address of the team leader
  - Response Example:
    ```json
    {
      "success": true,
      "teamLeader": "0xdef0...",
      "sessions": [
        {
          "address": "0x5678...",
          "onChain": {
            "name": "My Voting Session",
            "sessionType": 0,
            "votingMode": 0,
            "state": 1,
            "options": ["Option A", "Option B", "Option C"],
            "votesCount": 5
          },
          "offChain": {
            "description": "Session description",
            "category": "general",
            "tags": ["tag1", "tag2"]
          }
        },
        {
          "address": "0x9012...",
          "onChain": {
            "name": "Another Session",
            "sessionType": 1,
            "votingMode": 1,
            "state": 0,
            "options": ["Candidate A", "Candidate B"],
            "votesCount": 0
          },
          "offChain": {
            "description": "Election session",
            "category": "election",
            "tags": ["important"]
          }
        }
      ]
    }
    ```

## MetaMask Integration

To integrate MetaMask with this API without changing the bridge code, you can:

1. Use MetaMask to sign transactions in the frontend instead of passing private keys
2. Use the bridge API for read operations that don't require signatures

### Example with MetaMask:

```javascript
// For read operations, use the bridge API directly
async function getSessionDetails(sessionAddress) {
  const response = await fetch(`/blockchain/session/${sessionAddress}/details`);
  return response.json();
}

// For write operations, use MetaMask to sign and send transactions
async function createSessionWithMetaMask(sessionParams) {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }
  
  try {
    // Request account access
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const account = accounts[0];
    
    // Get contract ABI and address
    const factoryAddress = "0x..."; // Your VotingFactory address
    const factoryABI = [...]; // Your VotingFactory ABI
    
    // Create web3 contract instance
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const factoryContract = new ethers.Contract(factoryAddress, factoryABI, signer);
    
    // Call contract method directly
    const tx = await factoryContract.createVotingSession(
      sessionParams.options,
      sessionParams.sessionType,
      sessionParams.votingMode,
      sessionParams.sessionName,
      sessionParams.maxChoices || 0,
      sessionParams.minRankedChoices || 0,
      sessionParams.maxRankedChoices || 0
    );
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    // Get session address from event
    const event = receipt.events.find(e => e.event === 'SessionCreated');
    const sessionAddress = event.args.sessionAddress;
    
    // Store metadata separately
    await fetch('/blockchain/create-session-metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionAddress,
        teamLeaderAddress: account,
        ...sessionParams,
        description: sessionParams.description || "",
        category: sessionParams.category || "general",
        tags: sessionParams.tags || []
      })
    });
    
    return {
      success: true,
      sessionAddress,
      transactionHash: receipt.transactionHash
    };
  } catch (error) {
    console.error("Failed to create session with MetaMask:", error);
    throw error;
  }
}
```

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