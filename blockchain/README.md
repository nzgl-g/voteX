# Vote System - Blockchain Component

This directory contains the blockchain component of the Vote System, built using Solidity smart contracts and Hardhat.

## Architecture

The blockchain component consists of two main contracts:

1. **VoteSessionFactory** - A factory contract that creates and tracks individual voting sessions.
2. **VoteSession** - Individual voting session contracts that handle the voting logic.

### Voting Modes

The system supports three voting modes:

- **Single** - Users can vote for exactly one option
- **Multiple** - Users can vote for up to N options
- **Ranked** - Users can rank their choices (1st, 2nd, 3rd, etc.)

## Prerequisites

- Node.js (v14+)
- npm or yarn
- MetaMask or another Ethereum wallet for testing

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file with the following variables:

```
PRIVATE_KEY=your_private_key_without_0x_prefix
INFURA_API_KEY=your_infura_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Development

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm test
```

### Start Local Node

```bash
npm run node
```

This will start a local Hardhat node at http://127.0.0.1:8545.

## Deployment

### Deploy to Local Node

```bash
npm run deploy:local
```

### Deploy to Ganache

Make sure Ganache is running at http://127.0.0.1:7545, then:

```bash
npm run deploy:ganache
```

### Deploy to Sepolia Testnet

```bash
npm run deploy:sepolia
```

## Integration

### Backend Integration

To integrate with the backend, use the utility functions in `scripts/examples/backend-integration.js`. 

The backend can:
- Deploy new voting sessions
- Poll for voting results
- Listen for voting events
- Fetch all session data

### Frontend Integration

To integrate with the frontend, use the utility functions in `scripts/examples/frontend-integration.js`.

The frontend can:
- Connect to MetaMask
- Cast votes
- View session details and results
- Check if a user has already voted

## Contract Interface

The blockchain contracts expose the following main functionalities:

### VoteSessionFactory

- `createVoteSession(uint256 sessionId, string[] memory participants, uint256 endTimestamp, VoteMode mode, uint8 maxChoices)` - Creates a new voting session
- `getAllSessionIds()` - Returns all session IDs
- `getSessionCount()` - Returns the number of sessions

### VoteSession

- `vote(string[] memory choices, uint8[] memory ranks)` - Cast a vote
- `getResults()` - Get voting results
- `getStatus()` - Check if session is active and get remaining time
- `getVoterCount()` - Get number of voters
- `checkVoted(address voter)` - Check if an address has voted

## Data Flow

1. Team Leader creates a session in the frontend
2. Frontend calls backend API to store session metadata
3. When session is started, user confirms transaction via MetaMask
4. Session is deployed on-chain via the factory contract
5. Backend stores the contract address alongside off-chain data
6. Voters connect their wallets and cast votes on-chain
7. Backend polls for results and updates the database

## License

MIT
