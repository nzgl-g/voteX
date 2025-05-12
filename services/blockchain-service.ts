import { ethers } from 'ethers';

// Import contract ABIs
const VoteSessionFactoryABI = [
  "function createVoteSession(uint256 sessionId, string[] memory participants, uint256 endTimestamp, uint8 mode, uint8 maxChoices) external returns (address sessionAddress)",
  "function sessions(uint256) external view returns (address)",
  "function sessionCreators(uint256) external view returns (address)",
  "function getAllSessionIds() external view returns (uint256[] memory)",
  "function getSessionCount() external view returns (uint256)",
  "event SessionCreated(uint256 indexed sessionId, address sessionAddress, address creator)"
];

const VoteSessionABI = [
  "function sessionId() external view returns (uint256)",
  "function participants(uint256) external view returns (string memory)",
  "function endTimestamp() external view returns (uint256)",
  "function voteMode() external view returns (uint8)",
  "function maxChoices() external view returns (uint8)",
  "function creator() external view returns (address)",
  "function vote(string[] memory choices, uint8[] memory ranks) external",
  "function getResults() external view returns (string[] memory participantNames, uint256[] memory voteCounts)",
  "function getStatus() external view returns (bool isActive, uint256 remainingTime)",
  "function getVoterCount() external view returns (uint256)",
  "function checkVoted(address voter) external view returns (bool)",
  "event VoteCast(address indexed voter, string[] choices)",
  "event RankedVoteCast(address indexed voter, string[] choices, uint8[] ranks)"
];

// Factory contract address
const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_VOTE_FACTORY_ADDRESS || '';

// Type definition for MetaMask Ethereum provider
type MetaMaskEthereumProvider = {
  isMetaMask?: boolean;
  request: (request: { method: string; params?: any[] }) => Promise<any>;
  // Additional properties needed for event handling
  // We'll use type assertions instead of declaring these in the interface
};

/**
 * Handles blockchain interactions for the voting system
 */
