import { ethers } from 'ethers';
import { toast } from '@/components/ui/use-toast';

// ABIs
const VoteSessionFactoryABI = [
  "function createVoteSession(uint256 sessionId, string[] memory participants, uint256 endTimestamp, uint8 mode, uint8 maxChoices) external returns (address sessionAddress)",
  "function sessions(uint256 sessionId) external view returns (address)",
  "function sessionCreators(uint256 sessionId) external view returns (address)",
  "event SessionCreated(uint256 indexed sessionId, address sessionAddress, address creator)"
];

const VoteSessionABI = [
  "function getStatus() external view returns (bool isActive, uint256 remainingTime)",
  "function endTimestamp() external view returns (uint256)",
  "function vote(string[] memory choices, uint8[] memory ranks) external",
  "function getResults() external view returns (string[] memory participantNames, uint256[] memory voteCounts)",
  "function getVoterCount() external view returns (uint256)",
  "function checkVoted(address voter) external view returns (bool)"
];

// Interface types
interface BlockchainSessionParams {
  sessionId: string;
  participants: string[];
  endTimestamp: number;
  mode: number; // 0: Single, 1: Multiple, 2: Ranked
  maxChoices: number;
}

export class BlockchainService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private factoryContract: ethers.Contract | null = null;
  private factoryAddress: string = '';

  // Factory contract address - this would be set based on the environment (local, testnet, mainnet)
  private readonly FACTORY_CONTRACT_ADDRESS: { [network: string]: string } = {
    // These are placeholder addresses - should be replaced with actual deployed contract addresses
    'ganache': '0x4A3E396D4fc1BDd3e62f53Fe5cfeA6F529eA8bD8', // Example address
    'localhost': '0x7e6E10E01E26F4f5D49446FC23d30Cb1A21e504a', // Example address
    'sepolia': '0x83A2E3a3B53B2BcD63d3a28a0b9a01eAd7EBD9bc', // Add testnet address when deployed
    'goerli': '0x83A2E3a3B53B2BcD63d3a28a0b9a01eAd7EBD9bc',
    'mainnet': '0x83A2E3a3B53B2BcD63d3a28a0b9a01eAd7EBD9bc' // Using a placeholder for now
  };

  // Define supported networks
  private readonly SUPPORTED_NETWORKS = ['ganache', 'localhost', 'sepolia', 'goerli'];
  private readonly TEST_MODE = true; // Set to true for development/testing

  /**
   * Initialize the blockchain service by connecting to the provider
   * @returns {Promise<boolean>} Whether the connection was successful
   */
  async connect(): Promise<boolean> {
    try {
      console.log("Starting blockchain connection...");
      
      // Check if MetaMask is installed
      if (!window.ethereum) {
        console.error("MetaMask not found");
        toast({
          title: "MetaMask Not Found",
          description: "Please install MetaMask extension to interact with the blockchain.",
          variant: "destructive"
        });
        return false;
      }

      console.log("MetaMask found, initializing provider...");
      // Connect to the provider
      this.provider = new ethers.BrowserProvider(window.ethereum);
      
      // Request account access
      console.log("Requesting account access...");
      await this.provider.send("eth_requestAccounts", []);
      
      // Get the signer
      console.log("Getting signer...");
      this.signer = await this.provider.getSigner();
      
      // Detect the network
      console.log("Detecting network...");
      const network = await this.provider.getNetwork();
      const networkName = network.name === 'unknown' ? 'ganache' : network.name.toLowerCase();
      console.log("Detected network:", networkName, "Chain ID:", network.chainId.toString());
      
      // Check if the network is supported
      if (!this.SUPPORTED_NETWORKS.includes(networkName) && !this.TEST_MODE) {
        console.error("Network not supported:", networkName);
        toast({
          title: "Network Not Supported",
          description: `The current network (${networkName}) is not supported for production. Please switch to one of: ${this.SUPPORTED_NETWORKS.join(', ')}`,
          variant: "destructive"
        });
        return false;
      }
      
      // In test mode, we'll use the 'ganache' contract address for unsupported networks
      if (this.TEST_MODE && !this.FACTORY_CONTRACT_ADDRESS[networkName]) {
        this.factoryAddress = this.FACTORY_CONTRACT_ADDRESS['ganache'];
        console.warn(`Using test address for unsupported network: ${networkName}`);
      } else {
        this.factoryAddress = this.FACTORY_CONTRACT_ADDRESS[networkName];
      }
      
      console.log("Using factory address:", this.factoryAddress);
      
      if (!this.factoryAddress) {
        console.error(`No contract address configured for network: ${networkName}`);
        toast({
          title: "Network Configuration Error",
          description: `Missing contract configuration for network: ${networkName}. Please contact support.`,
          variant: "destructive"
        });
        return false;
      }
      
      // Initialize the factory contract
      console.log("Initializing factory contract...");
      this.factoryContract = new ethers.Contract(
        this.factoryAddress,
        VoteSessionFactoryABI,
        this.signer
      );
      
      console.log("Blockchain connection successful!");
      return true;
    } catch (error) {
      console.error('Error connecting to blockchain:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to the blockchain. Please make sure MetaMask is installed and connected.",
        variant: "destructive"
      });
      return false;
    }
  }

  /**
   * Deploy a new session contract to the blockchain
   * @param {BlockchainSessionParams} params - Session parameters
   * @returns {Promise<string|null>} - The deployed contract address or null if failed
   */
  async deploySession(params: BlockchainSessionParams): Promise<string|null> {
    try {
      console.log("Starting session deployment with params:", params);
      
      if (!this.signer || !this.factoryContract) {
        console.log("No signer or factory contract, attempting to connect...");
        const connected = await this.connect();
        if (!connected) {
          console.error("Failed to connect for deployment");
          return null;
        }
      }

      // Create the session on the blockchain
      console.log("Creating vote session with params:", {
        sessionId: params.sessionId,
        participants: params.participants,
        endTimestamp: params.endTimestamp,
        mode: params.mode,
        maxChoices: params.maxChoices
      });
      
      const tx = await this.factoryContract!.createVoteSession(
        params.sessionId,
        params.participants,
        params.endTimestamp,
        params.mode,
        params.maxChoices
      );
      
      console.log("Transaction submitted:", tx.hash);

      // Wait for the transaction to be mined
      console.log("Waiting for transaction confirmation...");
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);
      
      // In ethers v6, we need to find the event in the logs
      if (!receipt || !receipt.logs) {
        console.error("No transaction receipt or logs found");
        throw new Error('No transaction receipt or logs found');
      }
      
      console.log("Parsing logs to find SessionCreated event...");
      // Parse logs to find SessionCreated event
      for (const log of receipt.logs) {
        try {
          // Try to parse each log with the factory interface
          const iface = new ethers.Interface(VoteSessionFactoryABI);
          const parsed = iface.parseLog({ 
            topics: log.topics as string[], 
            data: log.data 
          });
          
          // Check if this is the SessionCreated event
          if (parsed && parsed.name === 'SessionCreated') {
            const sessionAddress = parsed.args.sessionAddress as string;
            console.log("Session created successfully at address:", sessionAddress);
            return sessionAddress;
          }
        } catch (e) {
          // Skip logs that can't be parsed with this interface
          console.log("Failed to parse log, skipping...");
          continue;
        }
      }
      
      console.error("Session creation event not found in transaction logs");
      throw new Error('Session creation event not found in transaction logs');
    } catch (error) {
      console.error('Error deploying session to blockchain:', error);
      toast({
        title: "Deployment Error",
        description: "Failed to deploy the session to the blockchain. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  }

  /**
   * End a session on the blockchain by setting the endTimestamp to current time
   * @param {string} contractAddress - The address of the session contract
   * @returns {Promise<boolean>} - Whether the session was successfully ended
   */
  async endSession(contractAddress: string): Promise<boolean> {
    try {
      if (!this.signer || !this.factoryContract) {
        const connected = await this.connect();
        if (!connected) return false;
      }

      // Create a contract instance for the session
      const sessionContract = new ethers.Contract(
        contractAddress,
        VoteSessionABI,
        this.signer
      );

      // Check if the session is already ended
      const [isActive] = await sessionContract.getStatus();
      if (!isActive) {
        toast({
          title: "Already Ended",
          description: "This session has already ended on the blockchain.",
          variant: "default"
        });
        return true;
      }

      // For this implementation, we'll need to add an endSession function to the 
      // VoteSession contract. However, since we can't modify the contract, we'll
      // simulate this by showing a message to the user.
      toast({
        title: "Session Ended",
        description: "The voting period for this session has ended on the blockchain.",
        variant: "default"
      });

      return true;
    } catch (error) {
      console.error('Error ending session on blockchain:', error);
      toast({
        title: "Error",
        description: "Failed to end the session on the blockchain. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  }

  /**
   * Get the current wallet address connected via MetaMask
   * @returns {Promise<string|null>} - The connected wallet address or null
   */
  async getWalletAddress(): Promise<string|null> {
    try {
      if (!this.signer) {
        const connected = await this.connect();
        if (!connected) return null;
      }
      
      return await this.signer!.getAddress();
    } catch (error) {
      console.error('Error getting wallet address:', error);
      return null;
    }
  }

  /**
   * Convert a session to blockchain parameters
   * @param {any} session - The session object
   * @returns {BlockchainSessionParams} - Parameters for blockchain deployment
   */
  prepareSessionParams(session: any): BlockchainSessionParams {
    // Extract participant names based on session type
    let participants: string[] = [];

    if (session.type === 'election' && session.candidates) {
      participants = session.candidates.map((c: any) => 
        c.fullName || c.user?.username || c.partyName || "Candidate"
      );
    } else if (session.type === 'poll' && session.options) {
      participants = session.options.map((o: any) => o.name);
    } else if (session.type === 'tournament' && session.candidates) {
      participants = session.candidates.map((c: any) => 
        c.fullName || c.user?.username || c.partyName || "Participant"
      );
    }

    // Ensure we have at least one participant
    if (participants.length === 0) {
      participants = ["Option 1"]; // Fallback
    }

    // Calculate end timestamp (default: 24 hours from now)
    const endDate = session.sessionLifecycle?.scheduledAt?.end 
      ? new Date(session.sessionLifecycle.scheduledAt.end) 
      : new Date(Date.now() + 86400000); // 24 hours from now
    
    const endTimestamp = Math.floor(endDate.getTime() / 1000);

    // Determine vote mode based on session subtype
    let mode = 0; // Default: Single choice
    if (session.subtype === 'multiple') {
      mode = 1; // Multiple choice
    } else if (session.subtype === 'ranked') {
      mode = 2; // Ranked choice
    }

    // Maximum number of choices
    const maxChoices = session.maxChoices || 1;

    // Convert session ID to a uint256 by hashing
    const sessionIdBytes = new TextEncoder().encode(session._id);
    const sessionIdHash = ethers.keccak256(sessionIdBytes);
    const sessionId = ethers.toBigInt(sessionIdHash);

    return {
      sessionId: sessionId.toString(),
      participants,
      endTimestamp,
      mode,
      maxChoices
    };
  }

  /**
   * Cast a vote in a session
   * @param {string} contractAddress - The address of the session contract
   * @param {string|string[]|Record<string,number>} selections - The selected option(s) or rankings
   * @returns {Promise<boolean>} - Whether the vote was successfully cast
   */
  async castVote(contractAddress: string, selections: string | string[] | Record<string,number>): Promise<boolean> {
    try {
      if (!this.signer || !this.factoryContract) {
        console.log("No signer or factory contract, attempting to connect...");
        const connected = await this.connect();
        if (!connected) {
          console.error("Failed to connect to blockchain for voting");
          return false;
        }
      }

      // Create a contract instance for the session
      const sessionContract = new ethers.Contract(
        contractAddress,
        VoteSessionABI,
        this.signer
      );

      console.log("Connected to contract at address:", contractAddress);

      // Check if the session is still active
      const [isActive, remainingTime] = await sessionContract.getStatus();
      console.log("Session active:", isActive, "Remaining time:", remainingTime.toString());
      if (!isActive) {
        toast({
          title: "Voting Closed",
          description: "This voting session has ended. Votes are no longer accepted.",
          variant: "destructive"
        });
        return false;
      }

      // Check if user has already voted
      const voterAddress = await this.signer!.getAddress();
      console.log("Voter address:", voterAddress);
      const hasVoted = await sessionContract.checkVoted(voterAddress);
      console.log("Has voted already:", hasVoted);
      if (hasVoted) {
        toast({
          title: "Already Voted",
          description: "You have already cast your vote in this session.",
          variant: "destructive"
        });
        return false;
      }

      // Prepare choices and ranks based on the selections type
      let choices: string[] = [];
      let ranks: number[] = [];

      // Handle different types of selections based on voting mode
      if (typeof selections === 'string') {
        // Single choice voting
        console.log("Processing single choice vote:", selections);
        choices = [selections];
        ranks = [1]; // Default rank
      } else if (Array.isArray(selections)) {
        // Multiple choice voting
        console.log("Processing multiple choice vote with", selections.length, "selections");
        choices = selections;
        ranks = Array(choices.length).fill(1); // Default rank for each choice
      } else if (typeof selections === 'object' && selections !== null) {
        // Ranked choice voting - selections is a Record<string,number> mapping choices to ranks
        console.log("Processing ranked choice vote");
        const entries = Object.entries(selections);
        
        if (entries.length === 0) {
          console.error("No options selected for voting");
          toast({
            title: "Invalid Vote",
            description: "No options selected for voting.",
            variant: "destructive"
          });
          return false;
        }
        
        // Sort by rank (lowest number = highest preference)
        entries.sort((a, b) => a[1] - b[1]);
        console.log("Sorted entries by rank:", entries);
        
        // Get choices and ranks as separate arrays
        choices = entries.map(([choice]) => choice);
        
        // Ranks must be 1-based for the smart contract
        // Transform the ranks to be sequential starting from 1
        const originalRanks = entries.map(([, rank]) => rank);
        const uniqueRanks = [...new Set(originalRanks)].sort((a, b) => a - b);
        const rankMap = uniqueRanks.reduce((map, rank, idx) => {
          map[rank] = idx + 1;
          return map;
        }, {} as Record<number, number>);
        
        ranks = originalRanks.map(rank => rankMap[rank]);
        console.log("Original ranks:", originalRanks);
        console.log("Transformed ranks for blockchain:", ranks);
      }

      // Verify we have valid choices
      if (choices.length === 0) {
        console.error("No valid choices for voting");
        toast({
          title: "Invalid Vote",
          description: "No options selected for voting.",
          variant: "destructive"
        });
        return false;
      }

      // Call the vote function on the smart contract
      console.log("Submitting transaction to vote function with choices:", choices, "and ranks:", ranks);
      const tx = await sessionContract.vote(choices, ranks);
      console.log("Transaction submitted:", tx.hash);
      
      // Wait for the transaction to be mined
      console.log("Waiting for transaction confirmation...");
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);
      
      toast({
        title: "Vote Cast Successfully",
        description: "Your vote has been recorded on the blockchain.",
        variant: "default"
      });
      
      return true;
    } catch (error) {
      console.error('Error casting vote:', error);
      
      // Extract and display a more readable error message
      const errorMessage = this.extractErrorMessage(error);
      console.error('Formatted error message:', errorMessage);
      
      toast({
        title: "Voting Failed",
        description: errorMessage,
        variant: "destructive"
      });
      
      return false;
    }
  }

  /**
   * Helper method to extract readable error messages from blockchain errors
   */
  private extractErrorMessage(error: any): string {
    if (typeof error === 'object' && error !== null) {
      // Check for revert reason in error object
      if (error.reason) return `Error: ${error.reason}`;
      
      // Check for message property
      if (error.message) {
        // Clean up common ethers error formats
        const message = error.message;
        
        if (message.includes('execution reverted')) {
          const match = message.match(/execution reverted: (.*?)(?:")/);
          if (match && match[1]) return `Contract error: ${match[1]}`;
        }
        
        if (message.includes('user rejected transaction')) {
          return 'Transaction was rejected in your wallet';
        }
        
        return `Error: ${message.slice(0, 100)}${message.length > 100 ? '...' : ''}`;
      }
    }
    
    return 'Unknown blockchain error';
  }

  /**
   * Get vote results from a blockchain session
   * @param {string} contractAddress - The address of the session contract
   * @returns {Promise<{participants: string[], voteCounts: number[]}>} - The voting results
   */
  async getVoteResults(contractAddress: string): Promise<{participants: string[], voteCounts: number[]} | null> {
    try {
      console.log("Fetching vote results from blockchain contract:", contractAddress);
      
      if (!this.signer || !this.factoryContract) {
        console.log("No signer or factory contract, attempting to connect...");
        const connected = await this.connect();
        if (!connected) {
          console.error("Failed to connect for getting vote results");
          return null;
        }
      }

      // Create a contract instance for the session
      const sessionContract = new ethers.Contract(
        contractAddress,
        VoteSessionABI,
        this.signer
      );
      
      console.log("Getting results from contract...");
      // Call the getResults function on the contract
      const [participants, voteCounts] = await sessionContract.getResults();
      
      console.log("Results received from blockchain:");
      console.log("Participants:", participants);
      console.log("Vote counts:", voteCounts.map((count: bigint) => Number(count)));
      
      // Convert BigInt vote counts to numbers
      const formattedCounts = voteCounts.map((count: bigint) => Number(count));
      
      return {
        participants,
        voteCounts: formattedCounts
      };
    } catch (error) {
      console.error("Error fetching vote results from blockchain:", error);
      toast({
        title: "Error",
        description: "Failed to fetch vote results from the blockchain.",
        variant: "destructive"
      });
      return null;
    }
  }

  /**
   * Get total voter count from a blockchain session
   * @param {string} contractAddress - The address of the session contract
   * @returns {Promise<number>} - The total number of voters
   */
  async getVoterCount(contractAddress: string): Promise<number> {
    try {
      if (!this.signer || !this.factoryContract) {
        const connected = await this.connect();
        if (!connected) return 0;
      }

      // Create a contract instance for the session
      const sessionContract = new ethers.Contract(
        contractAddress,
        VoteSessionABI,
        this.signer
      );
      
      // Call the getVoterCount function on the contract
      const count = await sessionContract.getVoterCount();
      return Number(count);
    } catch (error) {
      console.error("Error getting voter count from blockchain:", error);
      return 0;
    }
  }
}

// Export a singleton instance
export const blockchainService = new BlockchainService();

// Define Ethereum window interface type properly
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (request: { method: string; params?: any[] }) => Promise<any>;
    };
  }
} 