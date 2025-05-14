/*
* this where blockchain interraction happens , inlcudes all function in the blockchain dir , api calls
*
* */

import Web3 from 'web3';
import { toast } from '@/lib/toast';
import { metamaskService } from './metamask-service';
import VoteSessionFactoryABI from './abi/VoteSessionFactory.json';
import VoteSessionABI from './abi/VoteSession.json';
import { sessionService } from './session-service';

// Factory contract address (from user input)
const FACTORY_CONTRACT_ADDRESS = '0x78e660bad23087AcEB6eccE2FEb28709B5d192f7';

// Web3 instance - will be initialized when needed
let web3Instance: Web3 | null = null;

// Vote Mode enum mapping
enum VoteMode {
  Single = 0,
  Multiple = 1
}

class BlockchainService {
  /**
   * Initialize Web3 with current provider
   */
  private initWeb3(): Web3 {
    if (web3Instance !== null) {
      return web3Instance;
    }
    
    if (typeof window !== 'undefined' && window.ethereum) {
      web3Instance = new Web3(window.ethereum);
    } else {
      // Fallback to a default provider for read-only operations
      const defaultProvider = 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY'; // Should set this in env vars
      web3Instance = new Web3(new Web3.providers.HttpProvider(defaultProvider));
      console.warn('Using fallback Web3 provider. Some features may be limited.');
    }
    
    return web3Instance;
  }

  /**
   * Get the factory contract instance
   */
  private getFactoryContract(): any {
    const web3 = this.initWeb3();
    return new web3.eth.Contract(
      VoteSessionFactoryABI.abi as any, 
      FACTORY_CONTRACT_ADDRESS
    );
  }

  /**
   * Get a specific vote session contract instance
   */
  private getSessionContract(address: string): any {
    const web3 = this.initWeb3();
    return new web3.eth.Contract(
      VoteSessionABI.abi as any,
      address
    );
  }

