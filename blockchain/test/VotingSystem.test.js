const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VotingSystem", function () {
  let votingSystem;
  let owner;
  let voter1;
  let voter2;
  let voter3;

  const SESSION_ID = "test-session-001";
  const CHOICES = ["choice1", "choice2", "choice3", "choice4"];
  
  // VoteMode enum values
  const VOTE_MODE = {
    SINGLE: 0,
    MULTIPLE: 1,
    RANKED: 2
  };

  beforeEach(async function () {
    // Get signers
    [owner, voter1, voter2, voter3] = await ethers.getSigners();

    // Deploy contract
    const VotingSystem = await ethers.getContractFactory("VotingSystem");
    votingSystem = await VotingSystem.deploy();
    await votingSystem.waitForDeployment();
  });

  describe("Session Creation and Management", function () {
    it("Should create a new session", async function () {
      await expect(votingSystem.createSession(SESSION_ID, CHOICES, VOTE_MODE.SINGLE))
        .to.emit(votingSystem, "SessionCreated")
        .withArgs(SESSION_ID, CHOICES.length, VOTE_MODE.SINGLE);
      
      const isActive = await votingSystem.isSessionActive(SESSION_ID);
      expect(isActive).to.be.true;

      const sessionChoices = await votingSystem.getSessionChoices(SESSION_ID);
      expect(sessionChoices).to.deep.equal(CHOICES);

      const voteMode = await votingSystem.getSessionVoteMode(SESSION_ID);
      expect(voteMode).to.equal(VOTE_MODE.SINGLE);
    });

    it("Should reject creating a session with empty choices", async function () {
      await expect(votingSystem.createSession(SESSION_ID, [], VOTE_MODE.SINGLE))
        .to.be.revertedWith("Choices array cannot be empty");
    });

    it("Should reject creating a session with empty ID", async function () {
      await expect(votingSystem.createSession("", CHOICES, VOTE_MODE.SINGLE))
        .to.be.revertedWith("Session ID cannot be empty");
    });

    it("Should reject creating a duplicate session", async function () {
      await votingSystem.createSession(SESSION_ID, CHOICES, VOTE_MODE.SINGLE);
      await expect(votingSystem.createSession(SESSION_ID, CHOICES, VOTE_MODE.SINGLE))
        .to.be.revertedWith("Session already exists");
    });

    it("Should end a session", async function () {
      await votingSystem.createSession(SESSION_ID, CHOICES, VOTE_MODE.SINGLE);
      
      await expect(votingSystem.endSession(SESSION_ID))
        .to.emit(votingSystem, "SessionEnded")
        .withArgs(SESSION_ID);
      
      const isActive = await votingSystem.isSessionActive(SESSION_ID);
      expect(isActive).to.be.false;
    });
  });

  describe("Single Vote Mode", function () {
    beforeEach(async function () {
      await votingSystem.createSession(SESSION_ID, CHOICES, VOTE_MODE.SINGLE);
    });

    it("Should cast a single vote", async function () {
      await expect(votingSystem.connect(voter1).castVote(SESSION_ID, [CHOICES[0]]))
        .to.emit(votingSystem, "VoteCast")
        .withArgs(SESSION_ID, voter1.address);
      
      const hasVoted = await votingSystem.hasVoted(SESSION_ID, voter1.address);
      expect(hasVoted).to.be.true;
      
      const voteCount = await votingSystem.getChoiceResult(SESSION_ID, CHOICES[0]);
      expect(voteCount).to.equal(1);
    });

    it("Should reject multiple choices in single vote mode", async function () {
      await expect(votingSystem.connect(voter1).castVote(SESSION_ID, [CHOICES[0], CHOICES[1]]))
        .to.be.revertedWith("Single vote mode requires exactly one choice");
    });

    it("Should prevent voting twice", async function () {
      await votingSystem.connect(voter1).castVote(SESSION_ID, [CHOICES[0]]);
      await expect(votingSystem.connect(voter1).castVote(SESSION_ID, [CHOICES[1]]))
        .to.be.revertedWith("Already voted in this session");
    });
  });

  describe("Multiple Vote Mode", function () {
    beforeEach(async function () {
      await votingSystem.createSession(SESSION_ID, CHOICES, VOTE_MODE.MULTIPLE);
    });

    it("Should cast multiple votes", async function () {
      await expect(votingSystem.connect(voter1).castVote(SESSION_ID, [CHOICES[0], CHOICES[2]]))
        .to.emit(votingSystem, "VoteCast")
        .withArgs(SESSION_ID, voter1.address);
      
      const hasVoted = await votingSystem.hasVoted(SESSION_ID, voter1.address);
      expect(hasVoted).to.be.true;
      
      const voteCount1 = await votingSystem.getChoiceResult(SESSION_ID, CHOICES[0]);
      const voteCount2 = await votingSystem.getChoiceResult(SESSION_ID, CHOICES[1]);
      const voteCount3 = await votingSystem.getChoiceResult(SESSION_ID, CHOICES[2]);
      
      expect(voteCount1).to.equal(1);
      expect(voteCount2).to.equal(0);
      expect(voteCount3).to.equal(1);
    });

    it("Should reject too many choices", async function () {
      const tooManyChoices = [...CHOICES, "choice5", "choice6"]; // More than available
      await expect(votingSystem.connect(voter1).castVote(SESSION_ID, tooManyChoices))
        .to.be.revertedWith("Too many choices submitted");
    });
  });

  describe("Ranked Vote Mode", function () {
    beforeEach(async function () {
      await votingSystem.createSession(SESSION_ID, CHOICES, VOTE_MODE.RANKED);
    });

    it("Should cast ranked votes", async function () {
      const rankedChoices = [CHOICES[2], CHOICES[0], CHOICES[1]];
      await expect(votingSystem.connect(voter1).castRankedVote(SESSION_ID, rankedChoices))
        .to.emit(votingSystem, "VoteCast")
        .withArgs(SESSION_ID, voter1.address);
      
      const hasVoted = await votingSystem.hasVoted(SESSION_ID, voter1.address);
      expect(hasVoted).to.be.true;
      
      // First choice gets highest weight (3), second gets 2, third gets 1
      const voteCount0 = await votingSystem.getChoiceResult(SESSION_ID, CHOICES[0]);
      const voteCount1 = await votingSystem.getChoiceResult(SESSION_ID, CHOICES[1]);
      const voteCount2 = await votingSystem.getChoiceResult(SESSION_ID, CHOICES[2]);
      
      expect(voteCount0).to.equal(2); // Second choice (weight 2)
      expect(voteCount1).to.equal(1); // Third choice (weight 1)
      expect(voteCount2).to.equal(3); // First choice (weight 3)
    });

    it("Should reject using castVote in RANKED mode", async function () {
      await expect(votingSystem.connect(voter1).castVote(SESSION_ID, [CHOICES[0]]))
        .to.be.revertedWith("Use castRankedVote for RANKED mode");
    });
  });

  describe("Access Control", function () {
    it("Should prevent non-owners from creating sessions", async function () {
      await expect(votingSystem.connect(voter1).createSession(SESSION_ID, CHOICES, VOTE_MODE.SINGLE))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should prevent non-owners from ending sessions", async function () {
      await votingSystem.createSession(SESSION_ID, CHOICES, VOTE_MODE.SINGLE);
      await expect(votingSystem.connect(voter1).endSession(SESSION_ID))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
}); 