"use client";

import { useEffect, useState } from 'react';
import { toast } from '@/lib/toast';
import blockchainService from '@/services/blockchain-service';
import sessionService from '@/services/session-service';
import { Session } from '@/services/session-service';

interface BlockchainSyncProps {
  sessionId: string;
  syncInterval?: number; // in milliseconds, default 30 seconds
  onSyncComplete?: (success: boolean) => void;
}

export function BlockchainSync({ 
  sessionId, 
  syncInterval = 30000, 
  onSyncComplete 
}: BlockchainSyncProps) {
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [sessionData, setSessionData] = useState<Session | null>(null);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  // Load session data initially
  useEffect(() => {
    async function loadSessionData() {
      try {
        const session = await sessionService.getSessionById(sessionId);
        setSessionData(session);
        
        // Check if there's already a last sync timestamp
        if (session.results?.lastBlockchainSync) {
          setLastSync(new Date(session.results.lastBlockchainSync));
        }
      } catch (error) {
        console.error('Error loading session for blockchain sync:', error);
      }
    }
    
    if (sessionId) {
      loadSessionData();
    }
    
    return () => {
      // Clean up interval on unmount
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [sessionId]);

  // Set up sync interval when session data is loaded
  useEffect(() => {
    if (!sessionData || !sessionData.contractAddress) return;
    
    // Initial sync on load
    syncBlockchainData();
    
    // Set up interval for future syncs
    const id = setInterval(syncBlockchainData, syncInterval);
    setIntervalId(id);
    
    return () => {
      clearInterval(id);
    };
  }, [sessionData]);

  // Function to perform the actual sync
  const syncBlockchainData = async () => {
    if (!sessionData || !sessionData.contractAddress || isSyncing) return;
    
    try {
      setIsSyncing(true);
      
      const success = await blockchainService.syncBlockchainResults(
        sessionId,
        sessionData.contractAddress
      );
      
      if (success) {
        setLastSync(new Date());
        toast({
          title: "Blockchain Data Synced",
          description: "Vote counts have been updated from the blockchain.",
        });
      }
      
      if (onSyncComplete) {
        onSyncComplete(success);
      }
    } catch (error) {
      console.error('Error syncing blockchain data:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // This component doesn't render anything visible
  return null;
}

export default BlockchainSync; 