  /**
   * Create a new voting session on the blockchain
   * @param sessionId The database ID of the session
   * @returns The contract address of the created session
   */
  async createSession(sessionId: string): Promise<string> {
    let tempSessionAddress = '';
    
    try {
      // Ensure MetaMask is connected
      const account = await metamaskService.connect();
      if (!account) {
        throw new Error("MetaMask connection is required to create a session");
      }
      
      // Get session data from the database
      console.log('Fetching deployment data for session:', sessionId);
      const deploymentData = await sessionService.getBlockchainDeploymentData(sessionId);
      console.log('Deployment data:', deploymentData);
      
      // Validate deployment data
      if (!deploymentData.participants || deploymentData.participants.length === 0) {
        throw new Error("Session must have at least one candidate or option to deploy");
      }
      
      // Convert sessionId to a numeric format that the contract can handle
      const web3 = this.initWeb3();
      
      // Generate a deterministic but unique ID for this session
      // Use the last 8 characters of the ID which should be unique enough
      const shortId = deploymentData.sessionId.substring(Math.max(0, deploymentData.sessionId.length - 8));
      
      // Convert the ID to a decimal string
      let numericId;
      try {
        // Try to convert the ID via hash
        const hashedId = web3.utils.keccak256(deploymentData.sessionId);
        // Take the first 16 characters after 0x (64 bits)
        const shortenedHash = hashedId.substring(0, 18); // 0x + 16 chars
        numericId = shortenedHash;
        console.log('Using hashed session ID:', numericId);
      } catch (error) {
        console.error('Error hashing session ID:', error);
        // Use a simpler fallback
        numericId = '0x' + parseInt(shortId, 16).toString(16);
        console.log('Using fallback session ID:', numericId);
      }
      
      // Get the factory contract
      const factory = this.getFactoryContract();
      
      // Convert voting mode to the correct enum value
      const voteMode = deploymentData.voteMode === 1 ? VoteMode.Multiple : VoteMode.Single;
      
      // Ensure all numeric parameters are properly formatted for the blockchain
      const endTimestampBN = BigInt(deploymentData.endTimestamp);
      const maxChoicesBN = BigInt(deploymentData.maxChoices);
      
      // Prepare the transaction
      console.log('Creating session with parameters:', {
        sessionId: numericId,
        participants: deploymentData.participants,
        endTimestamp: deploymentData.endTimestamp,
        voteMode,
        maxChoices: deploymentData.maxChoices
      });
      
      try {
        // Prepare numeric parameters for the contract
        // Format the session ID for the contract input
        let sessionIdForContract;
        if (numericId.startsWith('0x')) {
          // It's already a hex string, use it directly
          sessionIdForContract = numericId;
          console.log('Using hex value directly for sessionId:', sessionIdForContract);
        } else {
          // Convert string to BigInt
          try {
            sessionIdForContract = BigInt(numericId);
            console.log('Converted sessionId to BigInt:', sessionIdForContract.toString());
          } catch (error) {
            console.error('Error converting sessionId to BigInt:', error);
            // Fallback to a simple number
            sessionIdForContract = BigInt(Math.floor(Math.random() * 1000000));
            console.log('Using fallback random sessionId:', sessionIdForContract.toString());
          }
        }

        // Call the contract method
        const gasEstimate = await factory.methods.createVoteSession(
          sessionIdForContract,
          deploymentData.participants,
          endTimestampBN,
          voteMode,
          maxChoicesBN
        ).estimateGas({ from: account });
        
        console.log('Gas estimate for creation:', gasEstimate.toString());
        
        // Calculate gas with buffer - explicit BigInt conversion
        let gasWithBuffer;
        try {
          // Convert to number first, apply buffer, then back to BigInt
          const gasEstimateNum = Number(gasEstimate);
          const bufferedGas = Math.floor(gasEstimateNum * 1.2);
          gasWithBuffer = BigInt(bufferedGas);
          console.log('Calculated gas with buffer:', gasWithBuffer.toString());
        } catch (error) {
          console.error('Error calculating gas buffer:', error);
          // Fallback: use the gasEstimate directly with a fixed buffer
          gasWithBuffer = gasEstimate + BigInt(100000); // Add 100k gas as buffer
          console.log('Fallback gas calculation:', gasWithBuffer.toString());
        }
        
        // Execute the transaction
        const receipt = await factory.methods.createVoteSession(
          sessionIdForContract,
          deploymentData.participants,
          endTimestampBN,
          voteMode,
          maxChoicesBN
        ).send({ 
          from: account,
          gas: gasWithBuffer
        });
        
        console.log('Transaction receipt:', receipt);
        
        // Extract the session address from the transaction receipt
        let sessionAddress = '';
        
        // Try to extract address from events
        if (receipt && receipt.events && receipt.events.SessionCreated) {
          sessionAddress = receipt.events.SessionCreated.returnValues.sessionAddress;
          console.log('Extracted address from SessionCreated event:', sessionAddress);
        } 
        // Fallback to direct return value
        else if (receipt && receipt.returnValues && receipt.returnValues.sessionAddress) {
          sessionAddress = receipt.returnValues.sessionAddress;
          console.log('Extracted address from return values:', sessionAddress);
        }
        // Fallback for web3 v4+ format
        else if (receipt && typeof receipt === 'object' && 'sessionAddress' in receipt) {
          sessionAddress = receipt.sessionAddress;
          console.log('Extracted address from receipt object:', sessionAddress);
        }
        
        if (!sessionAddress) {
          console.error('Failed to extract session address from receipt:', receipt);
          throw new Error("Failed to get session address from transaction receipt");
        }
        
        // Save this for error case
        tempSessionAddress = sessionAddress;
        
        console.log('Created session at address:', sessionAddress);
        
        // Update the session in the database with the contract address
        await sessionService.updateContractAddress(sessionId, sessionAddress);
        
        toast({
          title: "Session Created",
          description: "Voting session has been created on the blockchain",
        });
        
        return sessionAddress;
      } catch (contractError: any) {
        console.error('Contract interaction error:', contractError);
        
        // Check for specific error cases
        if (contractError.message && contractError.message.includes('execution reverted')) {
          // Extract revert reason if available
          const revertReason = contractError.reason || 'Contract execution reverted';
          throw new Error(`Blockchain contract error: ${revertReason}`);
        }
        
        throw contractError;
      }
    } catch (error: any) {
      console.error('Error creating blockchain session:', error);
      
      // Handle user rejected request error
      if (error.code === 4001) {
        toast({
          title: "Transaction Rejected",
          description: "You rejected the transaction",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Creation Failed",
          description: error.message || "Failed to create voting session on blockchain",
          variant: "destructive"
        });
      }
      
      throw error;
    }
    
    // This will only be reached if an error occurs and is caught
    return tempSessionAddress;
  }

