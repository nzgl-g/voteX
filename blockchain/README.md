# Blockchain Documentation

This document provides a deep dive into the blockchain components of the vote system.

## Overview

The blockchain layer is responsible for managing vote sessions and recording votes in a decentralized and transparent manner. It consists of two main smart contracts:

1.  `VoteSession.sol`: Manages an individual voting session.
2.  `VoteSessionFactory.sol`: A factory contract used to create and manage instances of `VoteSession` contracts.

Interaction with these contracts is primarily done through the backend server, which calls the necessary functions based on user actions in the frontend.

## Smart Contracts

### 1. `VoteSession.sol`

This contract represents a single voting session.

**State Variables:**

*   `sessionId`: (uint256) A unique identifier for the session.
*   `participants`: (string[]) An array of strings representing the names or identifiers of the candidates/options in the vote.
*   `endTimestamp`: (uint256) The Unix timestamp marking the end of the voting period.
*   `voteMode`: (Enum: `VoteMode.Single`, `VoteMode.Multiple`) Defines whether a voter can select only one participant or multiple.
    *   `Single`: Voter can choose only one participant.
    *   `Multiple`: Voter can choose up to `maxChoices` participants.
*   `maxChoices`: (uint8) If `voteMode` is `Multiple`, this specifies the maximum number of participants a voter can choose.
*   `creator`: (address) The Ethereum address of the account that created this vote session (via the factory).
*   `participantVotes`: (mapping string => uint256) Maps each participant's identifier to their total vote count.
*   `hasVoted`: (mapping address => bool) Tracks whether an address has already cast a vote in this session.
*   `voters`: (address[]) An array storing the addresses of all voters who have participated.

**Events:**

*   `VoteCast(address indexed voter, string[] choices)`: Emitted when a vote is successfully cast.
    *   `voter`: The address of the voter.
    *   `choices`: An array of participant identifiers that the voter selected.

**Constructor:**

*   `constructor(uint256 _sessionId, string[] memory _participants, uint256 _endTimestamp, VoteMode _voteMode, uint8 _maxChoices, address _creator)`: Initializes a new `VoteSession`.
    *   Requires at least one participant.
    *   Requires the `_endTimestamp` to be in the future.
    *   If `_voteMode` is `Multiple`, `_maxChoices` must be greater than 0 and less than or equal to the number of participants.

**Modifiers:**

*   `onlyActive()`: Requires that the current block timestamp is before `endTimestamp`. Used to restrict actions to active voting periods.
*   `notVoted()`: Requires that the `msg.sender` (the interacting address) has not already voted.

**Functions:**

*   `vote(string[] memory choices) external onlyActive notVoted`:
    *   Allows a user to cast their vote.
    *   Input `choices`: An array of participant identifiers.
    *   Validates based on `voteMode`:
        *   `Single` mode: `choices` array must have exactly one element.
        *   `Multiple` mode: `choices` array length must be between 1 and `maxChoices` (inclusive).
    *   Validates that all `choices` are valid participants in the session.
    *   Marks the voter's address in `hasVoted`.
    *   Adds the voter's address to the `voters` array.
    *   Increments the vote count for each chosen participant in `participantVotes`.
    *   Emits the `VoteCast` event.
*   `getResults() external view returns (string[] memory participantNames, uint256[] memory voteCounts)`:
    *   Returns the current voting results.
    *   `participantNames`: The list of all participants.
    *   `voteCounts`: The corresponding vote counts for each participant.
*   `getStatus() external view returns (bool isActive, uint256 remainingTime)`:
    *   Returns the current status of the voting session.
    *   `isActive`: True if `block.timestamp < endTimestamp`, false otherwise.
    *   `remainingTime`: Time remaining in seconds until the session ends (0 if already ended).
*   `getVoterCount() external view returns (uint256)`:
    *   Returns the total number of unique voters who have cast a vote.
*   `checkVoted(address voter) external view returns (bool)`:
    *   Checks if a specific `voter` address has already cast a vote in this session.

### 2. `VoteSessionFactory.sol`

This contract acts as a factory to deploy and manage `VoteSession` contracts. This approach is used to avoid deploying a new contract manually for each session and to keep track of all created sessions.

**State Variables:**

*   `sessions`: (mapping uint256 => address) Maps a `sessionId` to the deployed address of the corresponding `VoteSession` contract.
*   `sessionCreators`: (mapping uint256 => address) Maps a `sessionId` to the address of the account that created the session.
*   `allSessionIds`: (uint256[]) An array that stores all `sessionId`s created through this factory.

**Events:**

*   `SessionCreated(uint256 indexed sessionId, address sessionAddress, address creator)`: Emitted when a new `VoteSession` is successfully created and deployed.
    *   `sessionId`: The unique ID of the new session.
    *   `sessionAddress`: The address of the deployed `VoteSession` contract.
    *   `creator`: The address that initiated the creation of this session.

**Functions:**

*   `createVoteSession(uint256 sessionId, string[] memory participants, uint256 endTimestamp, VoteSession.VoteMode mode, uint8 maxChoices) external returns (address sessionAddress)`:
    *   Deploys a new `VoteSession` contract.
    *   `sessionId`: Unique identifier for the new session. Must not already exist.
    *   `participants`: List of participant names/identifiers for the new session.
    *   `endTimestamp`: Unix timestamp when the new session will end.
    *   `mode`: Vote mode (`Single` or `Multiple`) for the new session.
    *   `maxChoices`: Maximum number of choices allowed if `mode` is `Multiple`.
    *   The `msg.sender` of this transaction becomes the `creator` of the `VoteSession`.
    *   Stores the new session's address in the `sessions` mapping and its ID in `allSessionIds`.
    *   Stores the creator's address in `sessionCreators`.
    *   Emits the `SessionCreated` event.
    *   Returns the address of the newly deployed `VoteSession` contract.
