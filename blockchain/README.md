# Blockchain Voting System

This project contains the smart contracts and deployment scripts for a blockchain-based voting system. The system supports three voting modes: single choice, multiple choice, and ranked choice voting.

## Prerequisites

- Node.js (14+)
- npm or yarn
- Hardhat

## Installation

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root with your private key (for deployment):

```
PRIVATE_KEY=your_private_key_here_without_0x_prefix
```

## Running a Local Node

To run a local Ethereum node for development and testing:

```bash
npx hardhat node
```

This will start a local Ethereum network at http://localhost:8545.

## Testing

To run tests:

```bash
npx hardhat test
```

## Deployment

To deploy the contracts to a local network:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

To deploy to another network (e.g., a testnet), update the `hardhat.config.cjs` file with the appropriate network configuration and then run:

```bash
npx hardhat run scripts/deploy.js --network <network_name>
```

After deployment, the contract address and ABI will be saved to the `contracts_info` directory.

## Contract Overview

The main contract is `VotingSystem.sol`, which includes:

- `createSession(string sessionId, string[] choices, VoteMode voteMode)`: Creates a new voting session.
- `endSession(string sessionId)`: Ends an active voting session.
- `castVote(string sessionId, string[] choiceIds)`: Casts votes for a session (for SINGLE or MULTIPLE modes).
- `castRankedVote(string sessionId, string[] rankedChoices)`: Casts ranked votes for a session (for RANKED mode).
- Various getter functions to check session status, results, and voting modes.

## Integration with Server

The contracts are designed to be integrated with the backend server, which handles:

1. Creating sessions in the database
2. Starting/ending sessions on the blockchain at the appropriate times
3. Listening for vote events
4. Retrieving and storing results

See the server documentation for more details on the integration.

## Vote Modes

The contract supports three voting modes:

1. `SINGLE`: Voters select exactly one option.
2. `MULTIPLE`: Voters can select multiple options.
3. `RANKED`: Voters rank options in order of preference.

The votes are stored on-chain, ensuring transparency and security.
