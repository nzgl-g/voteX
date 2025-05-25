# Server Documentation

This document provides a detailed explanation of the server-side application for the blockchain voting system.

## Overview

The server is built with Node.js and Express.js. It handles user authentication, API requests from the frontend, interactions with the MongoDB database (assumed, based on typical MERN/MEAN stack patterns with Mongoose-like model files), and communication with the blockchain smart contracts. It also manages KYC processes and notifications.

## Project Structure

The server directory is organized as follows:

*   **`/index.js`**: The main entry point of the server application. It initializes the Express app, sets up middleware, connects to the database (presumably), and starts the server.
*   **`/node_modules/`**: Contains all npm dependencies.
*   **`/package.json`**: Lists project dependencies and scripts.
*   **`/package-lock.json`** & **`/pnpm-lock.yaml`**: Lock files for npm and pnpm respectively, ensuring consistent dependency installation.
*   **`.gitignore`**: Specifies intentionally untracked files that Git should ignore (e.g., `node_modules`).
*   **`/routes/`**: Contains route handlers for different API endpoints.
*   **`/models/`**: Defines Mongoose (or similar ORM/ODM) schemas and models for database collections.
*   **`/middleware/`**: Houses custom middleware functions used in the request-response cycle (e.g., for authentication, authorization).
*   **`/helpers/`**: Includes utility functions and services used across the application (e.g., email service, KYC service, notification service).
*   **`/validation/`**: Contains schemas or functions for validating incoming request data.
*   **`/startup/`**: Scripts related to the application's startup process (e.g., initializing routes).
*   **`/uploads/`**: (Assumed) Directory for storing uploaded files, if any.

## Core Components

### 1. Entry Point (`index.js`)

*   Initializes the Express application.
*   Likely loads environment variables (e.g., database connection strings, secret keys).
*   Sets up global middleware:
    *   Body parsing (e.g., `express.json()`, `express.urlencoded()`).
    *   CORS handling.
    *   Logging (e.g., Morgan).
    *   Error handling.
*   Connects to the MongoDB database.
*   Calls the route initializer from `/startup/routes.js`.
*   Starts the HTTP server and listens on a configured port.
*   May also initialize a Socket.IO server for real-time communication.

### 2. Routes (`/routes/`)

This directory defines the API endpoints. Each file typically corresponds to a resource or a group of related functionalities:

*   **`candidate.js`**: Handles routes related to candidates, such as applying for candidacy, managing candidate information, and candidate-specific actions.
*   **`invitation.js`**: Manages routes for team invitations (e.g., sending, accepting, declining invitations).
*   **`kyc.js`**: Endpoints for the Know Your Customer (KYC) process, likely involving document submission, status checks, and verification updates.
*   **`login.js`**: Handles user login and authentication.
*   **`notifications.js`**: Routes for fetching and managing user notifications.
*   **`session.js`**: Manages voting sessions. This is a critical part and likely interacts with both the database and the blockchain. Endpoints would include:
    *   Creating new sessions.
    *   Fetching session details (active, upcoming, past).
    *   Fetching session results.
    *   Interacting with `VoteSessionFactory.sol` to create sessions on the blockchain.
    *   Interacting with `VoteSession.sol` to cast votes, get status, and retrieve results.
*   **`signUp.js`**: Handles new user registration.
*   **`task.js`**: Routes related to tasks, possibly for team members or for managing parts of the voting process.
*   **`team.js`**: Manages team-related functionalities, such as creating teams, adding/removing members, and team administration (likely for Team Leaders).
*   **`user.js`**: Handles general user-related operations, such as fetching user profiles, updating user information, etc.

### 3. Models (`/models/`)

These files define the structure of data stored in the database (likely MongoDB, using an ODM like Mongoose).

*   **`CandidateInvitation.js`**: Schema for invitations sent to users to become candidates in a session.
*   **`CandidateRequest.js`**: Schema for requests made by users to become candidates.
*   **`Invitation.js`**: Schema for team membership invitations.
*   **`Notification.js`**: Schema for storing user notifications (e.g., KYC status, session updates, invitation alerts).
*   **`SessionEditRequest.js`**: Schema for requests to edit an existing session's details.
*   **`SessionParticipants.js`**: Schema potentially linking users/candidates to specific sessions as participants/voters.
*   **`Sessions.js`**: Schema for vote sessions. This model is crucial and will store:
    *   Session metadata (name, description, start/end times, rules).
    *   Reference to the on-chain `sessionId` and `sessionAddress` (the deployed `VoteSession` contract address).
    *   Status (e.g., pending, active, nomination, voting, ended, archived).
    *   KYC requirements.
    *   List of candidates (references to `User` or `CandidateRequest` models).