  /**
   * Get session information from the blockchain
   * @param contractAddress The address of the session contract
   */
  async getSessionInfo(contractAddress: string): Promise<any> {
    try {
      const session = this.getSessionContract(contractAddress);
      
      // Get session status (active and remaining time)
      const status = await session.methods.getStatus().call();
      
      // Get voter count
      const voterCount = await session.methods.getVoterCount().call();
      
      // Get session results
      const results = await session.methods.getResults().call();
      
      return {
        isActive: status.isActive,
        remainingTime: status.remainingTime,
        voterCount,
        results: {
          participantNames: results[0],
          voteCounts: results[1]
        }
      };
    } catch (error: any) {
      console.error('Error getting session info:', error);
      throw error;
    }
  }

  /**
   * Check if an account has already voted in a session
   * @param contractAddress The address of the session contract
   * @param accountAddress The Ethereum address to check
   */
  async hasVoted(contractAddress: string, accountAddress: string): Promise<boolean> {
    try {
      const session = this.getSessionContract(contractAddress);
      return await session.methods.checkVoted(accountAddress).call();
    } catch (error: any) {
      console.error('Error checking if account has voted:', error);
      throw error;
    }
  }

  /**
   * Get the chain ID in decimal format
   */
  async getChainId(): Promise<number> {
    const web3 = this.initWeb3();
    const chainId = await web3.eth.getChainId();
    return Number(chainId); // Convert bigint to number
  }

  /**
   * Cast a vote in a blockchain session
   * @param contractAddress The address of the session contract
   * @param choices Array of candidate/option IDs to vote for
   * @returns Transaction hash of the vote
   */
  async castVote(contractAddress: string, choices: string[]): Promise<string> {
    try {
      // Ensure MetaMask is connected
      const account = await metamaskService.connect();
      if (!account) {
        throw new Error("MetaMask connection is required to cast a vote");
      }
      
      // Check if user has already voted
      const hasAlreadyVoted = await this.hasVoted(contractAddress, account);
      if (hasAlreadyVoted) {
        throw new Error("You have already voted in this session");
      }
      
      // Get the session contract
      const session = this.getSessionContract(contractAddress);
      
      // Send the transaction
      console.log(`Casting vote for choices:`, choices);
      const transaction = await session.methods.vote(choices).send({ from: account });
      
      console.log('Vote cast successfully:', transaction.transactionHash);
      return transaction.transactionHash;
    } catch (error: any) {
      console.error('Error casting vote:', error);
      if (error.code === 4001) {
        throw new Error("You rejected the transaction");
      }
      throw new Error(error.message || "Failed to cast vote on blockchain");
    }
  }

