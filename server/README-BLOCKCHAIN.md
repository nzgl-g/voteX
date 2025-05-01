# Hey! Here's How to Setup the Blockchain Integration

I've built a blockchain voting system that works with our app. I've left you three important files to add to the server:

1. `blockchainController.js` - The controller that talks to the blockchain
2. `blockchain.js` - The API routes for blockchain operations 
3. `routes.js` - Just Added to lines

## What This Does

The system connects our backend server to a smart contract on Ethereum. The controller manages:
- Session creation on the blockchain (when voting starts)
- Ending sessions (when voting ends)
- Getting vote results
- Verifying who has voted

## How to Set This Up

### 1. Start the Blockchain

First, make sure to start a local Hardhat node in the blockchain directory:
```bash
cd blockchain
npx hardhat node
```

Keep this terminal open - it'll show you test accounts with private keys. You'll need one of those private keys.

### 2. Deploy the Contract

Open a new terminal and deploy the contract:
```bash
cd blockchain
npx hardhat run --network localhost scripts/deploy.js
```

Copy the contract address that appears in the output - you'll need it!

### 3. Start the Server

Now start our server:
```bash
cd server
npm run dev
```

### 4. Initialize the Controller

Once everything is running, you need to initialize the blockchain controller with a private key (from step 1) and the contract address (from step 2):

```bash
curl -X POST http://localhost:2000/votex/api/blockchain/initialize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"privateKey": "0x...", "contractAddress": "0x..."}'
```

**IMPORTANT**: Make sure to:
- Include the 0x prefix on the private key
- Use the exact contract address from deployment
- Get a JWT token by logging in through the app
- Use http://127.0.0.1:8545 instead of localhost if you get connection errors

## API Endpoints

Here are the main endpoints you'll use:

### Blockchain Setup
- `POST /votex/api/blockchain/initialize` - Initialize the connection
- `GET /votex/api/blockchain/status` - Check if it's connected

### Session Management
- `POST /votex/api/blockchain/sessions/:sessionId/start` - Start voting on the blockchain
- `POST /votex/api/blockchain/sessions/:sessionId/end` - End voting and finalize results
- `GET /votex/api/blockchain/sessions/:sessionId` - Get session details from blockchain
- `GET /votex/api/blockchain/sessions/:sessionId/results` - Get voting results

### Voting
- `GET /votex/api/sessions/:sessionId/vote` - Check if voting is active
- `GET /votex/api/sessions/:sessionId/vote/results` - Get formatted results
- `POST /votex/api/sessions/:sessionId/vote/track` - Track a vote in our database

## How the Parts Connect

1. **Vote Flow**:
   - User creates a session in the app
   - Server starts the session on the blockchain at the scheduled start time
   - Users vote directly from their wallets to the blockchain
   - Server tracks votes and updates the UI
   - Server ends session on blockchain at end time
   - Results are pulled from blockchain and displayed

2. **Data Flow**:
   - App → Server → Blockchain (for session management)
   - App → Blockchain (for direct voting)
   - Blockchain → Server → App (for results)

## Common Issues

If things aren't working:

1. **"Connection refused"** - Check that Hardhat is running on 127.0.0.1:8545
2. **"Contract not found"** - Double-check the contract address
3. **Authentication errors** - Make sure your JWT token is valid
4. **"Method not found"** - Make sure all files are in the right places

I haven't modified any other files beyond these three! If you need to update anything else, let me know.

Let me know when you've got it running!

## Required Edits

Here are the specific edits you need to make to get the blockchain functionality working correctly:

### 1. Update the SessionParticipant Model
You need to modify `server/models/SessionParticipants.js` to add blockchain-related fields:

```javascript
// Add these fields to the sessionParticipantSchema:
walletAddress: {
  type: String,
  trim: true
},
voteTransactionHash: {
  type: String,
  trim: true
}
```

### 2. Complete the Vote Router
The vote.js file currently is empty. You need to replace it with the complete version that includes:
- Route to check session status
- Route to get vote results
- Route to check if an address has voted
- Route to track votes

### 3. Create Contract Info Directory
Make sure you have this directory structure:
```
blockchain/contracts_info/VotingSystem.json
```
This file should contain the ABI and bytecode of your deployed contract.

### 4. Environment Variables
Add these to your .env file for automatic initialization on server start:
```
BLOCKCHAIN_PRIVATE_KEY=0x...
CONTRACT_ADDRESS=0x...
```

### 5. Test the Integration
Run the tests to make sure everything works:
```bash
cd server
npm test
```

### 6. Add Session Lifecycle Hooks (After Reviewing session.js)
After reviewing the session.js file, you need to add blockchain integration at key lifecycle points:

```javascript
// Create a utility function in server/utils/sessionScheduler.js
const blockchainController = require('./blockchainController');

async function scheduleSessionBlockchainEvents(session) {
  const sessionId = session._id.toString();
  const startTime = new Date(session.sessionLifecycle.scheduledAt.start).getTime();
  const endTime = new Date(session.sessionLifecycle.scheduledAt.end).getTime();
  const now = Date.now();
  
  // Schedule session start on blockchain
  if (startTime > now) {
    const delay = startTime - now;
    setTimeout(async () => {
      try {
        // Get choices based on session type
        let choices = [];
        if (session.type === 'election') {
          choices = session.candidates.map(c => c._id.toString());
        } else if (session.type === 'poll') {
          choices = session.options.map(o => o._id.toString());
        } else if (session.type === 'tournament') {
          choices = session.participants.map(p => p._id.toString());
        }
        
        await blockchainController.createSession(sessionId, choices, session.subtype);
        
        // Update session in database
        await Session.findByIdAndUpdate(sessionId, {
          'sessionLifecycle.startedAt': new Date()
        });
        
        console.log(`Session ${sessionId} started on blockchain`);
      } catch (error) {
        console.error(`Error starting session ${sessionId} on blockchain:`, error);
      }
    }, delay);
  }
  
  // Schedule session end on blockchain
  if (endTime > now) {
    const delay = endTime - now;
    setTimeout(async () => {
      try {
        await blockchainController.endSession(sessionId);
        
        // Get results from blockchain
        const results = await blockchainController.getSessionResults(sessionId);
        
        // Update session in database
        await Session.findByIdAndUpdate(sessionId, {
          'sessionLifecycle.endedAt': new Date(),
          results: results.results
        });
        
        console.log(`Session ${sessionId} ended on blockchain`);
      } catch (error) {
        console.error(`Error ending session ${sessionId} on blockchain:`, error);
      }
    }, delay);
  }
}

module.exports = { scheduleSessionBlockchainEvents };
```

Then import and use this function in session.js when sessions are created or updated:

```javascript
// Import at the top of session.js
const { scheduleSessionBlockchainEvents } = require('../utils/sessionScheduler');

// Add after session creation
await scheduleSessionBlockchainEvents(session);

// Also add after session update if scheduled times are modified
```

### 7. Update Models for Blockchain Data
Consider adding a blockchain section to your Sessions model for better tracking:

```javascript
// Add to sessionSchema in Sessions.js
blockchain: {
  registered: { type: Boolean, default: false },
  startTransaction: { type: String, trim: true },
  endTransaction: { type: String, trim: true },
  lastSyncedAt: { type: Date }
}
```

Remember to only make these specific changes - don't modify other files that might disrupt the existing system! 