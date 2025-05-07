// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./VotingSession.sol";

/**
 * @title VotingFactory
 * @dev Factory contract for creating new VotingSession contracts
 */
contract VotingFactory {
    // Array to store all deployed voting session addresses
    address[] public deployedSessions;
    
    // Mapping from team leader to their deployed sessions
    mapping(address => address[]) public teamLeaderSessions;
    
    // Event emitted when a new voting session is created
    event SessionCreated(
        address indexed sessionAddress,
        address indexed teamLeader,
        uint8 sessionType,
        uint8 votingMode,
        string sessionName
    );
    
    /**
     * @dev Creates a new voting session contract
     * @param _options Array of option names/descriptions
     * @param _sessionType Type of session (0: Poll, 1: Election)
     * @param _votingMode Voting mode (0: Single, 1: Multiple, 2: Ranked)
     * @param _sessionName Name of the voting session
     * @param _maxChoices Maximum number of choices for multiple choice voting
     * @param _minRankedChoices Minimum number of ranked choices
     * @param _maxRankedChoices Maximum number of ranked choices
     * @return address The address of the newly created voting session
     */
    function createVotingSession(
        string[] memory _options,
        uint8 _sessionType,
        uint8 _votingMode,
        string memory _sessionName,
        uint _maxChoices,
        uint _minRankedChoices,
        uint _maxRankedChoices
    ) external returns (address) {
        // Validate input
        require(_options.length > 0, "Options array cannot be empty");
        require(_sessionType <= 1, "Invalid session type");
        require(_votingMode <= 2, "Invalid voting mode");
        
        // Additional validation based on voting mode
        if (_votingMode == 1) { // Multiple choice
            require(_maxChoices > 0 && _maxChoices <= _options.length, "Invalid maxChoices value");
        } else if (_votingMode == 2) { // Ranked choice
            require(_minRankedChoices > 0, "Minimum ranked choices must be greater than 0");
            require(_maxRankedChoices >= _minRankedChoices, "Max ranked must be >= min ranked");
            require(_maxRankedChoices <= _options.length, "Max ranked cannot exceed options count");
        }
        
        // Create new voting session contract
        VotingSession newSession = new VotingSession(
            msg.sender,
            _options,
            _sessionType,
            _votingMode,
            _sessionName,
            _maxChoices,
            _minRankedChoices,
            _maxRankedChoices
        );
        
        address sessionAddress = address(newSession);
        
        // Store the address of the new session
        deployedSessions.push(sessionAddress);
        teamLeaderSessions[msg.sender].push(sessionAddress);
        
        // Emit event
        emit SessionCreated(
            sessionAddress,
            msg.sender,
            _sessionType,
            _votingMode,
            _sessionName
        );
        
        return sessionAddress;
    }
    
    /**
     * @dev Returns all deployed session addresses
     * @return Array of deployed session addresses
     */
    function getDeployedSessions() external view returns (address[] memory) {
        return deployedSessions;
    }
    
    /**
     * @dev Returns all sessions created by a specific team leader
     * @param _teamLeader The address of the team leader
     * @return Array of session addresses created by the team leader
     */
    function getTeamLeaderSessions(address _teamLeader) external view returns (address[] memory) {
        return teamLeaderSessions[_teamLeader];
    }
    
    /**
     * @dev Returns the count of all deployed sessions
     * @return The number of deployed sessions
     */
    function getSessionCount() external view returns (uint) {
        return deployedSessions.length;
    }
} 