  /**
   * Synchronize blockchain vote results with the database
   * @param sessionId The database ID of the session
   * @param contractAddress The contract address of the session
   * @returns Promise resolving to whether the sync was successful
   */
  async syncBlockchainResults(sessionId: string, contractAddress: string): Promise<boolean> {
    try {
      console.log(`Syncing blockchain results for session ${sessionId} at address ${contractAddress}`);
      
      // Get session information from the blockchain
      const session = this.getSessionContract(contractAddress);
      
      // Get session results from the blockchain
      const results = await session.methods.getResults().call();
      
      // Extract vote counts from the blockchain
      const participantNames = results[0];
      const voteCounts = results[1];
      
      console.log('Blockchain vote counts:', {
        participantNames,
        voteCounts
      });
      
      // Get session data from the database to map IDs
      const sessionData = await sessionService.getSessionById(sessionId);
      
      // Determine the type (candidate or option)
      const type = sessionData.type === 'election' ? 'candidate' : 'option';
      
      // Build the counts array for the API
      let counts: Array<{ id: string; totalVotes: number }> = [];
      
      if (type === 'candidate' && sessionData.type === 'election') {
        const candidates = (sessionData as any).candidates || [];
        counts = candidates.map((candidate: any, index: number) => ({
          id: candidate._id,
          totalVotes: index < voteCounts.length ? Number(voteCounts[index]) : 0
        }));
      } else if (type === 'option' && sessionData.type === 'poll') {
        const options = (sessionData as any).options || [];
        counts = options.map((option: any, index: number) => ({
          id: option._id,
          totalVotes: index < voteCounts.length ? Number(voteCounts[index]) : 0
        }));
      }
      
      if (counts.length === 0) {
        console.warn('No participant data found to update vote counts');
        return false;
      }
      
      console.log(`Updating vote counts for ${type}s:`, counts);
      
      // Send update to the server
      const updateSuccess = await sessionService.updateSessionVoteCounts(sessionId, {
        type,
        counts
      });
      
      if (updateSuccess) {
        // Update the last blockchain sync timestamp in the session
        await sessionService.updateSession(sessionId, {
          results: {
            lastBlockchainSync: new Date().toISOString(),
            blockchainVoterCount: await this.getVoterCount(contractAddress)
          }
        });
        
        console.log('Successfully synced blockchain results to database');
        return true;
      } else {
        console.error('Failed to update session vote counts');
        return false;
      }
    } catch (error: any) {
      console.error('Error syncing blockchain results:', error);
      return false;
    }
  }
  
  /**
   * Get the number of voters from a session contract
   * @param contractAddress The contract address of the session
   * @returns The number of voters
   */
  async getVoterCount(contractAddress: string): Promise<number> {
    try {
      const session = this.getSessionContract(contractAddress);
      const voterCount = await session.methods.getVoterCount().call();
      return Number(voterCount);
    } catch (error) {
      console.error('Error getting voter count:', error);
      return 0;
    }
  }

  /**
   * End a session by removing blockchain integration
   * @param sessionId The ID of the session
   * @param contractAddress The address of the session contract (for reference only)
   * @returns Promise resolving to success status
   */
  async endSession(sessionId: string, contractAddress: string): Promise<boolean> {
    try {
      console.log(`Ending session ${sessionId} with contract at ${contractAddress}`);
      
      // First, do a final blockchain data sync to record the final vote state
      await this.syncBlockchainResults(sessionId, contractAddress);
      
      // Update the session in the database to mark as ended
      const now = new Date().toISOString();
      
      // Update the session lifecycle state in the database
      const updateResult = await sessionService.updateSession(sessionId, {
        sessionLifecycle: {
          endedAt: now
        }
      });
      
      console.log('Session marked as ended in database');
      
      return true;
    } catch (error: any) {
      console.error('Error ending session:', error);
      throw new Error(error.message || "Failed to end session");
    }
  }

  /**
   * Check if a session is active on the blockchain
   * @param contractAddress The address of the session contract
   * @returns Promise resolving to active status
   */
  async isSessionActive(contractAddress: string): Promise<boolean> {
    try {
      // Get the session contract
      const session = this.getSessionContract(contractAddress);
      
      // Try different ways to get active status based on contract methods
      if (session.methods.getStatus) {
        // First try the getStatus method which returns {isActive, remainingTime}
        const status = await session.methods.getStatus().call();
        return status.isActive === true;
      } else if (session.methods.isActive) {
        // Try direct isActive method
        return await session.methods.isActive().call();
      } else if (session.methods.active) {
        // Try direct active property
        return await session.methods.active().call();
      }
      
      // If no standard method is found
      console.warn('Could not determine session active status from contract');
      return false;
    } catch (error: any) {
      console.error('Error checking session active status:', error);
      return false;
    }
  }
}

export const blockchainService = new BlockchainService();
export default blockchainService;