*   **`Task.js`**: Schema for tasks.
*   **`Team.js`**: Schema for teams, likely storing team name, leader, and members.
*   **`User.js`**: Schema for users. This will store:
    *   Basic user information (name, email, password hash).
    *   Role (Team Leader, Team Member, Candidate, Voter).
    *   Wallet address (for blockchain interactions).
    *   KYC status and related information.
    *   References to teams they belong to.

### 4. Middleware (`/middleware/`)

Custom functions that process requests before they reach the route handlers.

*   **`auth.js`**: Authenticates users, likely by verifying JWT tokens sent in request headers. Populates `req.user` with user information if authentication is successful.
*   **`IsAdmin.js`**: Authorization middleware to check if the authenticated user has an admin role (though "Admin" is not one of the defined user roles, this might be for a superuser or a specific type of Team Leader).
*   **`isTeamLeader.js`**: Authorization middleware to ensure only users with the "Team Leader" role can access certain routes.
*   **`isTeamMember.js`**: Authorization middleware to ensure only users with the "Team Member" (and possibly "Team Leader") role can access certain routes.

### 5. Helpers (`/helpers/`)

Utility modules providing reusable logic.

*   **`emailService.js`**: Handles sending emails (e.g., for notifications, invitations, password resets).
*   **`kycService.js`**: Contains logic for interacting with the KYC system/API. This might involve:
    *   Submitting user data for verification.
    *   Checking verification status.
    *   Handling callbacks or webhooks from the KYC provider.
    *   The [kyc/README.md](mdc:kyc/README.md) likely details this interaction further.
*   **`sendNotification.js`**: A generic function or service to create and possibly push notifications to users (e.g., via WebSockets, email, or storing in the `Notification` model).
*   **`sessionValidator.js`**: Helper functions specifically for validating session-related data or logic, possibly before creating or updating sessions on the blockchain or in the database.

### 6. Validation (`/validation/`)

Contains schemas or functions (likely using a library like Joi or Yup) to validate incoming request bodies, query parameters, or path parameters.

*   **`session.js`**: Validation rules for data related to creating or updating sessions.
*   **`user.js`**: Validation rules for user registration, login, or profile updates.

### 7. Startup (`/startup/`)

Modules executed during the server's startup phase.

*   **`routes.js`**: Initializes all API routes by associating paths with their respective router modules from the `/routes/` directory and applying global middleware like error handling for API routes.

## Key Workflows & Blockchain Interaction

The server acts as an intermediary between users (via the frontend) and the blockchain.

1.  **User Management & Authentication:**
    *   Standard sign-up and login processes.
    *   JWTs are likely used for session management.
    *   Role-based access control is enforced by middleware.

2.  **Team Management (Team Leader):**
    *   Team leaders can create teams, invite members, and manage team settings.
    *   Invitations are sent (possibly via `emailService.js` and recorded in `Invitation.js` model).

3.  **Session Creation (Team Leader/Member):**
    *   A team leader or member initiates session creation through a frontend interface.
    *   The backend receives the request with session parameters (participants, end time, vote mode, etc.).
    *   Data is validated using `/validation/session.js`.
    *   The server stores preliminary session data in the `Sessions` MongoDB collection.
    *   **Blockchain Interaction:**
        *   The server calls `createVoteSession` on the deployed `VoteSessionFactory` smart contract (address of which is likely configured).
        *   It passes necessary parameters like a unique `sessionId` (possibly derived from the MongoDB `_id`), participant identifiers, end timestamp, vote mode, and max choices.
        *   The server listens for the `SessionCreated` event from the `VoteSessionFactory` contract.
        *   Upon successful creation on the blockchain, the server updates the `Sessions` document in MongoDB with the `sessionAddress` (the address of the newly created `VoteSession` contract) and other relevant on-chain details.
        *   The `sendNotification.js` helper might be used to notify relevant parties.

