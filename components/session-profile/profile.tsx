"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Calendar, Check, Edit, Eye, EyeOff, FileUp, Info, Lock, Shield, Trash2, Upload, Users, Globe, Mail, BarChart, Vote, Copy, CheckCircle, Link2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { DatePickerWithRange } from "./date-range-picker"
import { Session, sessionService } from "@/services/session-service"
import { toast } from "@/components/ui/use-toast"
import type { DateRange } from "react-day-picker"
import blockchainService from "@/services/blockchain-service"

interface ProfileProps {
  session: Session
  onUpdate: (session: Session) => void
}

export default function Profile({ session: initialSession, onUpdate }: ProfileProps) {
  const router = useRouter()
  const [session, setSession] = useState<Session>(initialSession)
  const [editMode, setEditMode] = useState(false)
  const [showKycInfo, setShowKycInfo] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showActionConfirm, setShowActionConfirm] = useState(false)
  const [actionType, setActionType] = useState("")
  const [showSecretPhrase, setShowSecretPhrase] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>({
    from: session.sessionLifecycle?.scheduledAt?.start ? new Date(session.sessionLifecycle.scheduledAt.start) : undefined,
    to: session.sessionLifecycle?.scheduledAt?.end ? new Date(session.sessionLifecycle.scheduledAt.end) : undefined,
  })
  const [isBlockchainLoading, setIsBlockchainLoading] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [showBlockchainDialog, setShowBlockchainDialog] = useState(false)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  // Define confirmBlockchainAction *before* the useEffect that uses it
  const confirmBlockchainAction = useCallback(async () => {
    setIsBlockchainLoading(true)
    console.log("Starting blockchain action:", actionType)
    
    try {
      let contractAddress = null
      
      if (actionType === "start") {
        // Deploy new session on blockchain
        console.log("Confirm Action: Preparing session parameters...");
        const params = blockchainService.prepareSessionParams(session);
        console.log("Confirm Action: Session params prepared:", params);

        console.log("Confirm Action: Deploying session to blockchain...");
        contractAddress = await blockchainService.deploySession(params);
        console.log("Confirm Action: Deployment attempt finished. Contract Address:", contractAddress);

        if (!contractAddress) {
          console.error("Confirm Action: Failed to deploy session - no contract address returned");
          toast({
            title: "Deployment Failed",
            description: "Failed to deploy session to blockchain. Please try again.",
            variant: "destructive"
          });
          setShowBlockchainDialog(false);
          setIsBlockchainLoading(false);
          return;
        }
        
        // Update session in database with contract address and start time
        console.log("Confirm Action: Updating session in database with contract address:", contractAddress);
        const updatedData = {
          contractAddress,
          sessionLifecycle: {
            ...session.sessionLifecycle,
            startedAt: new Date().toISOString()
          }
        };
        
        console.log("Confirm Action: Sending update to backend API:", updatedData);
        const result = await sessionService.updateSession(session._id as string, updatedData);
        console.log("Confirm Action: API update result:", result);
        
        if (result.needsApproval) {
          toast({
            title: "Request Submitted",
            description: "Your request to start the session has been submitted for approval.",
          });
        } else {
          console.log("Confirm Action: Fetching updated session data...");
          const updatedSession = await sessionService.getSessionById(session._id as string);
          console.log("Confirm Action: Updated session:", updatedSession);
          
          setSession(updatedSession);
          onUpdate(updatedSession);
          
          toast({
            title: "Success",
            description: `Session deployed to blockchain and started successfully. Contract address: ${contractAddress.substring(0, 8)}...`,
            variant: "default",
          });
        }
      } else if (actionType === "end") {
        // End session on blockchain
        if (!session.contractAddress) {
          console.error("Cannot end session - no contract address")
          toast({
            title: "Error",
            description: "Session not deployed to blockchain yet.",
            variant: "destructive"
          })
          setShowBlockchainDialog(false)
          setIsBlockchainLoading(false)
          return
        }
        
        console.log("Ending session with contract address:", session.contractAddress)
        const success = await blockchainService.endSession(session.contractAddress)
        console.log("End session result:", success)
        
        if (!success) {
          console.error("Failed to end session on blockchain")
          toast({
            title: "Error",
            description: "Failed to end session on blockchain. Please try again.",
            variant: "destructive"
          })
          setShowBlockchainDialog(false)
          setIsBlockchainLoading(false)
          return
        }
        
        // Update session in database with end time
        console.log("Updating session end time in database")
        const updatedData = {
          sessionLifecycle: {
            ...session.sessionLifecycle,
            endedAt: new Date().toISOString()
          }
        }
        
        console.log("Sending update to backend API:", updatedData)
        const result = await sessionService.updateSession(session._id as string, updatedData)
        console.log("API update result:", result)
        
        if (result.needsApproval) {
          toast({
            title: "Request Submitted",
            description: "Your request to end the session has been submitted for approval.",
          })
        } else {
          console.log("Fetching updated session data...")
          const updatedSession = await sessionService.getSessionById(session._id as string)
          console.log("Updated session:", updatedSession)
          
          setSession(updatedSession)
          onUpdate(updatedSession)
          
          toast({
            title: "Success",
            description: "Session ended successfully on blockchain and database.",
            variant: "default",
          })
        }
      }
    } catch (error) {
      console.error(`Blockchain ${actionType} error:`, error)
      toast({
        title: "Error",
        description: `Failed to ${actionType} session on blockchain: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    } finally {
      setShowBlockchainDialog(false)
      setIsBlockchainLoading(false)
    }
  }, [actionType, session, onUpdate])

  useEffect(() => {
    setSession(initialSession)
    setDateRange({
      from: initialSession.sessionLifecycle?.scheduledAt?.start ? new Date(initialSession.sessionLifecycle.scheduledAt.start) : undefined,
      to: initialSession.sessionLifecycle?.scheduledAt?.end ? new Date(initialSession.sessionLifecycle.scheduledAt.end) : undefined,
    })
  }, [initialSession])

  // Effect to add event listener when dialog is shown
  useEffect(() => {
    const buttonElement = confirmButtonRef.current;
    
    // Define the handler inside useEffect or make sure it's stable (useCallback)
    const handleClick = () => {
      console.log("Programmatic Confirm button CLICKED!");
      // No need to check isBlockchainLoading here, the button itself should be disabled
      confirmBlockchainAction(); 
    };

    if (showBlockchainDialog && buttonElement) {
      console.log("Attempting to add click listener to confirm button");
      buttonElement.addEventListener('click', handleClick);

      // Cleanup listener when dialog is hidden or component unmounts
      return () => {
        console.log("Removing click listener from confirm button");
        if (buttonElement) { // Check if element still exists before removing
           buttonElement.removeEventListener('click', handleClick);
        }
      };
    }
  }, [showBlockchainDialog, confirmBlockchainAction]); // Use the stable confirmBlockchainAction

  const handleStartSession = async () => {
    // First connect to blockchain and get wallet address
    setIsBlockchainLoading(true)
    console.log("Starting blockchain connection process...")
    try {
      console.log("Attempting to connect to MetaMask...")
      const connected = await blockchainService.connect()
      console.log("Connection result:", connected)
      
      if (!connected) {
        console.error("Failed to connect to blockchain")
        toast({
          title: "Connection Failed",
          description: "Could not connect to blockchain. Please make sure MetaMask is installed and unlocked.",
          variant: "destructive"
        })
        setIsBlockchainLoading(false)
        return
      }
      
      console.log("Getting wallet address...")
      const address = await blockchainService.getWalletAddress()
      console.log("Wallet address:", address)
      setWalletAddress(address || "Test Wallet")
      
      // Show blockchain confirmation dialog
      console.log("Setting action type to 'start' and showing blockchain dialog")
      setActionType("start")
      setShowBlockchainDialog(true)
      
    } catch (error) {
      console.error("Blockchain connection error:", error)
      toast({
        title: "Connection Error",
        description: "Failed to connect to blockchain. Please try again.",
        variant: "destructive"
      })
      setIsBlockchainLoading(false)
    }
  }

  const handleEndSession = async () => {
    // First connect to blockchain and get wallet address
    setIsBlockchainLoading(true)
    try {
      const connected = await blockchainService.connect()
      if (!connected) {
        toast({
          title: "Connection Failed",
          description: "Could not connect to blockchain. Please make sure MetaMask is installed and unlocked.",
          variant: "destructive"
        })
        setIsBlockchainLoading(false)
        return
      }
      
      const address = await blockchainService.getWalletAddress()
      setWalletAddress(address || "Test Wallet")
      
      // Show blockchain confirmation dialog
      setActionType("end")
      setShowBlockchainDialog(true)
      
    } catch (error) {
      console.error("Blockchain connection error:", error)
      toast({
        title: "Connection Error",
        description: "Failed to connect to blockchain. Please try again.",
        variant: "destructive"
      })
      setIsBlockchainLoading(false)
    }
  }

  const handleDeleteSession = () => {
    setShowDeleteConfirm(true)
  }

  const confirmAction = async () => {
    try {
      let updatedData: Partial<Session> = {};
      
      if (actionType === "start") {
        updatedData = {
          sessionLifecycle: {
            ...session.sessionLifecycle,
            startedAt: new Date().toISOString()
          }
        };
      } else if (actionType === "end") {
        updatedData = {
          sessionLifecycle: {
            ...session.sessionLifecycle,
            endedAt: new Date().toISOString()
          }
        };
      }
      
      const result = await sessionService.updateSession(session._id as string, updatedData);
      
      if (result.needsApproval) {
        toast({
          title: "Request submitted",
          description: "Your request to update the session has been submitted for approval",
        });
      } else {
        const updatedSession = await sessionService.getSessionById(session._id as string);
        setSession(updatedSession);
        onUpdate(updatedSession);
        
        toast({
          title: "Success",
          description: `Session ${actionType === "start" ? "started" : "ended"} successfully`,
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${actionType} session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setShowActionConfirm(false);
    }
  }

  const confirmDelete = async () => {
    setIsBlockchainLoading(true)
    
    try {
      // If deployed to blockchain, inform the user that the contract will be abandoned
      if (session.contractAddress) {
        // We can't actually delete contracts from blockchain, but we can abandon them
        toast({
          title: "Note",
          description: "The contract on the blockchain will be abandoned but will still exist on-chain.",
          variant: "default",
        })
      }
      
      // Delete from database
      await sessionService.deleteSession(session._id as string)
      
      toast({
        title: "Success",
        description: "Session deleted successfully",
      })
      
      // Redirect to sessions list using the Next.js router
      router.push("/team-leader/sessions")
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    } finally {
      setShowDeleteConfirm(false)
      setIsBlockchainLoading(false)
    }
  }

  const handleSaveChanges = async () => {
    try {
      const updatedData: Partial<Session> = {
        name: session.name,
        description: session.description,
        organizationName: session.organizationName,
        banner: session.banner,
        securityMethod: session.securityMethod,
        secretPhrase: session.secretPhrase,
        accessLevel: session.accessLevel,
        geoRestriction: session.geoRestriction,
        locationName: session.locationName,
        hideFromPublic: session.hideFromPublic,
        requireInvitation: session.requireInvitation,
        sessionLifecycle: {
          ...session.sessionLifecycle,
          scheduledAt: {
            start: dateRange.from?.toISOString() || session.sessionLifecycle?.scheduledAt?.start || '',
            end: dateRange.to?.toISOString() || session.sessionLifecycle?.scheduledAt?.end || ''
          }
        }
      };
      
      const result = await sessionService.updateSession(session._id as string, updatedData);
      
      if (result.needsApproval) {
        toast({
          title: "Request submitted",
          description: "Your changes have been submitted for approval",
        });
      } else {
        const updatedSession = await sessionService.getSessionById(session._id as string);
        setSession(updatedSession);
        onUpdate(updatedSession);
        
        toast({
          title: "Success",
          description: "Session updated successfully",
        });
      }
      
      setEditMode(false);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  }

  const getSessionStatus = () => {
    const now = new Date();
    
    // If session has ended
    if (session.sessionLifecycle?.endedAt) {
      const endDate = new Date(session.sessionLifecycle.endedAt);
      if (now > endDate) {
        return "ended";
      }
    } 
    
    // If session has started but not ended
    if (session.sessionLifecycle?.startedAt) {
      const startDate = new Date(session.sessionLifecycle.startedAt);
      if (now >= startDate) {
        return "started";
      }
    } 
    
    // If in nomination phase (for election type only)
    if (session.type === "election" && 
        session.sessionLifecycle?.scheduledAt?.start && 
        session.sessionLifecycle?.scheduledAt?.end) {
      
      const startDate = new Date(session.sessionLifecycle.scheduledAt.start);
      const endDate = new Date(session.sessionLifecycle.scheduledAt.end);
      
      // Check if we're currently in the nomination period
      if (now >= startDate && now <= endDate) {
        return "nomination";
      } else if (now < startDate) {
        return "upcoming";
      }
    }
    
    // Check if we're in "coming soon" status
    if (session.sessionLifecycle?.startedAt) {
      const startDate = new Date(session.sessionLifecycle.startedAt);
      if (now < startDate) {
        return "upcoming";
      }
    }
    
    // Default case - session is created but not started
    return "pending";
  }

  const getStatusBadge = () => {
    const status = getSessionStatus();
    switch (status) {
      case "nomination":
        return <Badge className="bg-blue-500">Nomination</Badge>
      case "started":
        return <Badge className="bg-green-500">Started</Badge>
      case "ended":
        return <Badge className="bg-gray-500">Ended</Badge>
      case "upcoming":
        return <Badge className="bg-purple-500">Upcoming</Badge>
      case "pending":
        return <Badge className="bg-amber-500">Pending</Badge>
      default:
        return null
    }
  }

  return (
    <div className="w-full py-6">
      {/* Banner Section */}
      <div className="relative w-full h-48 rounded-lg mb-3 overflow-hidden border shadow-md bg-gradient-to-r from-primary/20 to-indigo-600/40 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
        <h1 className="text-white text-3xl font-bold relative z-10 drop-shadow-md">{session.name}</h1>
        {editMode && (
          <Button variant="secondary" size="sm" className="absolute top-4 right-4 opacity-90 hover:opacity-100 gap-1.5 text-xs">
            <Upload className="h-3.5 w-3.5" /> Change Banner
          </Button>
        )}
      </div>

      {/* Edit Mode Toggle */}
      <div className="flex justify-end mb-6 items-center">
        <div className="flex-1">
          {getStatusBadge()}
        </div>
        {editMode ? (
          <Button 
            variant="default" 
            onClick={handleSaveChanges} 
            className="gap-1.5 bg-primary/90 hover:bg-primary"
            size="sm"
          >
            <Check className="h-4 w-4" />
            Save All Changes
          </Button>
        ) : (
          <Button 
            variant="outline" 
            onClick={() => setEditMode(true)}
            disabled={getSessionStatus() === "started" || getSessionStatus() === "ended"}
            className="gap-1.5 hover:bg-primary/10"
            size="sm"
          >
            <Edit className="h-4 w-4" />
            Edit Session
          </Button>
        )}
      </div>

      {/* Session Details */}
      <Card className="mb-6 overflow-hidden border-border/60">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold tracking-tight">Session Details</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Basic information about your voting session
          </p>
        </div>
        
        <CardContent className="p-6 grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label 
                htmlFor="title" 
                className="text-sm font-medium flex items-center gap-1.5"
              >
                <FileUp className="h-4 w-4 text-primary" />
                Session Title
              </Label>
              <Input
                id="title"
                value={session.name}
                onChange={(e) => setSession({ ...session, name: e.target.value })}
                disabled={!editMode || getSessionStatus() === "started"}
                className={`${!editMode ? 'bg-muted/50' : ''} transition-colors`}
              />
            </div>

            <div className="space-y-2">
              <Label 
                htmlFor="blockchain" 
                className="text-sm font-medium flex items-center gap-1.5"
              >
                <Lock className="h-4 w-4 text-primary" />
                Blockchain Address
              </Label>
              <div className="flex">
                <Input
                  id="blockchain"
                  value={session.contractAddress || "Not deployed to blockchain yet"}
                  disabled={true}
                  className="font-mono text-sm bg-muted/50"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="ml-2">
                        <Info className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      <p>This address cannot be changed once created</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label 
              htmlFor="description" 
              className="text-sm font-medium flex items-center gap-1.5"
            >
              <FileUp className="h-4 w-4 text-primary" />
              Description
            </Label>
            <Textarea
              id="description"
              value={session.description || ""}
              onChange={(e) => setSession({ ...session, description: e.target.value })}
              disabled={!editMode || getSessionStatus() === "started"}
              rows={3}
              className={`${!editMode ? 'bg-muted/50' : ''} transition-colors resize-none`}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-2 rounded-md border p-3 bg-muted/30">
              <Label
                htmlFor="type"
                className="text-sm font-medium flex items-center gap-1.5"
              >
                <BarChart className="h-4 w-4 text-primary" />
                Session Type
              </Label>
              <Select
                disabled={!editMode || getSessionStatus() !== "nomination"}
                value={session.type}
                onValueChange={(value) => {
                  if (value === "election" || value === "poll" || value === "tournament") {
                    // Create a base session with common properties
                    const baseSession = {
                      _id: session._id,
                      name: session.name,
                      description: session.description,
                      organizationName: session.organizationName,
                      banner: session.banner,
                      accessLevel: session.accessLevel,
                      subscription: session.subscription,
                      sessionLifecycle: session.sessionLifecycle,
                      securityMethod: session.securityMethod,
                      secretPhrase: session.secretPhrase,
                      verificationMethod: session.verificationMethod,
                      createdBy: session.createdBy,
                      team: session.team,
                      allowDirectEdit: session.allowDirectEdit,
                      participants: session.participants,
                      allowsOfficialPapers: session.allowsOfficialPapers,
                      results: session.results,
                      contractAddress: session.contractAddress,
                      subtype: session.subtype,
                    };

                    // Create a new session with the selected type
                    let newSession: Session;
                    if (value === "election") {
                      newSession = {
                        ...baseSession,
                        type: "election",
                        candidates: session.type === "election" ? (session as any).candidates : [],
                        maxChoices: session.type === "election" ? (session as any).maxChoices : 1
                      };
                    } else if (value === "poll") {
                      newSession = {
                        ...baseSession,
                        type: "poll",
                        options: session.type === "poll" ? (session as any).options : [],
                        maxChoices: session.type === "poll" ? (session as any).maxChoices : 1
                      };
                    } else { // tournament
                      newSession = {
                        ...baseSession,
                        type: "tournament",
                        tournamentType: session.type === "tournament" ? (session as any).tournamentType : null,
                        bracket: session.type === "tournament" ? (session as any).bracket : null,
                        maxRounds: session.type === "tournament" ? (session as any).maxRounds : 1
                      };
                    }
                    setSession(newSession);
                  }
                }}
              >
                <SelectTrigger className={!editMode ? 'bg-muted/50' : ''}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="poll">Poll</SelectItem>
                  <SelectItem value="election">Election</SelectItem>
                  <SelectItem value="tournament">Tournament</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 rounded-md border p-3 bg-muted/30">
              <Label
                htmlFor="mode"
                className="text-sm font-medium flex items-center gap-1.5"
              >
                <Vote className="h-4 w-4 text-primary" />
                Voting Mode
              </Label>
              <Select
                disabled={!editMode || getSessionStatus() !== "nomination"}
                value={session.subtype}
                onValueChange={(value) => {
                  // Create a new session object with updated subtype
                  const updatedSession = { ...session };
                  
                  // Type-safe update of the subtype
                  if (updatedSession.type === "election" || updatedSession.type === "poll") {
                    updatedSession.subtype = value as "single" | "multiple" | "ranked";
                  } else if (updatedSession.type === "tournament") {
                    updatedSession.subtype = value as "single elimination" | "double elimination";
                  }
                  
                  setSession(updatedSession);
                }}
              >
                <SelectTrigger className={!editMode ? 'bg-muted/50' : ''}>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Choice</SelectItem>
                  <SelectItem value="multiple">Multiple Choice</SelectItem>
                  <SelectItem value="ranked">Ranked Choice</SelectItem>
                  {session.type === "tournament" && (
                    <>
                      <SelectItem value="single elimination">Single Elimination</SelectItem>
                      <SelectItem value="double elimination">Double Elimination</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              {session.subtype === "multiple" && (
                <div className="mt-2 flex items-center">
                  <Label htmlFor="maxSelections" className="mr-2 text-xs">
                    Max selections:
                  </Label>
                  <Input
                    id="maxSelections"
                    type="number"
                    className={`w-20 ${!editMode ? 'bg-muted/50' : ''}`}
                    value={
                      session.type === "election" 
                        ? (session as any).maxChoices || 1 
                        : session.type === "poll" 
                          ? (session as any).maxChoices || 1 
                          : 1
                    }
                    onChange={(e) => {
                      const maxChoices = Number.parseInt(e.target.value) || 1;
                      const updatedSession = { ...session };
                      
                      if (updatedSession.type === "election") {
                        (updatedSession as any).maxChoices = maxChoices;
                      } else if (updatedSession.type === "poll") {
                        (updatedSession as any).maxChoices = maxChoices;
                      }
                      
                      setSession(updatedSession);
                    }}
                    disabled={!editMode || getSessionStatus() !== "nomination"}
                    min={1}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2 rounded-md border p-3 bg-muted/30">
              <Label
                className="text-sm font-medium flex items-center gap-1.5"
              >
                <Calendar className="h-4 w-4 text-primary" />
                Session Schedule
              </Label>
              <DatePickerWithRange 
                dateRange={dateRange} 
                setDateRange={(range: DateRange) => setDateRange(range)} 
                disabled={!editMode || getSessionStatus() === "started"} 
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Access Control */}
      <Card className="mb-6 overflow-hidden border-border/60">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold tracking-tight">Access Control</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage how users access and verify for this session
          </p>
        </div>
        
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  Visibility
                </CardTitle>
                <CardDescription className="text-xs">
                  Control who can see and access this session
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={session.accessLevel}
                  onValueChange={(value: "Public" | "Private") => 
                    setSession({ ...session, accessLevel: value })
                  }
                  disabled={!editMode || getSessionStatus() !== "nomination"}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-3 p-2 rounded-md border bg-card hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="Public" id="public" />
                    <Label htmlFor="public" className="cursor-pointer flex items-center font-medium">
                      <Globe className="h-4 w-4 mr-2 text-primary" />
                      Public
                      <span className="ml-2 text-xs text-muted-foreground">Anyone can see and join</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-2 rounded-md border bg-card hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="Private" id="private" />
                    <Label htmlFor="private" className="cursor-pointer flex items-center font-medium">
                      <Lock className="h-4 w-4 mr-2 text-primary" />
                      Private
                      <span className="ml-2 text-xs text-muted-foreground">Restricted access</span>
                    </Label>
                  </div>
                </RadioGroup>

                {session.accessLevel === "Private" && (
                  <div className="mt-4 space-y-3 pl-6 animate-in fade-in duration-300">
                    <Label htmlFor="accessMethod" className="text-sm font-medium">Access Method</Label>
                    <Select
                      disabled={!editMode || getSessionStatus() !== "nomination"}
                      value={session.securityMethod || ""}
                      onValueChange={(value) => 
                        setSession({ ...session, securityMethod: value as "Secret Phrase" | "Area Restriction" | null })
                      }
                    >
                      <SelectTrigger className={!editMode ? 'bg-muted/50' : ''}>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Secret Phrase">Secret Phrase</SelectItem>
                        <SelectItem value="Area Restriction">Geographic Restriction</SelectItem>
                      </SelectContent>
                    </Select>

                    {session.securityMethod === "Secret Phrase" && (
                      <div className="mt-3 animate-in fade-in duration-300">
                        <Label htmlFor="secretPhrase" className="text-sm font-medium">Secret Phrase</Label>
                        <div className="relative">
                          <Input
                            id="secretPhrase"
                            type={showSecretPhrase ? "text" : "password"}
                            value={session.secretPhrase || ""}
                            onChange={(e) => setSession({ ...session, secretPhrase: e.target.value })}
                            disabled={!editMode || getSessionStatus() !== "nomination"}
                            placeholder="Enter a unique phrase"
                            className={!editMode ? 'bg-muted/50' : ''}
                          />
                          {session.secretPhrase && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute right-0 top-0 h-full"
                                    disabled={!editMode}
                                    onClick={() => setShowSecretPhrase(!showSecretPhrase)}
                                  >
                                    {showSecretPhrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{showSecretPhrase ? "Hide" : "Show"} secret phrase</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Share this phrase with people you want to invite to the session
                        </p>
                        
                        {session.secretPhrase && session._id && (
                          <div className="mt-3 animate-in fade-in duration-300">
                            <Label htmlFor="sessionLink" className="text-xs font-medium flex items-center gap-1.5">
                              <Link2 className="h-3.5 w-3.5 text-primary" />
                              Session Link
                            </Label>
                            <div className="relative mt-1">
                              <div className="flex items-center gap-2">
                                <Input
                                  id="sessionLink"
                                  value={typeof window !== "undefined" ? `${window.location.origin}/access/${session._id}?phrase=${session.secretPhrase}` : `Access link with phrase: ${session.secretPhrase}`}
                                  readOnly
                                  className="pr-10 text-xs font-mono bg-muted/50"
                                />
                                <CopyLinkButton sessionId={session._id} secretPhrase={session.secretPhrase} />
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                This link includes the secret phrase for direct access
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {session.securityMethod === "Area Restriction" && (
                      <div className="mt-3 space-y-3 animate-in fade-in duration-300">
                        <Label htmlFor="geoRestriction" className="text-sm font-medium">Geographic Area</Label>
                        <Select
                          disabled={!editMode || getSessionStatus() !== "nomination"}
                          value={session.geoRestriction || ""}
                          onValueChange={(value) => 
                            setSession({ ...session, geoRestriction: value })
                          }
                        >
                          <SelectTrigger className={!editMode ? 'bg-muted/50' : ''}>
                            <SelectValue placeholder="Select region" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="country">Country</SelectItem>
                            <SelectItem value="city">City</SelectItem>
                            <SelectItem value="campus">Campus/Building</SelectItem>
                            <SelectItem value="custom">Custom Area</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {session.geoRestriction && (
                          <div className="animate-in fade-in duration-300">
                            <Label htmlFor="locationName" className="text-sm font-medium">Location Name</Label>
                            <Input
                              id="locationName"
                              value={session.locationName || ""}
                              onChange={(e) => setSession({ ...session, locationName: e.target.value })}
                              disabled={!editMode || getSessionStatus() !== "nomination"}
                              placeholder={`Enter ${session.geoRestriction === 'country' ? 'country' : 
                                session.geoRestriction === 'city' ? 'city' : 
                                session.geoRestriction === 'campus' ? 'campus/building' : 'area'} name`}
                              className={!editMode ? 'bg-muted/50' : ''}
                            />
                          </div>
                        )}
                        
                        <p className="text-xs text-muted-foreground">
                          Only users within the specified area will be able to access this session
                        </p>
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <Label className="text-sm font-medium mb-2 block">Additional Privacy Options</Label>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label 
                              htmlFor="hideFromPublic" 
                              className="text-sm cursor-pointer"
                            >
                              Hide from public listings
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Session won't appear in public discovery
                            </p>
                          </div>
                          <Switch
                            id="hideFromPublic"
                            checked={session.hideFromPublic || false}
                            onCheckedChange={(checked) => 
                              setSession({ ...session, hideFromPublic: checked })
                            }
                            disabled={!editMode || getSessionStatus() !== "nomination"}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label 
                              htmlFor="requireInvitation" 
                              className="text-sm cursor-pointer"
                            >
                              Require invitation to join
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Only invited users can participate
                            </p>
                          </div>
                          <Switch
                            id="requireInvitation"
                            checked={session.requireInvitation || false}
                            onCheckedChange={(checked) => 
                              setSession({ ...session, requireInvitation: checked })
                            }
                            disabled={!editMode || getSessionStatus() !== "nomination"}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Voter Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={session.verificationMethod || "standard"}
                  onValueChange={(value) => 
                    setSession({ ...session, verificationMethod: value as "KYC" | "CVC" | null })
                  }
                  disabled={!editMode || getSessionStatus() !== "nomination"}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-3 p-2 rounded-md border bg-card hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="standard" id="standard" />
                    <Label htmlFor="standard" className="cursor-pointer flex items-center font-medium">
                      <Mail className="h-4 w-4 mr-2 text-primary" />
                      Standard (Email)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-2 rounded-md border bg-card hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="KYC" id="kyc" />
                    <Label htmlFor="kyc" className="cursor-pointer flex items-center font-medium">
                      <Shield className="h-4 w-4 mr-2 text-primary" />
                      KYC Verification
                    </Label>
                  </div>
                </RadioGroup>

                {session.verificationMethod === "KYC" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs mt-3"
                    onClick={() => setShowKycInfo(!showKycInfo)}
                  >
                    {showKycInfo ? "Hide Info" : "Show Info"}
                  </Button>
                )}

                {showKycInfo && (
                  <div className="bg-blue-50 p-3 rounded-md text-sm mt-3 animate-in fade-in duration-300">
                    <p className="font-medium text-blue-800">About KYC Verification</p>
                    <p className="mt-1 text-blue-700">
                      KYC (Know Your Customer) verification requires voters to validate their identity before voting.
                      This ensures one person can only vote once and verifies the identity of all participants.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Session Controls */}
      <Card className="border-border/60 overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Session Controls
          </h2>
        </div>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Button
              variant="destructive"
              onClick={handleDeleteSession}
              disabled={getSessionStatus() === "started" || getSessionStatus() === "ended" || isBlockchainLoading}
              className="gap-1.5"
              size="sm"
            >
              <Trash2 className="h-4 w-4" /> Delete Session
            </Button>

            <div className="space-x-4">
              <Button
                variant="outline"
                onClick={handleStartSession}
                disabled={
                  // Disable if session already has a contract address
                  !!session.contractAddress || 
                  // Or if session is already started or ended
                  getSessionStatus() === "started" || 
                  getSessionStatus() === "ended" || 
                  isBlockchainLoading
                }
                className="gap-1.5 bg-green-500/10 text-green-700 border-green-200 hover:bg-green-500/20"
                size="sm"
              >
                {isBlockchainLoading && actionType === "start" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" /> 
                    {showBlockchainDialog ? "Deploying..." : "Connecting..."}
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4" /> 
                    Start Session
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleEndSession}
                disabled={getSessionStatus() !== "started" || isBlockchainLoading}
                className="gap-1.5 bg-amber-500/10 text-amber-700 border-amber-200 hover:bg-amber-500/20"
                size="sm"
              >
                {isBlockchainLoading && actionType === "end" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1" /> 
                    {showBlockchainDialog ? "Ending..." : "Connecting..."}
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" /> 
                    End Session
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Confirmation Dialog */}
      <Dialog open={showActionConfirm} onOpenChange={setShowActionConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionType === "start" ? "Start Session" : "End Session"}</DialogTitle>
            <DialogDescription>
              {actionType === "start"
                ? "This will start the voting session and allow voters to cast their votes."
                : "This will end the voting session and no more votes can be cast."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={confirmAction}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Blockchain Confirmation Dialog */}
      <Dialog open={showBlockchainDialog} onOpenChange={(open) => {
        // Only allow closing the dialog if we're not in a loading state
        if (!isBlockchainLoading) {
          setShowBlockchainDialog(open);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "start" ? "Deploy to Blockchain" : "End Blockchain Session"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "start" 
                ? "This will deploy your session to the blockchain, making it immutable and transparent."
                : "This will mark your session as ended on the blockchain."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="rounded-md bg-slate-50 p-4">
              <p className="text-sm font-medium">Connected Wallet</p>
              <p className="mt-1 text-xs font-mono">{walletAddress || "Not connected"}</p>

              {actionType === "start" && (
                <>
                  <p className="mt-4 text-sm font-medium">Session Type</p>
                  <p className="mt-1 text-xs">
                    {session.type.charAt(0).toUpperCase() + session.type.slice(1)} ({
                      session.subtype.charAt(0).toUpperCase() + session.subtype.slice(1)
                    })
                  </p>
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowBlockchainDialog(false)} 
              disabled={isBlockchainLoading}
            >
              Cancel
            </Button>
            <Button 
              ref={confirmButtonRef}
              onClick={() => {
                console.log("Confirm button clicked directly!");
                confirmBlockchainAction();
              }}
              disabled={isBlockchainLoading}
              className="min-w-[100px]"
            >
              {isBlockchainLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {actionType === "start" ? "Deploying..." : "Ending..."}
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this session? This action cannot be undone.
              {session.contractAddress && (
                <p className="mt-2 text-amber-600">
                  Note: This session is deployed to the blockchain. While it will be removed from our database,
                  the contract will still exist on the blockchain.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isBlockchainLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isBlockchainLoading}>
              {isBlockchainLoading ? "Processing..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CopyLinkButton({ sessionId, secretPhrase }: { sessionId: string, secretPhrase: string }) {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = () => {
    if (typeof window === "undefined") return;
    
    const link = `${window.location.origin}/access/${sessionId}?phrase=${secretPhrase}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8"
            onClick={copyToClipboard}
          >
            {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{copied ? "Copied!" : "Copy link"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
