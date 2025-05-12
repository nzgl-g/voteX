// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./VoteSession.sol";

/// @title Vote Session Factory
/// @notice Factory contract for creating new vote sessions
contract VoteSessionFactory {
    // Events
    event SessionCreated(uint256 indexed sessionId, address sessionAddress, address creator);
    
    // Mapping from sessionId to deployed contract address
    mapping(uint256 => address) public sessions;
    
    // Session creators
    mapping(uint256 => address) public sessionCreators;
    
    // Array to track all session IDs
    uint256[] public allSessionIds;
    
    /**
     * @notice Creates a new voting session
     * @param sessionId Unique identifier for the session
     * @param participants List of participant names/identifiers
     * @param endTimestamp Unix timestamp when the session will end
     * @param mode Vote mode (0: Single, 1: Multiple, 2: Ranked)
     * @param maxChoices Maximum number of choices allowed in multiple/ranked mode
     * @return sessionAddress Address of the newly created session contract
     */
    function createVoteSession(
        uint256 sessionId,
        string[] memory participants,
        uint256 endTimestamp,
        VoteSession.VoteMode mode,
        uint8 maxChoices
    ) external returns (address sessionAddress) {
        // Check if session with this ID already exists
        require(sessions[sessionId] == address(0), "Session with this ID already exists");
        
        // Create new session contract
        VoteSession newSession = new VoteSession(
            sessionId,
            participants,
            endTimestamp,
            mode,
            maxChoices,
            msg.sender  // Creator is the deployer
        );
        
        // Store session address
        sessions[sessionId] = address(newSession);
        sessionCreators[sessionId] = msg.sender;
        allSessionIds.push(sessionId);
        
        // Emit event
        emit SessionCreated(sessionId, address(newSession), msg.sender);
        
        return address(newSession);
    }
    
    /**
     * @notice Get all session IDs
     * @return Array of all session IDs
     */
    function getAllSessionIds() external view returns (uint256[] memory) {
        return allSessionIds;
    }
    
    /**
     * @notice Get session count
     * @return Number of sessions created
     */
    function getSessionCount() external view returns (uint256) {
        return allSessionIds.length;
    }
} 