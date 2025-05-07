// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title VotingSession
 * @dev Contract for a decentralized voting session
 */
contract VotingSession {
    // Enums
    enum SessionType { Poll, Election }
    enum VotingMode { Single, Multiple, Ranked }
    enum SessionState { Created, Started, Ended }
    
    // Public state variables
    address public teamLeader;
    SessionType public sessionType;
    VotingMode public votingMode;
    SessionState public state;
    string public sessionName;
    string[] public options;
    uint public votesCount;
    
    // Configuration for different voting modes
    uint public maxChoices;          // For multiple choice mode
    uint public minRankedChoices;    // For ranked choice
    uint public maxRankedChoices;    // For ranked choice
    
    // Voting data
    mapping(address => bool) public hasVoted;
    mapping(uint => uint) public optionVotes;         // Used for Single & Multiple
    mapping(address => uint[]) public rankedVotes;    // Optional on-chain storage for ranked votes
    
    // Events
    event SessionStarted(uint timestamp);
    event SessionEnded(uint timestamp);
    event VoteCast(address indexed voter, uint8 votingMode);
    
    // Modifiers
    modifier onlyTeamLeader() {
        require(msg.sender == teamLeader, "Only team leader can call this function");
        _;
    }
    
    modifier inState(SessionState _state) {
        require(state == _state, "Invalid session state for this operation");
        _;
    }
    
    /**
     * @dev Constructor for creating a new voting session
     * @param _teamLeader Address of the team leader who controls this session
     * @param _options Array of option names/descriptions
     * @param _sessionType Type of session (0: Poll, 1: Election)
     * @param _votingMode Voting mode (0: Single, 1: Multiple, 2: Ranked)
     * @param _sessionName Name of the voting session
     * @param _maxChoices Maximum number of choices for multiple choice voting
     * @param _minRankedChoices Minimum number of ranked choices
     * @param _maxRankedChoices Maximum number of ranked choices
     */
    constructor(
        address _teamLeader,
        string[] memory _options,
        uint8 _sessionType,
        uint8 _votingMode,
        string memory _sessionName,
        uint _maxChoices,
        uint _minRankedChoices,
        uint _maxRankedChoices
    ) {
        teamLeader = _teamLeader;
        options = _options;
        sessionType = SessionType(_sessionType);
        votingMode = VotingMode(_votingMode);
        sessionName = _sessionName;
        state = SessionState.Created;
        
        // Set voting mode specific parameters
        maxChoices = _maxChoices;
        minRankedChoices = _minRankedChoices;
        maxRankedChoices = _maxRankedChoices;
    }
    
    /**
     * @dev Starts the voting session
     */
    function startSession() external onlyTeamLeader inState(SessionState.Created) {
        state = SessionState.Started;
        emit SessionStarted(block.timestamp);
    }
    
    /**
     * @dev Ends the voting session
     */
    function endSession() external onlyTeamLeader inState(SessionState.Started) {
        state = SessionState.Ended;
        emit SessionEnded(block.timestamp);
    }
    
    /**
     * @dev Casts a vote with a single choice
     * @param _optionIndex Index of the selected option
     */
    function voteSingle(uint _optionIndex) external inState(SessionState.Started) {
        require(votingMode == VotingMode.Single, "Not a single choice voting session");
        require(!hasVoted[msg.sender], "Already voted");
        require(_optionIndex < options.length, "Invalid option index");
        
        hasVoted[msg.sender] = true;
        optionVotes[_optionIndex]++;
        votesCount++;
        
        emit VoteCast(msg.sender, uint8(VotingMode.Single));
    }
    
    /**
     * @dev Casts a vote with multiple choices
     * @param _optionIndexes Array of selected option indexes
     */
    function voteMultiple(uint[] memory _optionIndexes) external inState(SessionState.Started) {
        require(votingMode == VotingMode.Multiple, "Not a multiple choice voting session");
        require(!hasVoted[msg.sender], "Already voted");
        require(_optionIndexes.length > 0, "Must vote for at least one option");
        require(_optionIndexes.length <= maxChoices, "Exceeds maximum allowed choices");
        
        // Validate all option indexes
        for (uint i = 0; i < _optionIndexes.length; i++) {
            require(_optionIndexes[i] < options.length, "Invalid option index");
            
            // Check for duplicates (inefficient for large arrays but safer)
            for (uint j = i + 1; j < _optionIndexes.length; j++) {
                require(_optionIndexes[i] != _optionIndexes[j], "Duplicate option");
            }
        }
        
        // Record the vote
        hasVoted[msg.sender] = true;
        
        for (uint i = 0; i < _optionIndexes.length; i++) {
            optionVotes[_optionIndexes[i]]++;
        }
        
        votesCount++;
        
        emit VoteCast(msg.sender, uint8(VotingMode.Multiple));
    }
    
    /**
     * @dev Casts a ranked choice vote
     * @param _rankedOptions Array of options in order of preference (by index)
     */
    function voteRanked(uint[] memory _rankedOptions) external inState(SessionState.Started) {
        require(votingMode == VotingMode.Ranked, "Not a ranked choice voting session");
        require(!hasVoted[msg.sender], "Already voted");
        require(_rankedOptions.length >= minRankedChoices, "Too few options ranked");
        require(_rankedOptions.length <= maxRankedChoices, "Too many options ranked");
        
        // Validate all option indexes and check for duplicates
        for (uint i = 0; i < _rankedOptions.length; i++) {
            require(_rankedOptions[i] < options.length, "Invalid option index");
            
            // Check for duplicates
            for (uint j = i + 1; j < _rankedOptions.length; j++) {
                require(_rankedOptions[i] != _rankedOptions[j], "Duplicate option");
            }
        }
        
        // Store the ranked choice vote
        hasVoted[msg.sender] = true;
        rankedVotes[msg.sender] = _rankedOptions;
        votesCount++;
        
        emit VoteCast(msg.sender, uint8(VotingMode.Ranked));
    }
    
    /**
     * @dev Gets the total votes for each option (for Single and Multiple modes)
     * @return Votes counts for each option
     */
    function getResults() external view returns (uint[] memory) {
        uint[] memory results = new uint[](options.length);
        
        for (uint i = 0; i < options.length; i++) {
            results[i] = optionVotes[i];
        }
        
        return results;
    }
    
    /**
     * @dev Gets a voter's ranked choices (for Ranked mode)
     * @param _voter Address of the voter
     * @return Ranked choices of the voter
     */
    function getVoterRankedChoices(address _voter) external view returns (uint[] memory) {
        require(hasVoted[_voter], "Address has not voted");
        return rankedVotes[_voter];
    }
    
    /**
     * @dev Gets all available voting options
     * @return Array of option names/descriptions
     */
    function getOptions() external view returns (string[] memory) {
        return options;
    }
    
    /**
     * @dev Gets the number of options in this session
     * @return The count of options
     */
    function getOptionsCount() external view returns (uint) {
        return options.length;
    }
    
    /**
     * @dev Checks if a specific address has already voted
     * @param _voter Address to check
     * @return True if the address has voted
     */
    function hasAddressVoted(address _voter) external view returns (bool) {
        return hasVoted[_voter];
    }
    
    /**
     * @dev Gets the session metadata
     * @return _sessionName Name of the session
     * @return _sessionType Type of session (0: Poll, 1: Election)
     * @return _votingMode Voting mode (0: Single, 1: Multiple, 2: Ranked)
     * @return _state Current state (0: Created, 1: Started, 2: Ended)
     * @return _maxChoices Max choices for multiple voting
     * @return _minRankedChoices Min ranked choices
     * @return _maxRankedChoices Max ranked choices
     */
    function getSessionMetadata() external view returns (
        string memory _sessionName,
        SessionType _sessionType,
        VotingMode _votingMode,
        SessionState _state,
        uint _maxChoices,
        uint _minRankedChoices,
        uint _maxRankedChoices
    ) {
        return (
            sessionName,
            sessionType,
            votingMode,
            state,
            maxChoices,
            minRankedChoices,
            maxRankedChoices
        );
    }
} 