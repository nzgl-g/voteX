serve# Blockchain Voting System

A decentralized voting system built on Ethereum that enables Team Leaders to create and manage isolated voting sessions.

## Features

- Modular and isolated voting sessions
- Team Leader controlled sessions
- Support for multiple voting types:
  - **Poll** - Simple polling with options
  - **Election** - Formal election with candidates
- Support for multiple voting modes:
  - **Single Choice** - Traditional one vote per voter
  - **Multiple Choice** - Select up to N options
  - **Ranked Choice** - Rank options by preference
- Gas-efficient design with minimal on-chain storage
- Protection against double voting

## Contract Architecture

1. **VotingFactory.sol**
   - Factory contract for deploying new voting sessions
   - Maintains registry of all deployed sessions
   - Maps Team Leaders to their sessions

2. **VotingSession.sol**
   - Standalone contract for each voting session
   - Controlled by the creator (Team Leader)
   - Manages the full voting lifecycle
   - Stores votes and results on-chain

3. **VoteCounter.sol**
   - Helper contract for vote tallying
   - Provides utilities for different voting modes
   - Includes functions for ranked choice calculations

## Getting Started

### Prerequisites

- Node.js v14 or later
- NPM or Yarn

### Installation

```shell
# Install dependencies
npm install

# Compile contracts
npx hardhat compile
```

### Testing

Run the test suite to ensure everything is working correctly:

```shell
npx hardhat test
```

### Deployment

Deploy to a local Hardhat network:

```shell
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

Deploy to a testnet (e.g., Sepolia):

```shell
npx hardhat run scripts/deploy.js --network sepolia
```

## Usage

### Creating a Voting Session

1. Deploy the `VotingFactory` contract
2. Call `createVotingSession` with:
   - Options array
   - Session type (0: Poll, 1: Election)
   - Voting mode (0: Single, 1: Multiple, 2: Ranked)
   - Session name
   - Mode-specific parameters

### Starting and Ending a Session

The Team Leader who created the session can:
- Call `startSession()` to open voting
- Call `endSession()` to close voting

### Voting

Voters can participate using one of these functions:
- `voteSingle(optionIndex)` - For single choice voting
- `voteMultiple([optionIndexes])` - For multiple choice voting
- `voteRanked([rankedOptions])` - For ranked choice voting

### Getting Results

- `getResults()` - Returns vote counts for each option
- `getVoterRankedChoices(voterAddress)` - Gets a voter's ranked choices

## License

MIT
