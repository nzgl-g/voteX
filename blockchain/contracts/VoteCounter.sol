// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title VoteCounter
 * @dev Helper contract for counting votes in different voting modes
 * Note: For ranked choice voting, complete tallying is best done off-chain due to gas costs
 * This contract provides utilities and partial functionality for on-chain tallying
 */
contract VoteCounter {
    /**
     * @dev Finds the winner(s) in a single or multiple choice vote
     * @param results The vote counts for each option
     * @param numberOfWinners The number of winners to select
     * @return winnerIndexes The indexes of the winning option(s)
     */
    function findWinners(uint[] memory results, uint numberOfWinners) public pure returns (uint[] memory) {
        require(numberOfWinners > 0, "Number of winners must be greater than 0");
        require(numberOfWinners <= results.length, "Number of winners cannot exceed options");
        
        // Create a copy of results to avoid modifying the original
        uint[] memory votesCopy = new uint[](results.length);
        for (uint i = 0; i < results.length; i++) {
            votesCopy[i] = results[i];
        }
        
        // Array to store winner indexes
        uint[] memory winnerIndexes = new uint[](numberOfWinners);
        
        // Find top N winners
        for (uint w = 0; w < numberOfWinners; w++) {
            uint maxVotes = 0;
            uint maxIndex = 0;
            
            // Find the option with the most votes
            for (uint i = 0; i < results.length; i++) {
                if (votesCopy[i] > maxVotes) {
                    maxVotes = votesCopy[i];
                    maxIndex = i;
                }
            }
            
            // Add to winners array
            winnerIndexes[w] = maxIndex;
            
            // Set the votes to 0 to exclude from next iteration
            votesCopy[maxIndex] = 0;
        }
        
        return winnerIndexes;
    }
    
    /**
     * @dev Helper function for the first round of ranked choice vote calculation
     * Useful for initial on-chain insights, but complete IRV tallying is best done off-chain
     * @param numOptions The number of options in the vote
     * @param rankedVotes Array of all ranked votes
     * @return firstChoiceCounts Count of first choices for each option
     */
    function tallyFirstChoiceRanked(
        uint numOptions, 
        uint[][] memory rankedVotes
    ) public pure returns (uint[] memory) {
        uint[] memory firstChoiceCounts = new uint[](numOptions);
        
        for (uint i = 0; i < rankedVotes.length; i++) {
            if (rankedVotes[i].length > 0) {
                uint firstChoice = rankedVotes[i][0];
                require(firstChoice < numOptions, "Invalid option index");
                firstChoiceCounts[firstChoice]++;
            }
        }
        
        return firstChoiceCounts;
    }
    
    /**
     * @dev Checks if any option has a majority in ranked choice voting
     * @param firstChoiceCounts Counts of first choices for each option
     * @param totalVotes Total number of votes cast
     * @return hasWinner Whether a winner exists
     * @return winnerIndex The index of the winning option
     */
    function checkForRankedMajority(
        uint[] memory firstChoiceCounts,
        uint totalVotes
    ) public pure returns (bool hasWinner, uint winnerIndex) {
        uint majorityThreshold = totalVotes / 2 + (totalVotes % 2 == 0 ? 0 : 1);
        
        for (uint i = 0; i < firstChoiceCounts.length; i++) {
            if (firstChoiceCounts[i] >= majorityThreshold) {
                return (true, i);
            }
        }
        
        return (false, 0);
    }
} 