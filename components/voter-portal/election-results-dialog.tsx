"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shadcn-ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn-ui/tabs";
import { Card, CardContent } from "@/components/shadcn-ui/card";
import { Progress } from "@/components/shadcn-ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shadcn-ui/avatar";
import { Button } from "@/components/shadcn-ui/button";
import { ChartBarIcon, Medal, Download, Share2, PrinterIcon } from "lucide-react";
import { Badge } from "@/components/shadcn-ui/badge";

// Mock data - will be replaced with API data later
interface Candidate {
  id: string;
  name: string;
  avatar?: string;
  votes: number;
  percentage: number;
  isWinner?: boolean;
}

interface ElectionResultsDialogProps {
  sessionId: string;
  sessionTitle: string;
  onClose?: () => void;
}

export function ElectionResultsDialog({ 
  sessionId, 
  sessionTitle,
  onClose 
}: ElectionResultsDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [turnoutPercentage, setTurnoutPercentage] = useState(0);
  const [voterCount, setVoterCount] = useState(0);

  // When the dialog is opened, load the data
  useEffect(() => {
    if (sessionId) {
      setOpen(true);
      loadElectionResults();
    }
  }, [sessionId]);

  const handleClose = () => {
    setOpen(false);
    if (onClose) {
      onClose();
    }
  };

  // Mock function to load election results - will be replaced with an API call
  const loadElectionResults = async () => {
    setIsLoading(true);
    
    try {
      // This is mock data - in a real app, this would be fetched from your API
      // await api.getElectionResults(sessionId)
      
      setTimeout(() => {
        // Simulate API delay
        const mockCandidates: Candidate[] = [
          { 
            id: '1', 
            name: 'John Smith', 
            avatar: 'https://i.pravatar.cc/150?img=1', 
            votes: 425, 
            percentage: 42.5,
            isWinner: true
          },
          { 
            id: '2', 
            name: 'Sarah Johnson', 
            avatar: 'https://i.pravatar.cc/150?img=5', 
            votes: 380, 
            percentage: 38.0 
          },
          { 
            id: '3', 
            name: 'Michael Brown', 
            avatar: 'https://i.pravatar.cc/150?img=8', 
            votes: 195, 
            percentage: 19.5 
          },
        ];
        
        const mockTotalVotes = mockCandidates.reduce((acc, candidate) => acc + candidate.votes, 0);
        const mockVoterCount = 1200; // Total eligible voters
        const mockTurnout = (mockTotalVotes / mockVoterCount) * 100;
        
        setCandidates(mockCandidates);
        setTotalVotes(mockTotalVotes);
        setVoterCount(mockVoterCount);
        setTurnoutPercentage(mockTurnout);
        setIsLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error("Failed to load election results:", error);
      setIsLoading(false);
    }
  };

  // Sort candidates by votes (highest first)
  const sortedCandidates = [...candidates].sort((a, b) => b.votes - a.votes);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Election Results</DialogTitle>
          <DialogDescription>
            Results for: <span className="font-medium">{sessionTitle}</span>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-sm text-muted-foreground">Loading election results...</p>
          </div>
        ) : (
          <Tabs defaultValue="results" className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="results" className="flex items-center gap-2">
                <Medal className="h-4 w-4" />
                Results
              </TabsTrigger>
              <TabsTrigger value="statistics" className="flex items-center gap-2">
                <ChartBarIcon className="h-4 w-4" />
                Statistics
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="results" className="space-y-4">
              <div className="rounded-lg bg-muted p-4 mb-4">
                <h3 className="text-sm font-medium mb-2">Winner</h3>
                {sortedCandidates.length > 0 && sortedCandidates[0].isWinner && (
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-primary">
                      <AvatarImage src={sortedCandidates[0].avatar} alt={sortedCandidates[0].name} />
                      <AvatarFallback>{sortedCandidates[0].name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-lg">{sortedCandidates[0].name}</h4>
                        <Badge variant="default" className="bg-primary">Winner</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {sortedCandidates[0].votes} votes ({sortedCandidates[0].percentage}%)
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              <h3 className="font-medium">All Candidates</h3>
              <div className="space-y-4">
                {sortedCandidates.map((candidate, index) => (
                  <Card key={candidate.id} className={candidate.isWinner ? "border-primary" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                          {index + 1}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={candidate.avatar} alt={candidate.name} />
                          <AvatarFallback>{candidate.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="font-medium">{candidate.name}</h4>
                            <span className="text-sm font-medium">{candidate.percentage}%</span>
                          </div>
                          <Progress value={candidate.percentage} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">{candidate.votes} votes</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" size="sm" className="gap-1">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
                <Button variant="outline" size="sm" className="gap-1">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button variant="outline" size="sm" className="gap-1">
                  <PrinterIcon className="h-4 w-4" />
                  Print
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="statistics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Votes Cast</h3>
                    <p className="text-3xl font-bold">{totalVotes.toLocaleString()}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Voter Turnout</h3>
                    <p className="text-3xl font-bold">{turnoutPercentage.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">
                      {totalVotes.toLocaleString()} out of {voterCount.toLocaleString()} eligible voters
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="overflow-hidden">
                <CardContent className="p-6">
                  <h3 className="text-sm font-medium mb-4">Vote Distribution</h3>
                  <div className="w-full h-10 flex rounded-md overflow-hidden">
                    {sortedCandidates.map((candidate, index) => (
                      <div 
                        key={candidate.id}
                        style={{ 
                          width: `${candidate.percentage}%`,
                          backgroundColor: index === 0 ? 'hsl(var(--primary))' : 
                                          index === 1 ? 'hsl(var(--primary) / 0.8)' : 
                                          `hsl(var(--primary) / ${0.6 - (index * 0.1)})`
                        }}
                        className="h-full"
                        title={`${candidate.name}: ${candidate.percentage}%`}
                      />
                    ))}
                  </div>
                  <div className="mt-4 space-y-2">
                    {sortedCandidates.map((candidate, index) => (
                      <div key={candidate.id} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ 
                            backgroundColor: index === 0 ? 'hsl(var(--primary))' : 
                                            index === 1 ? 'hsl(var(--primary) / 0.8)' : 
                                            `hsl(var(--primary) / ${0.6 - (index * 0.1)})`
                          }}
                        />
                        <span className="text-sm">{candidate.name} ({candidate.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
} 