class BlockchainService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private factory: ethers.Contract | null = null;
  private walletAddress: string | null = null;
  private factoryAddress: string = FACTORY_ADDRESS;
  private accountsChangedHandler: ((accounts: string[]) => void) | null = null;

  /**
   * Connects to MetaMask or other Ethereum provider
   */
  async connect(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.ethereum) {
      console.error("Ethereum provider not available");
      return false;
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      this.walletAddress = accounts[0];
      
      // Set up provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      
      // Initialize factory contract
      this.factory = new ethers.Contract(this.factoryAddress, VoteSessionFactoryABI, this.signer);
      
      console.log('Connected to wallet:', this.walletAddress);
      
      // Set up event listeners for account changes
      this.setupEventListeners();
      
      return true;
    } catch (error) {
      console.error('Error connecting to provider:', error);
      return false;
    }
  }

  /**
   * Setup event listeners for MetaMask events
   */
  private setupEventListeners(): void {
    if (typeof window === 'undefined' || !window.ethereum) {
      return;
    }
    
    try {
      // Handler for account changes
      this.accountsChangedHandler = (accounts: string[]) => {
        console.log('Accounts changed:', accounts);
        this.walletAddress = accounts[0] || null;
        this.reconnect();
      };
      
      // Add event listener using direct property access
      // Use any type assertion to bypass TypeScript checking
      const ethereum = window.ethereum as any;
      if (ethereum && typeof ethereum.on === 'function') {
        ethereum.on('accountsChanged', this.accountsChangedHandler);
        
        // Set up cleanup on window unload
        window.addEventListener('unload', this.cleanupEventListeners);
      }
    } catch (error) {
      console.error('Error setting up event listeners:', error);
    }
  }
  
  /**
   * Clean up event listeners
   */
  private cleanupEventListeners = (): void => {
    if (typeof window === 'undefined' || !window.ethereum || !this.accountsChangedHandler) {
      return;
    }
    
    try {
      // Remove event listener using direct property access
      const ethereum = window.ethereum as any;
      if (ethereum && typeof ethereum.removeListener === 'function') {
        ethereum.removeListener('accountsChanged', this.accountsChangedHandler);
      }
    } catch (error) {
      console.error('Error cleaning up event listeners:', error);
    }
  };

  /**
   * Reconnects after account change
   */
  private async reconnect(): Promise<void> {
    if (!this.provider || !window.ethereum) return;
    
    try {
      this.signer = await this.provider.getSigner();
      this.factory = new ethers.Contract(this.factoryAddress, VoteSessionFactoryABI, this.signer);
    } catch (error) {
      console.error('Error reconnecting after account change:', error);
    }
  }

  /**
   * Deploys a new voting session contract
   */
  async deploySession(
    sessionId: string,
    candidates: string[],
    endTimestamp: number,
    mode: number,
    maxChoices: number
  ): Promise<string> {
    if (!this.factory || !this.signer) {
      throw new Error('Not connected to blockchain');
    }

    try {
      // Convert string ID to BigInt (required for contract)
      const numericSessionId = BigInt(sessionId);
      
      console.log('Deploying session with data:', { 
        sessionId: numericSessionId.toString(), 
        candidates, 
        endTimestamp, 
        mode, 
        maxChoices 
      });

      // Execute transaction
      const tx = await this.factory.createVoteSession(
        numericSessionId,
        candidates,
        endTimestamp,
        mode,
        maxChoices
      );

      // Wait for transaction confirmation
      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.hash);

      // Find SessionCreated event
      const event = receipt.logs
        .map((log: any) => {
          try {
            return this.factory?.interface.parseLog({
              topics: log.topics,
              data: log.data
            });
          } catch (e) {
            return null;
          }
        })
        .find((event: any) => event && event.name === 'SessionCreated');

      if (!event) {
        throw new Error('Session creation event not found in transaction');
      }

      // Return the contract address
      const sessionAddress = event.args.sessionAddress;
      console.log('Session deployed at:', sessionAddress);
      return sessionAddress;
    } catch (error) {
      console.error('Error deploying session:', error);
      throw error;
    }
  }

  /**
   * Cast a vote in a voting session
   */
  async castVote(
    sessionAddress: string,
    choices: string[],
    ranks: number[] = []
  ): Promise<string> {
    if (!this.signer) {
      throw new Error('Not connected to blockchain');
    }

    try {
      // Create session contract instance
      const sessionContract = new ethers.Contract(sessionAddress, VoteSessionABI, this.signer);
      
      // Cast vote
      const tx = await sessionContract.vote(choices, ranks);
      console.log('Vote transaction sent:', tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('Vote confirmed in transaction:', receipt.hash);
      
      return receipt.hash;
    } catch (error) {
      console.error('Error casting vote:', error);
      throw error;
    }
  }

  /**
   * Get vote results from a session
   */
  async getResults(sessionAddress: string): Promise<{ participants: string[], votes: number[] }> {
    if (!this.provider) {
      throw new Error('Not connected to blockchain');
    }

    try {
      // Create read-only session contract
      const sessionContract = new ethers.Contract(
        sessionAddress,
        VoteSessionABI,
        this.provider
      );
      
      // Get results
      const [participants, votes] = await sessionContract.getResults();
      
      return {
        participants,
        votes: votes.map((v: bigint) => Number(v))
      };
    } catch (error) {
      console.error('Error getting results:', error);
      throw error;
    }
  }

  /**
   * Get session status (active/ended and remaining time)
   */
  async getSessionStatus(sessionAddress: string): Promise<{ isActive: boolean, remainingTime: number }> {
    if (!this.provider) {
      throw new Error('Not connected to blockchain');
    }

    try {
      const sessionContract = new ethers.Contract(
        sessionAddress,
        VoteSessionABI,
        this.provider
      );
      
      const [isActive, remainingTime] = await sessionContract.getStatus();
      
      return {
        isActive,
        remainingTime: Number(remainingTime)
      };
    } catch (error) {
      console.error('Error getting session status:', error);
      throw error;
    }
  }

  /**
   * Get number of voters who have participated
   */
  async getVoterCount(sessionAddress: string): Promise<number> {
    if (!this.provider) {
      throw new Error('Not connected to blockchain');
    }

    try {
      const sessionContract = new ethers.Contract(
        sessionAddress,
        VoteSessionABI,
        this.provider
      );
      
      const count = await sessionContract.getVoterCount();
      return Number(count);
    } catch (error) {
      console.error('Error getting voter count:', error);
      throw error;
    }
  }

  /**
   * Check if the current wallet has already voted
   */
  async hasVoted(sessionAddress: string): Promise<boolean> {
    if (!this.provider || !this.walletAddress) {
      throw new Error('Not connected to blockchain');
    }

    try {
      const sessionContract = new ethers.Contract(
        sessionAddress,
        VoteSessionABI,
        this.provider
      );
      
      return await sessionContract.checkVoted(this.walletAddress);
    } catch (error) {
      console.error('Error checking vote status:', error);
      throw error;
    }
  }

  /**
   * Get the current wallet address
   */
  getWalletAddress(): string | null {
    return this.walletAddress;
  }

  /**
   * Checks if wallet is connected
   */
  isConnected(): boolean {
    return !!this.walletAddress && !!this.signer;
  }
}

// Create singleton instance
const blockchainService = new BlockchainService();
export default blockchainService;
