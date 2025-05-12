import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Rocket, Ban, RefreshCw, BlocksIcon, ExternalLink } from "lucide-react";
import blockchainService from '@/services/blockchain-service';
import { toast } from '@/lib/toast';
import { Session } from '@/services/session-service';

interface BlockchainControlsProps {
  session: Session;
  onSessionUpdated: () => void;
}

export function BlockchainControls({ session, onSessionUpdated }: BlockchainControlsProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleDeploy = async () => {
    try {
      setIsDeploying(true);
      
      // First, connect to blockchain wallet
      const connected = await blockchainService.connect();
      if (!connected) {
        toast({
          title: "Connection Failed",
          description: "Could not connect to blockchain wallet. Please ensure you have MetaMask installed and unlocked.",
          variant: "destructive"
        });
        return;
      }
      
      // Prepare candidates/options list for blockchain
      let participants: string[] = [];
      
      if (session.type === 'election' && session.candidates) {
        participants = session.candidates.map(candidate => 
          candidate._id?.toString() || ''
        ).filter(id => id !== '');
      } else if (session.type === 'poll' && 'options' in session && session.options) {
        participants = session.options.map(option => 
          option._id?.toString() || ''
        ).filter(id => id !== '');
      }
      
      if (participants.length === 0) {
        toast({
          title: "Deployment Error",
          description: "Session must have candidates or options to deploy to blockchain.",
          variant: "destructive"
        });
        return;
      }
      
      // Calculate end timestamp
      const endTime = session.sessionLifecycle.endedAt ? 
        new Date(session.sessionLifecycle.endedAt) : 
        session.sessionLifecycle.scheduledAt?.end ? 
          new Date(session.sessionLifecycle.scheduledAt.end) : 
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days
      
      const endTimestamp = Math.floor(endTime.getTime() / 1000);
      
      // Determine vote mode
      let voteMode = 0; // Single (default)
      if (session.subtype === 'multiple') voteMode = 1;
      if (session.subtype === 'ranked') voteMode = 2;
      
      // Get max choices
      const maxChoices = session.maxChoices || 1;
      
      // Call API to deploy session
      const response = await fetch(`/api/blockchain/sessions/${session._id}/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          fromTime: endTime.toISOString()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Failed to deploy session');
      }
      
      const data = await response.json();
      
      toast({
        title: "Deployment Successful",
        description: `Session deployed to blockchain at address ${data.contractAddress.slice(0, 8)}...`,
        variant: "default"
      });
      
      // Refresh session data
      onSessionUpdated();
    } catch (error: any) {
      console.error('Error deploying session:', error);
      toast({
        title: "Deployment Error",
        description: error.message || "Failed to deploy session",
        variant: "destructive"
      });
    } finally {
      setIsDeploying(false);
    }
  };
  
  const handleRefreshResults = async () => {
    if (!session.contractAddress) return;
    
    try {
      setIsRefreshing(true);
      
      // Fetch latest results from blockchain
      const response = await fetch(`/api/blockchain/sessions/${session._id}/results`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Failed to refresh results');
      }
      
      const data = await response.json();
      
      toast({
        title: "Results Updated",
        description: `Latest blockchain data retrieved with ${data.voterCount} voters`,
        variant: "default"
      });
      
      // Refresh session data
      onSessionUpdated();
    } catch (error: any) {
      console.error('Error refreshing results:', error);
      toast({
        title: "Refresh Error",
        description: error.message || "Failed to refresh results",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Display different UI based on session's blockchain status
  if (!session.contractAddress) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <BlocksIcon className="h-5 w-5 mr-2" />
            Blockchain Deployment
          </CardTitle>
          <CardDescription>
            Deploy this session to the blockchain to enable secure, tamper-proof voting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            When you deploy to blockchain:
          </p>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>All votes will be securely recorded on the blockchain</li>
            <li>Results will be publicly verifiable and tamper-proof</li>
            <li>Voters will need MetaMask or a compatible wallet to cast votes</li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleDeploy} 
            disabled={isDeploying}
            className="w-full"
          >
            {isDeploying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span>Deploying...</span>
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4 mr-2" />
                <span>Deploy to Blockchain</span>
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // If deployed to blockchain
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <BlocksIcon className="h-5 w-5 mr-2" />
          Blockchain Status
        </CardTitle>
        <CardDescription>
          This session is deployed on the blockchain
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert>
            <BlocksIcon className="h-4 w-4" />
            <AlertTitle>Active on Blockchain</AlertTitle>
            <AlertDescription className="text-sm flex flex-col gap-1">
              <span>Contract Address: <code className="bg-muted p-1 rounded">{session.contractAddress.slice(0, 8) + '...' + session.contractAddress.slice(-6)}</code></span>
              
              <a 
                href={`https://sepolia.etherscan.io/address/${session.contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center mt-1 w-fit"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View on Explorer
              </a>
            </AlertDescription>
          </Alert>
          
          {session.results && (
            <div className="text-sm space-y-1 mt-2">
              <p className="text-muted-foreground">
                Last blockchain sync: {session.results.lastBlockchainSync ? new Date(session.results.lastBlockchainSync).toLocaleString() : 'Never'}
              </p>
              {session.results.blockchainVoterCount !== undefined && (
                <p className="text-muted-foreground">
                  Blockchain voter count: {session.results.blockchainVoterCount}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button 
          onClick={handleRefreshResults} 
          disabled={isRefreshing}
          variant="outline"
          className="flex-1"
        >
          {isRefreshing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span>Refreshing...</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              <span>Refresh Results</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 