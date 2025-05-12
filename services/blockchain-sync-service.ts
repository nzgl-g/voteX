import { blockchainService } from './blockchain-service';
import { sessionService } from './session-service';
import { toast } from '@/components/ui/use-toast';

// Define the default sync interval in milliseconds (15 seconds)
const DEFAULT_SYNC_INTERVAL = 15000;
let syncIntervalId: NodeJS.Timeout | null = null;

interface VoteCountData {
  id: string;
  votes: number;
}

export class BlockchainSyncService {
  private syncInterval = DEFAULT_SYNC_INTERVAL;
  private syncInProgress = false;
  
  /**
   * Start automatic blockchain sync for a specific session
   * @param sessionId - The session ID to sync
   * @param silent - Whether to show notifications on errors
   * @returns void
   */
  startAutoSync(sessionId: string, silent = true) {
    // Clear any existing interval
    this.stopAutoSync();
    
    // Create a new interval
    syncIntervalId = setInterval(() => {
      this.syncBlockchainData(sessionId, silent);
    }, this.syncInterval);
    
    console.log(`Started automatic blockchain sync for session ${sessionId} every ${this.syncInterval/1000} seconds`);
  }
  
  /**
   * Stop automatic blockchain sync
   */
  stopAutoSync() {
    if (syncIntervalId) {
      clearInterval(syncIntervalId);
      syncIntervalId = null;
      console.log('Stopped automatic blockchain sync');
    }
  }
  
  /**
   * Set the sync interval
   * @param milliseconds - The sync interval in milliseconds
   */
  setSyncInterval(milliseconds: number) {
    this.syncInterval = milliseconds;
    console.log(`Set blockchain sync interval to ${milliseconds/1000} seconds`);
  }
  
  /**
   * Sync blockchain data for a session
   * @param sessionId - The session ID to sync
   * @param silent - Whether to show notifications on errors
   * @returns Promise<boolean> - Whether the sync was successful
   */
  async syncBlockchainData(sessionId: string, silent = false): Promise<boolean> {
    // Prevent multiple syncs running at the same time
    if (this.syncInProgress) {
      console.log('Blockchain sync already in progress, skipping');
      return false;
    }
    
    this.syncInProgress = true;
    console.log(`Syncing blockchain data for session ${sessionId}`);
    
    try {
      // First, get the current session to ensure we have the contract address
      const session = await sessionService.getSessionById(sessionId);
      
      if (!session || !session.contractAddress) {
        console.error('Session not found or has no blockchain contract address');
        if (!silent) {
          toast({
            title: 'Blockchain Sync Error',
            description: 'Session not deployed to blockchain yet',
            variant: 'destructive'
          });
        }
        this.syncInProgress = false;
        return false;
      }
      
      console.log(`Connecting to blockchain for session with contract: ${session.contractAddress}`);
      
      // Connect to blockchain
      const connected = await blockchainService.connect();
      if (!connected) {
        console.error('Failed to connect to blockchain for sync');
        if (!silent) {
          toast({
            title: 'Blockchain Connection Error',
            description: 'Could not connect to the blockchain. Please check your wallet connection.',
            variant: 'destructive'
          });
        }
        this.syncInProgress = false;
        return false;
      }
      
      // Get vote results from the blockchain
      console.log('Getting vote results from blockchain...');
      const blockchainResults = await blockchainService.getVoteResults(session.contractAddress);
      
      if (!blockchainResults) {
        console.error('Failed to get blockchain vote results');
        if (!silent) {
          toast({
            title: 'Blockchain Data Error',
            description: 'Could not retrieve voting data from the blockchain',
            variant: 'destructive'
          });
        }
        this.syncInProgress = false;
        return false;
      }
      
      console.log('Blockchain vote results:', blockchainResults);
      
      // Get voter count from blockchain
      const voterCount = await blockchainService.getVoterCount(session.contractAddress);
      console.log('Blockchain voter count:', voterCount);
      
      // Prepare data for the API call
      let voteCounts: VoteCountData[] = [];
      
      if (session.type === 'election' && session.candidates) {
        // Map blockchain participants to candidates
        session.candidates.forEach((candidate: any) => {
          const participantName = candidate.fullName || candidate.partyName || 
            (candidate.user && typeof candidate.user === 'object' ? candidate.user.username : undefined);
          
          const index = blockchainResults.participants.findIndex((p: string) => 
            p === participantName || p === candidate._id
          );
          
          if (index !== -1) {
            voteCounts.push({
              id: candidate._id,
              votes: blockchainResults.voteCounts[index]
            });
          }
        });
      } else if (session.type === 'poll' && session.options) {
        // Map blockchain participants to poll options
        session.options.forEach((option: any) => {
          const index = blockchainResults.participants.findIndex((p: string) => 
            p === option.name || p === option._id
          );
          
          if (index !== -1) {
            voteCounts.push({
              id: option._id,
              votes: blockchainResults.voteCounts[index]
            });
          }
        });
      }
      
      // If we couldn't match any candidates/options, log an error
      if (voteCounts.length === 0) {
        console.error('Could not match any blockchain participants to candidates/options');
        if (!silent) {
          toast({
            title: 'Data Matching Error',
            description: 'Could not match blockchain data to session candidates/options',
            variant: 'destructive'
          });
        }
        this.syncInProgress = false;
        return false;
      }
      
      // Call the server API to update vote counts
      console.log('Sending vote counts to server:', voteCounts);
      
      // Determine the base URL from environment or default to localhost
      const apiBaseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:2000';
      const apiUrl = `${apiBaseUrl}/api/sessions/${sessionId}/vote-counts`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionService.getToken()}`
        },
        body: JSON.stringify({
          type: session.type,
          voteCounts,
          voterCount,
          source: 'blockchain'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error updating vote counts:', errorData);
        if (!silent) {
          toast({
            title: 'Server Sync Error',
            description: 'Failed to update vote counts on the server',
            variant: 'destructive'
          });
        }
        this.syncInProgress = false;
        return false;
      }
      
      const result = await response.json();
      console.log('Server vote count update result:', result);
      
      if (!silent) {
        toast({
          title: 'Blockchain Sync Complete',
          description: `Updated vote counts from blockchain with ${voterCount} total voters`,
          variant: 'default'
        });
      }
      
      this.syncInProgress = false;
      return true;
      
    } catch (error) {
      console.error('Error syncing blockchain data:', error);
      if (!silent) {
        toast({
          title: 'Sync Error',
          description: 'An unexpected error occurred while syncing with blockchain',
          variant: 'destructive'
        });
      }
      this.syncInProgress = false;
      return false;
    }
  }
}

// Export a singleton instance
export const blockchainSyncService = new BlockchainSyncService(); 