// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title Vote Session
/// @notice Contract for managing a single voting session
contract VoteSession {
    // Vote mode enum
    enum VoteMode { Single, Multiple }
    
    // Session data
    uint256 public sessionId;
    string[] public participants;
    uint256 public endTimestamp;
    VoteMode public voteMode;
    uint8 public maxChoices;
    address public creator;
    
    // Vote tracking
    mapping(string => uint256) public participantVotes;
    mapping(address => bool) public hasVoted;
    address[] public voters;
    
    // Events
    event VoteCast(address indexed voter, string[] choices);
    
    // Construction
    constructor(
        uint256 _sessionId,
        string[] memory _participants,
        uint256 _endTimestamp,
        VoteMode _voteMode,
        uint8 _maxChoices,
        address _creator
    ) {
        require(_participants.length > 0, "Must have at least one participant");
        require(_endTimestamp > block.timestamp, "End time must be in the future");
        
        if (_voteMode == VoteMode.Multiple) {
            require(_maxChoices > 0 && _maxChoices <= _participants.length, "Invalid max choices");
        }
        
        sessionId = _sessionId;
        participants = _participants;
        endTimestamp = _endTimestamp;
        voteMode = _voteMode;
        maxChoices = _maxChoices;
        creator = _creator;
    }
    
    // Modifiers
    modifier onlyActive() {
        require(block.timestamp < endTimestamp, "Voting session has ended");
        _;
    }
    
    modifier notVoted() {
        require(!hasVoted[msg.sender], "Already voted");
        _;
    }
    
    /**
     * @notice Cast a vote in the session
     * @param choices Array of participant identifiers (names) being voted for
     */
    function vote(string[] memory choices) external onlyActive notVoted {
        // Validate based on vote mode
        if (voteMode == VoteMode.Single) {
            require(choices.length == 1, "Single vote mode requires exactly one choice");
        } else {
            require(choices.length <= maxChoices, "Too many choices selected");
            require(choices.length > 0, "Must select at least one choice");
        }
        
        // Validate all choices exist
        for (uint8 i = 0; i < choices.length; i++) {
            bool validChoice = false;
            for (uint8 j = 0; j < participants.length; j++) {
                if (keccak256(bytes(choices[i])) == keccak256(bytes(participants[j]))) {
                    validChoice = true;
                    break;
                }
            }
            require(validChoice, "Invalid choice");
        }
        
        // Record vote
        hasVoted[msg.sender] = true;
        voters.push(msg.sender);
        
        // Each choice gets 1 vote
        for (uint8 i = 0; i < choices.length; i++) {
            participantVotes[choices[i]]++;
        }
        emit VoteCast(msg.sender, choices);
    }
    
    /**
     * @notice Get voting results
     * @return participantNames Names of all participants
     * @return voteCounts Vote counts for each participant
     */
    function getResults() external view returns (string[] memory participantNames, uint256[] memory voteCounts) {
        voteCounts = new uint256[](participants.length);
        
        for (uint256 i = 0; i < participants.length; i++) {
            voteCounts[i] = participantVotes[participants[i]];
        }
        
        return (participants, voteCounts);
    }
    
    /**
     * @notice Check if voting session is active
     * @return isActive True if session is still active
     * @return remainingTime Time remaining in seconds
     */
    function getStatus() external view returns (bool isActive, uint256 remainingTime) {
        isActive = block.timestamp < endTimestamp;
        
        if (isActive) {
            remainingTime = endTimestamp - block.timestamp;
        } else {
            remainingTime = 0;
        }
        
        return (isActive, remainingTime);
    }
    
    /**
     * @notice Get voter count
     * @return Number of voters who cast votes
     */
    function getVoterCount() external view returns (uint256) {
        return voters.length;
    }
    
    /**
     * @notice Check if an address has voted
     * @param voter Address to check
     * @return True if address has voted
     */
    function checkVoted(address voter) external view returns (bool) {
        return hasVoted[voter];
    }
} 