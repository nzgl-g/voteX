ser/**
 * This is an example script showing how a frontend application
 * might interact with the voting system contracts.
 * 
 * Note: This is not meant to be executed directly, but serves as a
 * reference for frontend integration.
 */

// Example using ethers.js
const { ethers } = require("ethers");

// ABI files would be generated after compiling the contracts
const VotingFactoryABI = require("../artifacts/contracts/VotingFactory.sol/VotingFactory.json").abi;
const VotingSessionABI = require("../artifacts/contracts/VotingSession.sol/VotingSession.json").abi;

// Example integration functions
async function integrateWithVotingSystem() {
  // Setup provider and signer
  // In a browser environment with MetaMask, you would use:
  // const provider = new ethers.providers.Web3Provider(window.ethereum);
  // const signer = provider.getSigner();
  
  // For this example, we'll use a direct connection
  const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
  const signer = provider.getSigner();
  const userAddress = await signer.getAddress();
  
  // Connect to the deployed VotingFactory
  const factoryAddress = "YOUR_DEPLOYED_FACTORY_ADDRESS";
  const factory = new ethers.Contract(factoryAddress, VotingFactoryABI, signer);
  
  // Create a new voting session (Team Leader function)
  const options = ["Option A", "Option B", "Option C", "Option D"];
  const sessionType = 0; // Poll
  const votingMode = 0; // Single Choice
  const sessionName = "Example Voting Session";
  
  console.log("Creating a new voting session...");
  const tx = await factory.createVotingSession(
    options,
    sessionType,
    votingMode,
    sessionName,
    0, // maxChoices - not used for single choice
    0, // minRankedChoices - not used for single choice
    0  // maxRankedChoices - not used for single choice
  );
  
  // Wait for transaction confirmation
  const receipt = await tx.wait();
  
  // Get the session address from the event
  const event = receipt.events.find(e => e.event === 'SessionCreated');
  const sessionAddress = event.args.sessionAddress;
  console.log(`New session created at address: ${sessionAddress}`);
  
  // Connect to the new session
  const session = new ethers.Contract(sessionAddress, VotingSessionABI, signer);
  
  // Start the session (Team Leader function)
  console.log("Starting the session...");
  await (await session.startSession()).wait();
  console.log("Session started");
  
  // Get session metadata
  const metadata = await session.getSessionMetadata();
  console.log("Session metadata:", {
    name: metadata._sessionName,
    type: metadata._sessionType,
    votingMode: metadata._votingMode,
    state: metadata._state
  });
  
  // Get voting options
  const votingOptions = await session.getOptions();
  console.log("Voting options:", votingOptions);
  
  // Cast a vote (Voter function)
  console.log("Casting a vote...");
  await (await session.voteSingle(1)).wait(); // Voting for Option B
  console.log("Vote cast successfully");
  
  // Check if a user has voted
  const hasVoted = await session.hasAddressVoted(userAddress);
  console.log(`Has user voted: ${hasVoted}`);
  
  // End the session (Team Leader function)
  console.log("Ending the session...");
  await (await session.endSession()).wait();
  console.log("Session ended");
  
  // Get results
  const results = await session.getResults();
  console.log("Voting results:");
  for (let i = 0; i < votingOptions.length; i++) {
    console.log(`${votingOptions[i]}: ${results[i]} votes`);
  }
}

// Example of using the VoteCounter contract for processing ranked choice votes
async function processRankedChoiceVotes() {
  // This would typically be done server-side or in a dApp
  const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
  const signer = provider.getSigner();
  
  // Connect to the VoteCounter contract
  const voteCounterAddress = "YOUR_DEPLOYED_VOTECOUNTER_ADDRESS";
  const voteCounter = new ethers.Contract(voteCounterAddress, VoteCounterABI, signer);
  
  // Connect to the VotingSession
  const sessionAddress = "YOUR_SESSION_ADDRESS";
  const session = new ethers.Contract(sessionAddress, VotingSessionABI, signer);
  
  // Get the number of options and votes
  const optionsCount = await session.getOptionsCount();
  const votesCount = await session.votesCount();
  
  // Fetch all ranked votes (this could be gas-intensive for large elections)
  // In a real app, you'd use events or backend indexing instead
  const voters = []; // Array of voter addresses (would need to be populated)
  const rankedVotes = [];
  
  for (const voter of voters) {
    try {
      const voterChoices = await session.getVoterRankedChoices(voter);
      rankedVotes.push(voterChoices);
    } catch (error) {
      // Handle case where voter hasn't voted
      console.log(`Voter ${voter} hasn't voted`);
    }
  }
  
  // Process first-choice votes
  const firstChoiceCounts = await voteCounter.tallyFirstChoiceRanked(optionsCount, rankedVotes);
  
  // Check if there's a majority winner
  const [hasWinner, winnerIndex] = await voteCounter.checkForRankedMajority(
    firstChoiceCounts,
    votesCount
  );
  
  if (hasWinner) {
    console.log(`Winner found in first round: Option ${winnerIndex}`);
  } else {
    console.log("No majority winner in first round, processing elimination rounds...");
    // In a real application, you would implement the IRV algorithm here
    // or use your backend services to compute the winner
  }
}

// Example event listener for new voting sessions
async function listenForNewSessions() {
  const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
  const factory = new ethers.Contract(factoryAddress, VotingFactoryABI, provider);
  
  // Listen for SessionCreated events
  factory.on("SessionCreated", (sessionAddress, teamLeader, sessionType, votingMode, sessionName) => {
    console.log(`New session created: ${sessionName}`);
    console.log(`Address: ${sessionAddress}`);
    console.log(`Created by: ${teamLeader}`);
    console.log(`Type: ${sessionType === 0 ? 'Poll' : 'Election'}`);
    console.log(`Voting mode: ${['Single', 'Multiple', 'Ranked'][votingMode]}`);
    
    // You could trigger UI updates or fetch session details here
  });
}

// These functions would be called from your application as needed
// integrateWithVotingSystem();
// processRankedChoiceVotes();
// listenForNewSessions();  