4.  **Candidate Nomination:**
    *   Users can apply to be candidates for sessions where nominations are open. This is handled by `routes/candidate.js` and likely involves the `CandidateRequest.js` model.
    *   Team leaders/members can approve/reject candidate requests.
    *   Team leaders/members might also directly invite candidates (`CandidateInvitation.js` model).

5.  **KYC Process:**
    *   Users (voters, candidates) may need to undergo KYC verification.
    *   `routes/kyc.js` and `helpers/kycService.js` manage this flow.
    *   The `User` model stores KYC status.
    *   The [kyc/README.md](mdc:kyc/README.md) provides more details on this sub-system.

6.  **Voting Process (Voter):**
    *   Voters view active sessions.
    *   Before voting, the server might check KYC status if required by the session.
    *   **Blockchain Interaction:**
        *   When a voter casts a vote, the request is sent to the backend (`routes/session.js`).
        *   The backend retrieves the `sessionAddress` of the specific `VoteSession` contract from its database.
        *   The backend (or a relayer it controls) calls the `vote(string[] choices)` function on that `VoteSession` contract, passing the voter's choices. The voter's Ethereum address (from their `User` profile) is used as `msg.sender` (either directly if the user signs the transaction, or via a relayer system).
        *   The server might listen for the `VoteCast` event to confirm and potentially update off-chain caches or logs.

7.  **Fetching Session Data & Results:**
    *   Users can view session details and results.
    *   **Blockchain Interaction:**
        *   The server calls `getStatus()`, `getResults()`, `getVoterCount()`, and `checkVoted(address)` on the appropriate `VoteSession` contract instance (using its stored `sessionAddress`).
        *   The server might also query the `VoteSessionFactory` for `getAllSessionIds()` to list all available sessions and then fetch details for each.
    *   This data is then formatted and sent to the frontend.

8.  **Notifications:**
    *   `helpers/sendNotification.js` and `routes/notifications.js` manage real-time or persistent notifications for various events (e.g., new session, vote ended, KYC status change, invitation received). This might involve Socket.IO for real-time updates.

## Environment Configuration

The server likely uses environment variables for configuration, such as:

*   `PORT`: Server listening port.
*   `MONGODB_URI`: MongoDB connection string.
*   `JWT_SECRET`: Secret key for signing JWTs.
*   `ETHEREUM_NODE_URL`: URL for connecting to an Ethereum node (e.g., Infura, Alchemy, or a local node).
*   `FACTORY_CONTRACT_ADDRESS`: The deployed address of the `VoteSessionFactory` smart contract.
*   `DEPLOYER_PRIVATE_KEY`: Private key of the account used by the server to pay for gas when interacting with smart contracts (e.g., creating sessions, relaying votes if a gasless approach for users is implemented).
*   Email service credentials (e.g., SendGrid API key).
*   KYC service API keys and endpoints.

## Error Handling

A centralized error handling middleware is expected to catch and process errors, returning appropriate HTTP status codes and error messages to the client.

## Security Considerations (Server-Specific)

*   **Input Validation:** Thoroughly validate all incoming data using `/validation/` schemas to prevent injection attacks (e.g., NoSQL injection) and ensure data integrity.
*   **Authentication & Authorization:** Securely manage user authentication (JWTs) and enforce role-based access control using middleware.
*   **Secret Management:** Store sensitive information (API keys, private keys, JWT secret) securely, preferably using environment variables and not hardcoded in the source code.
*   **Rate Limiting:** Implement rate limiting on sensitive endpoints to prevent abuse.
*   **HTTPS:** Ensure the server is configured to use HTTPS in production.
*   **Protection against common web vulnerabilities:** XSS, CSRF (though less relevant for APIs if using tokens properly).
*   **Blockchain Interaction Security:**
    *   Securely store and manage the private key used for sending transactions to the blockchain.
    *   Ensure proper error handling and retries for blockchain transactions, considering potential network issues or out-of-gas errors.
    *   Be mindful of re-entrancy if the server's logic depends on smart contract state that could be manipulated during a call (less likely for these specific contracts but a general concern).

This documentation should provide a comprehensive overview of the server's architecture, components, and its crucial role in the voting system, especially its interactions with the blockchain.