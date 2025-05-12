# Blockchain Integration for Session Management

## Overview

This implementation enables blockchain integration for session management in the voting system. Users can now deploy sessions to the blockchain when starting them, and properly end them on the blockchain when the session ends.

## Components Implemented

1. **Blockchain Service (`services/blockchain-service.ts`)**
   - A service to handle blockchain interactions using ethers.js
   - Provides methods for connecting to MetaMask, deploying sessions, ending sessions, and retrieving wallet addresses
   - Handles the conversion of session data to blockchain-compatible parameters

2. **Session Profile Updates (`components/session-profile/profile.tsx`)**
   - Added blockchain integration to Start Session, End Session, and Delete Session buttons
   - Added confirmation dialogs for blockchain interactions
   - Added loading states and error handling for blockchain operations

3. **Session Model Updates**
   - Added `contractAddress` field to frontend Session interface
   - Backend model already had the required field

## Functionality

### Starting a Session
When a user clicks "Start Session":
1. The application connects to MetaMask and requests account access
2. Once connected, a confirmation dialog shows the user's wallet address and session details
3. Upon confirmation, the session is deployed to the blockchain using the VoteSessionFactory contract
4. The resulting contract address is stored in the database along with the session start time

### Ending a Session
When a user clicks "End Session":
1. The application connects to MetaMask and requests account access
2. A confirmation dialog shows the session details
3. Upon confirmation, the session is marked as ended in the blockchain
4. The session end time is updated in the database

### Deleting a Session
When a user clicks "Delete Session":
1. If the session has a blockchain contract, the user is informed that the contract will be abandoned (cannot be deleted from blockchain)
2. The session is removed from the database

## Blockchain Contracts

The implementation uses two main contracts:

1. **VoteSessionFactory**: Creates new voting session contracts
2. **VoteSession**: Individual voting session contract that manages votes for a specific session

## Technical Notes

- Uses ethers.js v6 for blockchain interactions
- Uses Web3Provider via MetaMask for account access
- Maps session types to blockchain voting modes (single, multiple, ranked)
- Handles all blockchain errors gracefully with user feedback via toast notifications
- Stores contract addresses in the database for future reference

## Future Enhancements

1. Add ability to view past votes on the blockchain for completed sessions
2. Implement vote casting functionality directly from the voter portal
3. Add a blockchain explorer link for deployed sessions
4. Implement a custom blockchain event listener for real-time updates

## Requirements

- MetaMask extension must be installed in the browser
- User needs to have an Ethereum wallet with sufficient funds for gas fees
- Supported networks: local (Ganache), Sepolia testnet

## How to Test

1. Ensure MetaMask is installed and connected to a supported network
2. Create a new session with candidates or options
3. Click "Start Session" to deploy to blockchain
4. Confirm the transaction in MetaMask
5. Wait for the transaction to be mined
6. Verify that the contract address appears in the session details
7. When ready, click "End Session" to end the session on the blockchain 