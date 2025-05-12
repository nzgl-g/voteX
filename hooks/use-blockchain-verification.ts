import { useState, useEffect } from 'react';
import { blockchainSyncService } from '@/services/blockchain-sync-service';
import { sessionService } from '@/services/session-service';
import { toast } from '@/components/ui/use-toast';

interface UseBlockchainVerificationProps {
  sessionId: string;
  autoSync?: boolean;
  syncInterval?: number;
  showNotifications?: boolean;
}

interface BlockchainVerificationResult {
  isLoading: boolean;
  lastSyncTime: string | null;
  isSyncing: boolean;
  syncNow: () => Promise<boolean>;
  syncSuccess: boolean | null;
  syncError: string | null;
  hasBlockchainData: boolean;
}

/**
 * Custom hook for blockchain verification functionality
 * Provides methods to sync blockchain data and track verification status
 */
export function useBlockchainVerification({
  sessionId,
  autoSync = true,
  syncInterval = 15000,
  showNotifications = false
}: UseBlockchainVerificationProps): BlockchainVerificationResult {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<boolean | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [hasBlockchainData, setHasBlockchainData] = useState<boolean>(false);
  
  // Initial setup
  useEffect(() => {
    let mounted = true;
    
    async function loadInitialData() {
      try {
        // Get initial session data
        const session = await sessionService.getSessionById(sessionId);
        
        if (mounted) {
          const hasBlockchain = Boolean(session?.contractAddress);
          setHasBlockchainData(hasBlockchain);
          
          // Set last sync time if available
          if (session?.results?.lastBlockchainSync) {
            setLastSyncTime(new Date(session.results.lastBlockchainSync).toLocaleString());
          }
          
          // Start auto-sync if requested
          if (autoSync && hasBlockchain) {
            blockchainSyncService.setSyncInterval(syncInterval);
            blockchainSyncService.startAutoSync(sessionId, !showNotifications);
          }
          
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error initializing blockchain verification:", error);
        if (mounted) {
          setIsLoading(false);
          setSyncError("Failed to initialize blockchain verification");
        }
      }
    }
    
    loadInitialData();
    
    // Cleanup
    return () => {
      mounted = false;
      blockchainSyncService.stopAutoSync();
    };
  }, [sessionId, autoSync, syncInterval, showNotifications]);
  
  // Function to manually trigger sync
  const syncNow = async (): Promise<boolean> => {
    setIsSyncing(true);
    setSyncError(null);
    
    try {
      const success = await blockchainSyncService.syncBlockchainData(sessionId, !showNotifications);
      
      if (success) {
        // Update the session data to get latest sync time
        const session = await sessionService.getSessionById(sessionId);
        if (session?.results?.lastBlockchainSync) {
          setLastSyncTime(new Date(session.results.lastBlockchainSync).toLocaleString());
        }
        
        setSyncSuccess(true);
        return true;
      } else {
        setSyncSuccess(false);
        setSyncError("Blockchain sync failed");
        return false;
      }
    } catch (error) {
      console.error("Error syncing blockchain data:", error);
      setSyncSuccess(false);
      setSyncError("Error syncing with blockchain");
      return false;
    } finally {
      setIsSyncing(false);
    }
  };
  
  return {
    isLoading,
    lastSyncTime,
    isSyncing,
    syncNow,
    syncSuccess,
    syncError,
    hasBlockchainData
  };
} 