*   `getAllSessionIds() external view returns (uint256[] memory)`:
    *   Returns an array of all `sessionId`s that have been created through this factory.
*   `getSessionCount() external view returns (uint256)`:
    *   Returns the total number of vote sessions created by this factory.

## Deployment

The contracts are deployed using Hardhat. The deployment script is located at `scripts/deploy.js`.

**`scripts/deploy.js`:**

This script performs the following actions:

1.  Gets the contract factory for `VoteSessionFactory`.
2.  Deploys an instance of `VoteSessionFactory`.
3.  Waits for the deployment to be confirmed.
4.  Prints the address of the deployed `VoteSessionFactory` contract to the console.

Only the `VoteSessionFactory` contract needs to be deployed initially. Individual `VoteSession` contracts are then created by calling the `createVoteSession` function on the deployed factory.

## Blockchain Interactions

The backend server is the primary interactor with the deployed blockchain contracts. Here's a typical flow:

1.  **Session Creation (Team Leader/Member via Backend):**
    *   The backend, upon request (e.g., from a team leader creating a new vote), calls the `createVoteSession` function on the deployed `VoteSessionFactory` contract.
    *   The backend provides the `sessionId` (likely generated or retrieved from the application's database), `participants`, `endTimestamp`, `voteMode`, and `maxChoices`.
    *   The factory deploys a new `VoteSession` contract and returns its address. The backend stores this address associated with the session ID for future interactions.
    *   The `SessionCreated` event can be monitored by the backend to confirm creation and log details.

2.  **Casting a Vote (Voter via Backend):**
    *   When a voter submits their vote through the frontend, the request goes to the backend.
    *   The backend identifies the correct `VoteSession` contract address based on the session the user is voting in.
    *   The backend (or a trusted relayer service if gas fees for users are abstracted) calls the `vote` function on the specific `VoteSession` contract instance.
    *   The `choices` (participant identifiers) selected by the voter are passed as an argument.
    *   The `VoteSession` contract validates the vote (session active, voter hasn't voted, valid choices) and records it.
    *   The `VoteCast` event is emitted, which the backend can listen for to confirm the vote and update application state.

3.  **Fetching Session Status and Results (Any User via Backend):**
    *   To display session information (e.g., if it's active, time remaining, current results), the backend calls:
        *   `getStatus()` on the `VoteSession` contract to get activity status and remaining time.
        *   `getResults()` on the `VoteSession` contract to get the list of participants and their vote counts.
        *   `getVoterCount()` on the `VoteSession` contract to get the number of voters.
        *   `checkVoted(address)` on the `VoteSession` contract to check if a specific user has already voted (e.g., to update UI accordingly).

4.  **Listing All Sessions (Backend for Frontend Display):**
    *   The backend can call `getAllSessionIds()` on the `VoteSessionFactory` to get a list of all session IDs.
    *   For each ID, it can then retrieve the `VoteSession` contract address from the `sessions` mapping in `VoteSessionFactory`.
    *   With the individual `VoteSession` addresses, the backend can fetch details for each session to display to users.

## Security and Considerations

*   **Gas Costs:** Deploying `VoteSession` contracts and casting votes costs gas. The `VoteSessionFactory` pattern helps manage deployments. For user voting, consider if the backend will cover gas fees or if users will pay directly (requiring them to have ETH and a wallet like MetaMask).
*   **Session ID Uniqueness:** The `createVoteSession` function in `VoteSessionFactory` requires `sessionId` to be unique. The backend application must ensure this uniqueness when calling the function.
*   **Participant Identifiers:** The `string` type for participant identifiers is flexible but requires exact matches for voting and result aggregation. Ensure consistency in how these are handled between the frontend, backend, and smart contract. Hashing (as done in `VoteSession.vote` for comparison) helps, but the original string identifiers are stored and used for vote counting.
*   **Oracle for Timestamps:** The contract relies on `block.timestamp`. While generally reliable, its precision and potential for miner manipulation (though unlikely for small stakes) are known aspects of blockchain development.
*   **Off-chain Data:** While core voting logic is on-chain, details like candidate profiles, extended session descriptions, etc., will likely be stored off-chain in the application's database and linked via the `sessionId`.
*   **Upgradability:** These contracts are not currently designed to be upgradable. If future changes are needed, a new factory and new session contracts would need to be deployed, and data migration strategies would have to be considered. For critical systems, consider using proxy patterns (e.g., UUPS or Transparent Upgradeable Proxy) from the start.

## Future Enhancements

*   **Gasless Voting for Users:** Implement meta-transactions or a relayer system so users don't need ETH to vote.
*   **Weighted Voting:** Extend `VoteSession` to support weighted votes if required.
*   **Private Voting:** Explore zero-knowledge proofs or other cryptographic techniques if vote privacy (beyond pseudonymity of addresses) is a requirement.
*   **DAO Governance Features:** For more complex governance, integrate features like proposal submissions, token-based voting power, etc.

This documentation should provide a solid understanding of the blockchain components and their interactions within the broader voting system. 