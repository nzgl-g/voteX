// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

contract VotingSystem is Ownable {
    enum VoteMode { SINGLE, MULTIPLE, RANKED }

    struct Session {
        string[] choices;
        VoteMode voteMode;
        bool active;
        mapping(address => bool) hasVoted;
        mapping(string => uint256) results;
        mapping(address => string[]) rankedVotes;
    }

    // Mapping from sessionId to Session
    mapping(string => Session) private sessions;

    // Events
    event SessionCreated(string sessionId, uint256 choicesCount, VoteMode voteMode);
    event SessionEnded(string sessionId);
    event VoteCast(string sessionId, address voter);

    /**
     * @dev Create a new voting session
     * @param sessionId Unique identifier for the session
     * @param choices List of choice identifiers for the session
     * @param voteMode Type of voting (SINGLE, MULTIPLE, RANKED)
     */
    function createSession(
        string memory sessionId,
        string[] memory choices,
        VoteMode voteMode
    ) external onlyOwner {
        require(choices.length > 0, "Choices array cannot be empty");
        require(bytes(sessionId).length > 0, "Session ID cannot be empty");
        
        Session storage newSession = sessions[sessionId];
        require(newSession.choices.length == 0, "Session already exists");
        
        newSession.choices = choices;
        newSession.voteMode = voteMode;
        newSession.active = true;
        
        emit SessionCreated(sessionId, choices.length, voteMode);
    }

    /**
     * @dev End a voting session
     * @param sessionId Identifier of the session to end
     */
    function endSession(string memory sessionId) external onlyOwner {
        Session storage session = sessions[sessionId];
        require(session.choices.length > 0, "Session does not exist");
        require(session.active, "Session already ended");
        
        session.active = false;
        emit SessionEnded(sessionId);
    }

    /**
     * @dev Cast a vote in SINGLE or MULTIPLE mode
     * @param sessionId Identifier of the session
     * @param choiceIds Array of choice identifiers (expects 1 for SINGLE mode)
     */
    function castVote(
        string memory sessionId,
        string[] memory choiceIds
    ) external {
        Session storage session = sessions[sessionId];
        require(session.choices.length > 0, "Session does not exist");
        require(session.active, "Session is not active");
        require(!session.hasVoted[msg.sender], "Already voted in this session");
        
        if (session.voteMode == VoteMode.SINGLE) {
            require(choiceIds.length == 1, "Single vote mode requires exactly one choice");
            _validateChoice(session, choiceIds[0]);
            session.results[choiceIds[0]]++;
        } else if (session.voteMode == VoteMode.MULTIPLE) {
            require(choiceIds.length > 0, "Must submit at least one choice");
            require(choiceIds.length <= session.choices.length, "Too many choices submitted");
            
            for (uint i = 0; i < choiceIds.length; i++) {
                _validateChoice(session, choiceIds[i]);
                session.results[choiceIds[i]]++;
            }
        } else {
            revert("Use castRankedVote for RANKED mode");
        }
        
        session.hasVoted[msg.sender] = true;
        emit VoteCast(sessionId, msg.sender);
    }

    /**
     * @dev Cast a ranked vote (ordering matters)
     * @param sessionId Identifier of the session
     * @param rankedChoices Array of choice identifiers in order of preference
     */
    function castRankedVote(
        string memory sessionId,
        string[] memory rankedChoices
    ) external {
        Session storage session = sessions[sessionId];
        require(session.choices.length > 0, "Session does not exist");
        require(session.active, "Session is not active");
        require(!session.hasVoted[msg.sender], "Already voted in this session");
        require(session.voteMode == VoteMode.RANKED, "Session is not in RANKED mode");
        
        require(rankedChoices.length > 0, "Must submit at least one choice");
        require(rankedChoices.length <= session.choices.length, "Too many choices submitted");
        
        // Validate all choices
        for (uint i = 0; i < rankedChoices.length; i++) {
            _validateChoice(session, rankedChoices[i]);
        }
        
        // Store the ranked vote - in ranked mode we store the full ballot
        session.rankedVotes[msg.sender] = rankedChoices;
        
        // For simple tallying, also increment the counts but with weights based on rank
        // (First choice gets highest weight)
        for (uint i = 0; i < rankedChoices.length; i++) {
            // Weight = (n - i), where n is the number of choices
            uint256 weight = rankedChoices.length - i;
            session.results[rankedChoices[i]] += weight;
        }
        
        session.hasVoted[msg.sender] = true;
        emit VoteCast(sessionId, msg.sender);
    }

    /**
     * @dev Check if a session is active
     * @param sessionId Identifier of the session
     * @return bool True if the session is active
     */
    function isSessionActive(string memory sessionId) external view returns (bool) {
        return sessions[sessionId].active && sessions[sessionId].choices.length > 0;
    }

    /**
     * @dev Get session results
     * @param sessionId Identifier of the session
     * @param choiceId Identifier of the choice
     * @return uint256 Number of votes for the choice
     */
    function getChoiceResult(
        string memory sessionId,
        string memory choiceId
    ) external view returns (uint256) {
        Session storage session = sessions[sessionId];
        require(session.choices.length > 0, "Session does not exist");
        
        return session.results[choiceId];
    }

    /**
     * @dev Get all choices for a session
     * @param sessionId Identifier of the session
     * @return string[] Array of choice identifiers
     */
    function getSessionChoices(
        string memory sessionId
    ) external view returns (string[] memory) {
        Session storage session = sessions[sessionId];
        require(session.choices.length > 0, "Session does not exist");
        
        return session.choices;
    }

    /**
     * @dev Get vote mode for a session
     * @param sessionId Identifier of the session
     * @return VoteMode The voting mode of the session
     */
    function getSessionVoteMode(
        string memory sessionId
    ) external view returns (VoteMode) {
        Session storage session = sessions[sessionId];
        require(session.choices.length > 0, "Session does not exist");
        
        return session.voteMode;
    }

    /**
     * @dev Check if a voter has already voted in a session
     * @param sessionId Identifier of the session
     * @param voter Address of the voter
     * @return bool True if the voter has already voted
     */
    function hasVoted(
        string memory sessionId,
        address voter
    ) external view returns (bool) {
        Session storage session = sessions[sessionId];
        require(session.choices.length > 0, "Session does not exist");
        
        return session.hasVoted[voter];
    }

    /**
     * @dev Internal function to validate a choice exists in the session
     */
    function _validateChoice(Session storage session, string memory choiceId) internal view {
        bool choiceExists = false;
        for (uint i = 0; i < session.choices.length; i++) {
            if (keccak256(bytes(session.choices[i])) == keccak256(bytes(choiceId))) {
                choiceExists = true;
                break;
            }
        }
        require(choiceExists, "Invalid choice ID");
    }
} 