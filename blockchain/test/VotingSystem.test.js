const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting System", function () {
  let VotingFactory;
  let factory;
  let votingSession;
  let owner;
  let voter1;
  let voter2;
  let voter3;
  
  const options = ["Option 1", "Option 2", "Option 3", "Option 4"];
  const SESSION_TYPE_POLL = 0;
  const SESSION_TYPE_ELECTION = 1;
  const VOTING_MODE_SINGLE = 0;
  const VOTING_MODE_MULTIPLE = 1;
  const VOTING_MODE_RANKED = 2;
  
  beforeEach(async function () {
    [owner, voter1, voter2, voter3] = await ethers.getSigners();
    
    // Deploy the factory contract
    VotingFactory = await ethers.getContractFactory("VotingFactory");
    factory = await VotingFactory.deploy();
    await factory.deployed();
  });
  
  describe("Voting Factory", function () {
    it("Should create a new voting session", async function () {
      const tx = await factory.createVotingSession(
        options,
        SESSION_TYPE_POLL,
        VOTING_MODE_SINGLE,
        "Test Session",
        0, // maxChoices - not used for single choice
        0, // minRankedChoices - not used for single choice
        0  // maxRankedChoices - not used for single choice
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'SessionCreated');
      expect(event).to.not.be.undefined;
      
      const sessionAddress = event.args.sessionAddress;
      expect(sessionAddress).to.not.be.equal(ethers.constants.AddressZero);
      
      // Check if session count increased
      expect(await factory.getSessionCount()).to.equal(1);
      
      // Check if session is in team leader's sessions
      const teamLeaderSessions = await factory.getTeamLeaderSessions(owner.address);
      expect(teamLeaderSessions.length).to.equal(1);
      expect(teamLeaderSessions[0]).to.equal(sessionAddress);
    });
  });
  
  describe("Voting Session - Single Choice", function () {
    beforeEach(async function () {
      // Create a single choice voting session
      const tx = await factory.createVotingSession(
        options,
        SESSION_TYPE_POLL,
        VOTING_MODE_SINGLE,
        "Single Choice Session",
        0, // maxChoices - not used for single choice
        0, // minRankedChoices - not used for single choice
        0  // maxRankedChoices - not used for single choice
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'SessionCreated');
      const sessionAddress = event.args.sessionAddress;
      
      // Get the VotingSession contract at this address
      votingSession = await ethers.getContractAt("VotingSession", sessionAddress);
    });
    
    it("Should start and end a session", async function () {
      // Start the session
      await votingSession.startSession();
      
      // Get metadata and check state
      const metadata = await votingSession.getSessionMetadata();
      expect(metadata._state).to.equal(1); // Started
      
      // End the session
      await votingSession.endSession();
      
      // Check state again
      const updatedMetadata = await votingSession.getSessionMetadata();
      expect(updatedMetadata._state).to.equal(2); // Ended
    });
    
    it("Should allow voters to cast single choice votes", async function () {
      // Start the session
      await votingSession.startSession();
      
      // Cast votes
      await votingSession.connect(voter1).voteSingle(0);
      await votingSession.connect(voter2).voteSingle(1);
      await votingSession.connect(voter3).voteSingle(0);
      
      // Check votes count
      expect(await votingSession.votesCount()).to.equal(3);
      
      // Check results
      const results = await votingSession.getResults();
      expect(results[0]).to.equal(2); // Option 1 got 2 votes
      expect(results[1]).to.equal(1); // Option 2 got 1 vote
      expect(results[2]).to.equal(0); // Option 3 got 0 votes
      expect(results[3]).to.equal(0); // Option 4 got 0 votes
      
      // Verify voters have voted
      expect(await votingSession.hasVoted(voter1.address)).to.be.true;
      expect(await votingSession.hasVoted(voter2.address)).to.be.true;
      expect(await votingSession.hasVoted(voter3.address)).to.be.true;
    });
    
    it("Should prevent double voting", async function () {
      // Start the session
      await votingSession.startSession();
      
      // Cast vote
      await votingSession.connect(voter1).voteSingle(0);
      
      // Try to vote again
      await expect(
        votingSession.connect(voter1).voteSingle(1)
      ).to.be.revertedWith("Already voted");
    });
    
    it("Should prevent voting after session has ended", async function () {
      // Start and end the session
      await votingSession.startSession();
      await votingSession.endSession();
      
      // Try to vote
      await expect(
        votingSession.connect(voter1).voteSingle(0)
      ).to.be.revertedWith("Invalid session state for this operation");
    });
  });
  
  describe("Voting Session - Multiple Choice", function () {
    beforeEach(async function () {
      // Create a multiple choice voting session
      const tx = await factory.createVotingSession(
        options,
        SESSION_TYPE_POLL,
        VOTING_MODE_MULTIPLE,
        "Multiple Choice Session",
        2, // maxChoices - allows selecting up to 2 options
        0, // minRankedChoices - not used for multiple choice
        0  // maxRankedChoices - not used for multiple choice
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'SessionCreated');
      const sessionAddress = event.args.sessionAddress;
      
      // Get the VotingSession contract at this address
      votingSession = await ethers.getContractAt("VotingSession", sessionAddress);
      
      // Start the session
      await votingSession.startSession();
    });
    
    it("Should allow voters to cast multiple choice votes", async function () {
      // Cast votes
      await votingSession.connect(voter1).voteMultiple([0, 1]);
      await votingSession.connect(voter2).voteMultiple([1, 2]);
      
      // Check votes count
      expect(await votingSession.votesCount()).to.equal(2);
      
      // Check results
      const results = await votingSession.getResults();
      expect(results[0]).to.equal(1); // Option 1 got 1 vote
      expect(results[1]).to.equal(2); // Option 2 got 2 votes
      expect(results[2]).to.equal(1); // Option 3 got 1 vote
      expect(results[3]).to.equal(0); // Option 4 got 0 votes
    });
    
    it("Should reject too many choices", async function () {
      // Try to select more than maxChoices
      await expect(
        votingSession.connect(voter1).voteMultiple([0, 1, 2])
      ).to.be.revertedWith("Exceeds maximum allowed choices");
    });
  });
  
  describe("Voting Session - Ranked Choice", function () {
    beforeEach(async function () {
      // Create a ranked choice voting session
      const tx = await factory.createVotingSession(
        options,
        SESSION_TYPE_ELECTION,
        VOTING_MODE_RANKED,
        "Ranked Choice Session",
        0, // maxChoices - not used for ranked choice
        2, // minRankedChoices - must rank at least 2 options
        4  // maxRankedChoices - can rank up to 4 options
      );
      
      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === 'SessionCreated');
      const sessionAddress = event.args.sessionAddress;
      
      // Get the VotingSession contract at this address
      votingSession = await ethers.getContractAt("VotingSession", sessionAddress);
      
      // Start the session
      await votingSession.startSession();
    });
    
    it("Should allow voters to cast ranked choice votes", async function () {
      // Cast ranked votes in order of preference
      await votingSession.connect(voter1).voteRanked([0, 1, 2]);
      await votingSession.connect(voter2).voteRanked([1, 2, 0]);
      await votingSession.connect(voter3).voteRanked([0, 2, 1]);
      
      // Check votes count
      expect(await votingSession.votesCount()).to.equal(3);
      
      // Verify ranked choices for a voter
      const rankedChoices = await votingSession.getVoterRankedChoices(voter1.address);
      expect(rankedChoices.length).to.equal(3);
      expect(rankedChoices[0]).to.equal(0);
      expect(rankedChoices[1]).to.equal(1);
      expect(rankedChoices[2]).to.equal(2);
    });
    
    it("Should reject ranked votes with too few options", async function () {
      // Try to rank fewer than minRankedChoices
      await expect(
        votingSession.connect(voter1).voteRanked([0])
      ).to.be.revertedWith("Too few options ranked");
    });
  });
}); 