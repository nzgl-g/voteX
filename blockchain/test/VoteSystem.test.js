const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vote System Contracts", function () {
  // Deploy factory once for all tests
  let factory;
  let factoryAddress;
  let accounts;
  
  // Before all tests
  before(async function () {
    accounts = await ethers.getSigners();
    
    // Deploy factory
    const VoteSessionFactory = await ethers.getContractFactory("VoteSessionFactory");
    factory = await VoteSessionFactory.deploy();
    await factory.waitForDeployment();
    factoryAddress = await factory.getAddress();
  });
  
  describe("VoteSessionFactory", function () {
    it("Should deploy successfully", async function () {
      expect(factoryAddress).to.be.properAddress;
    });
    
    it("Should create a new voting session", async function () {
      const sessionId = 1;
      const now = Math.floor(Date.now() / 1000);
      const endTime = now + 86400; // 1 day
      const participants = ["Option A", "Option B", "Option C"];
      
      // Create session
      const tx = await factory.createVoteSession(
        sessionId,
        participants,
        endTime,
        0, // Single vote mode
        1  // Max choices (irrelevant for single mode)
      );
      
      await tx.wait();
      
      // Verify session exists
      const sessionAddress = await factory.sessions(sessionId);
      expect(sessionAddress).to.be.properAddress;
      expect(sessionAddress).to.not.equal(ethers.ZeroAddress);
    });
    
    it("Should not allow duplicate session IDs", async function () {
      const sessionId = 1; // Already used
      const now = Math.floor(Date.now() / 1000);
      const endTime = now + 86400;
      const participants = ["Option X", "Option Y"];
      
      // Try to create session with same ID
      await expect(factory.createVoteSession(
        sessionId,
        participants,
        endTime,
        0,
        1
      )).to.be.revertedWith("Session with this ID already exists");
    });
    
    it("Should track all session IDs", async function () {
      // Create another session
      const sessionId = 2;
      const now = Math.floor(Date.now() / 1000);
      const endTime = now + 86400;
      const participants = ["Option X", "Option Y"];
      
      await factory.createVoteSession(sessionId, participants, endTime, 0, 1);
      
      // Check session count
      expect(await factory.getSessionCount()).to.equal(2);
      
      // Check all session IDs
      const allIds = await factory.getAllSessionIds();
      expect(allIds).to.deep.equal([ethers.toBigInt(1), ethers.toBigInt(2)]);
    });
  });
  
  describe("VoteSession - Single Vote Mode", function () {
    let sessionAddress;
    let session;
    
    before(async function () {
      sessionAddress = await factory.sessions(1);
      session = await ethers.getContractAt("VoteSession", sessionAddress);
    });
    
    it("Should have correct initial state", async function () {
      expect(await session.sessionId()).to.equal(1);
      expect(await session.voteMode()).to.equal(0); // Single
      expect(await session.maxChoices()).to.equal(1);
      
      const participant0 = await session.participants(0);
      const participant1 = await session.participants(1);
      const participant2 = await session.participants(2);
      
      expect(participant0).to.equal("Option A");
      expect(participant1).to.equal("Option B");
      expect(participant2).to.equal("Option C");
      
      const [isActive, remainingTime] = await session.getStatus();
      expect(isActive).to.be.true;
      expect(remainingTime).to.be.gt(0);
    });
    
    it("Should allow casting a valid vote", async function () {
      // Cast vote from account[1]
      await session.connect(accounts[1]).vote(["Option B"], []);
      
      // Check that vote was recorded
      expect(await session.checkVoted(accounts[1].address)).to.be.true;
      expect(await session.getVoterCount()).to.equal(1);
      
      // Check the vote counts
      const [participants, votes] = await session.getResults();
      expect(participants[1]).to.equal("Option B");
      expect(votes[1]).to.equal(1);
    });
    
    it("Should not allow voting twice", async function () {
      await expect(
        session.connect(accounts[1]).vote(["Option A"], [])
      ).to.be.revertedWith("Already voted");
    });
    
    it("Should not allow voting for multiple options in single mode", async function () {
      await expect(
        session.connect(accounts[2]).vote(["Option A", "Option B"], [])
      ).to.be.revertedWith("Single vote mode requires exactly one choice");
    });
    
    it("Should not allow voting for invalid options", async function () {
      await expect(
        session.connect(accounts[2]).vote(["Invalid Option"], [])
      ).to.be.revertedWith("Invalid choice");
    });
  });
  
  describe("VoteSession - Multiple Vote Mode", function () {
    let sessionAddress;
    let session;
    
    before(async function () {
      // Create a new session with multiple vote mode
      const sessionId = 3;
      const now = Math.floor(Date.now() / 1000);
      const endTime = now + 86400;
      const participants = ["Candidate A", "Candidate B", "Candidate C", "Candidate D"];
      
      await factory.createVoteSession(
        sessionId,
        participants,
        endTime,
        1, // Multiple vote mode
        2  // Max 2 choices
      );
      
      sessionAddress = await factory.sessions(sessionId);
      session = await ethers.getContractAt("VoteSession", sessionAddress);
    });
    
    it("Should allow voting for multiple options within limit", async function () {
      await session.connect(accounts[1]).vote(["Candidate A", "Candidate C"], []);
      
      expect(await session.checkVoted(accounts[1].address)).to.be.true;
      
      const [participants, votes] = await session.getResults();
      expect(votes[0]).to.equal(1); // Candidate A
      expect(votes[1]).to.equal(0); // Candidate B
      expect(votes[2]).to.equal(1); // Candidate C
    });
    
    it("Should not allow voting for more than max choices", async function () {
      await expect(
        session.connect(accounts[2]).vote(["Candidate A", "Candidate B", "Candidate C"], [])
      ).to.be.revertedWith("Too many choices selected");
    });
  });
  
  describe("VoteSession - Ranked Vote Mode", function () {
    let sessionAddress;
    let session;
    
    before(async function () {
      // Create a new session with ranked vote mode
      const sessionId = 4;
      const now = Math.floor(Date.now() / 1000);
      const endTime = now + 86400;
      const participants = ["Candidate A", "Candidate B", "Candidate C"];
      
      await factory.createVoteSession(
        sessionId,
        participants,
        endTime,
        2, // Ranked vote mode
        3  // Max 3 choices
      );
      
      sessionAddress = await factory.sessions(sessionId);
      session = await ethers.getContractAt("VoteSession", sessionAddress);
    });
    
    it("Should allow ranked voting with valid ranks", async function () {
      // Vote with ranks - rank 1 is highest (gets most points)
      await session.connect(accounts[1]).vote(
        ["Candidate C", "Candidate A", "Candidate B"], 
        [1, 2, 3] // C is rank 1, A is rank 2, B is rank 3
      );
      
      expect(await session.checkVoted(accounts[1].address)).to.be.true;
      
      const [participants, votes] = await session.getResults();
      // Points: Rank 1 = 3 points, Rank 2 = 2 points, Rank 3 = 1 point
      expect(votes[0]).to.equal(2); // Candidate A - Rank 2
      expect(votes[1]).to.equal(1); // Candidate B - Rank 3
      expect(votes[2]).to.equal(3); // Candidate C - Rank 1
    });
    
    it("Should reject invalid rank values", async function () {
      await expect(
        session.connect(accounts[2]).vote(
          ["Candidate A", "Candidate B"],
          [1, 3] // Missing rank 2
        )
      ).to.be.revertedWith("Invalid rank value");
      
      await expect(
        session.connect(accounts[2]).vote(
          ["Candidate A", "Candidate B"],
          [1, 1] // Duplicate rank
        )
      ).to.be.revertedWith("Duplicate rank");
    });
  });
}); 