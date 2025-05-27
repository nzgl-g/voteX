"use client";

//-----------------------------------------------------
// IMPORTS
//-----------------------------------------------------

// React and hooks
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// Icons
import { Plus, Key, RefreshCcw, Filter, AlertTriangle } from "lucide-react";

// Services
import { Session } from "@/services/session-service";
import sessionService from "@/services/session-service";
import candidateService from "@/services/candidate-service";

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PricingDialog } from "@/components/pricing-dialog";
import { toast } from "sonner";
import {
  SessionCard,
  SecretPhraseDialog,
  VoterHeader
} from "@/components/voter-portal";
import CandidateFormDialog from "@/components/voter-portal/candidate-form-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Handle Stagewise Toolbar errors globally
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    // Check if the error is related to Stagewise toolbar
    if (event.message?.includes('stagewise') || 
        event.filename?.includes('stagewise') ||
        event.error?.stack?.includes('stagewise')) {
      // Prevent the error from breaking the application
      console.warn('Stagewise error suppressed:', event.message);
      event.preventDefault();
      return true;
    }
  });
}

//-----------------------------------------------------
// TYPE DEFINITIONS
//-----------------------------------------------------

// Session type and status filter definitions
type SessionTypeFilter = 'all' | 'election' | 'poll' | 'tournament';
type SessionStatusFilter = 'all' | 'nomination' | 'upcoming' | 'started' | 'ended';

export default function VoterPage() {
  //-----------------------------------------------------
  // STATE MANAGEMENT
  //-----------------------------------------------------
  
  // Session data states
  const [sessions, setSessions] = useState<Session[]>([]);          // All sessions
  const [hiddenSessions, setHiddenSessions] = useState<Session[]>([]); // Sessions requiring secret phrase
  const [publicSessions, setPublicSessions] = useState<Session[]>([]); // Publicly accessible sessions
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]); // Sessions after applying filters
  const [accessedSecretSessions, setAccessedSecretSessions] = useState<Session[]>([]); // Secret sessions user has accessed
  
  // UI state management
  const [loading, setLoading] = useState(true);                     // Loading indicator
  const [refreshing, setRefreshing] = useState(false);              // Refresh indicator
  const [error, setError] = useState<string | null>(null);          // Error messages
  
  // Modal dialog states
  const [selectedSession, setSelectedSession] = useState<Session | null>(null); // Currently selected session
  const [showCandidateForm, setShowCandidateForm] = useState(false);           // Candidate form dialog
  const [showPricingDialog, setShowPricingDialog] = useState(false);           // Pricing dialog
  const [showSecretPhraseDialog, setShowSecretPhraseDialog] = useState(false); // Secret phrase dialog
  const [isSubmittingPhrase, setIsSubmittingPhrase] = useState(false);         // Secret phrase submission state
  
  // Filter states
  const [typeFilter, setTypeFilter] = useState<SessionTypeFilter>('all');      // Filter by session type
  const [statusFilter, setStatusFilter] = useState<SessionStatusFilter>('all'); // Filter by session status
  
  // User information
  const [userId, setUserId] = useState<string>("anonymous");                   // Current user ID

  const router = useRouter();

  // Override console.error to prevent Stagewise reconnection errors from breaking the UI
  useEffect(() => {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Ignore Stagewise reconnection errors
      if (args[0] && (
        (typeof args[0] === 'string' && args[0].includes('Max reconnection attempts reached')) ||
        (args[0] instanceof Error && args[0].message.includes('Max reconnection attempts reached'))
      )) {
        console.warn('Suppressed Stagewise reconnection error');
        return;
      }
      originalConsoleError(...args);
    };
    
    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  //-----------------------------------------------------
  // UTILITY FUNCTIONS
  //-----------------------------------------------------

  /**
   * Validates if a session object has all required properties
   * @param session - Session object to validate
   * @returns boolean indicating if session is valid
   */
  const isValidSession = (session: any): boolean => {
    if (!session || typeof session !== 'object') return false;
    if (!session._id || !session.name || !session.type) return false;
    
    // Check if sessionLifecycle exists and has the expected structure
    if (!session.sessionLifecycle || typeof session.sessionLifecycle !== 'object') {
      return false;
    }
    
    return true;
  };

  /**
   * Processes an array of sessions and separates them into public and hidden categories
   * Updates the state with processed sessions and applies filters
   * @param allSessions - Array of all sessions from the API
   */
  const processSessions = (allSessions: any[]): void => {
    if (!allSessions || !Array.isArray(allSessions) || allSessions.length === 0) {
      console.log("No sessions to process or invalid data format");
      setSessions([]);
      setPublicSessions([]);
      setHiddenSessions([]);
      setFilteredSessions([]);
      return;
    }
    
    console.log(`Processing ${allSessions.length} sessions`);
    
    // Filter out invalid sessions
    const validSessions = allSessions.filter(session => isValidSession(session));
    
    if (validSessions.length < allSessions.length) {
      console.warn(`Filtered out ${allSessions.length - validSessions.length} invalid sessions`);
    }
    
    // No need to combine with accessedSecretSessions as they're already included in the passed allSessions
    setSessions(validSessions);
    
    try {
      // Separate public and secret phrase sessions
      const public_sessions = validSessions.filter(session => 
        session.securityMethod !== 'Secret Phrase' || 
        (session.securityMethod === 'Secret Phrase' && !session.secretPhrase)
      );
      
      // Only hide sessions that actually have a secret phrase value
      const secret_sessions = validSessions.filter(session => 
        session.securityMethod === 'Secret Phrase' && 
        session.secretPhrase
      );
      
      console.log(`Processed sessions: ${public_sessions.length} public, ${secret_sessions.length} hidden`);
      
      if (public_sessions.length > 0) {
        console.log("Public session sample:", {
          id: public_sessions[0]._id,
          name: public_sessions[0].name,
          securityMethod: public_sessions[0].securityMethod
        });
      }
      
      setPublicSessions(public_sessions);
      setHiddenSessions(secret_sessions);
      
      // For filteredSessions, include both public sessions and accessed secret sessions
      // Since we already combined regular sessions with secret sessions, all should be in validSessions
      let sessionsToFilter = [...public_sessions];
      
      // Include ALL secret sessions since they would only be included if they were accessed
      // (They were added in the fetch/refresh functions)
      if (secret_sessions.length > 0) {
        console.log(`Adding ${secret_sessions.length} secret sessions to filtered list`);
        sessionsToFilter = [...sessionsToFilter, ...secret_sessions];
      }
      
      // Apply filters to the combined list
      applyFilters(sessionsToFilter);
    } catch (err) {
      console.error("Error processing sessions:", err);
      setError("Error processing sessions. Please try again.");
    }
  };

  /**
   * Determines the current status of a session based on its lifecycle dates
   * @param session - Session to check status for
   * @returns SessionStatusFilter representing the current status
   */
  const getSessionStatus = (session: Session): SessionStatusFilter => {
    if (!session || !session.sessionLifecycle) {
      return 'all';
    }

    const now = new Date();
    const scheduledStart = session.sessionLifecycle.scheduledAt?.start
      ? new Date(session.sessionLifecycle.scheduledAt.start)
      : null;
    const scheduledEnd = session.sessionLifecycle.scheduledAt?.end
      ? new Date(session.sessionLifecycle.scheduledAt.end)
      : null;
    const startedAt = session.sessionLifecycle.startedAt
      ? new Date(session.sessionLifecycle.startedAt)
      : null;
    const endedAt = session.sessionLifecycle.endedAt
      ? new Date(session.sessionLifecycle.endedAt)
      : null;

    if (endedAt && now > endedAt) {
      return 'ended';
    }

    if (startedAt && now >= startedAt && (!endedAt || now <= endedAt)) {
      return 'started';
    }

    if (scheduledStart && scheduledEnd && now >= scheduledStart && now <= scheduledEnd) {
      return 'nomination';
    }

    if (scheduledStart && now < scheduledStart) {
      return 'upcoming';
    }

    return 'all';
  };

  /**
   * Applies type and status filters to the sessions array
   * @param sessions - Array of sessions to filter
   */
  const applyFilters = (sessions: Session[]) => {
    console.log(`Applying filters to ${sessions.length} sessions. Type filter: ${typeFilter}, Status filter: ${statusFilter}`);
    
    let filtered = [...sessions];
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(session => session.type === typeFilter);
      console.log(`After type filter: ${filtered.length} sessions remain`);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => {
        const status = getSessionStatus(session);
        return status === statusFilter;
      });
      console.log(`After status filter: ${filtered.length} sessions remain`);
    }
    
    // Log some details about filtered sessions
    if (filtered.length > 0) {
      console.log("Filtered sessions:", filtered.map(s => ({
        id: s._id,
        name: s.name,
        type: s.type,
        securityMethod: s.securityMethod || 'none'
      })));
    }
    
    setFilteredSessions(filtered);
  };

  /**
   * Loads secret sessions from localStorage and applies them to state
   * Returns the loaded sessions for immediate use
   */
  const loadSecretSessionsFromStorage = (): Session[] => {
    try {
      const savedSessions = localStorage.getItem('accessedSecretSessions');
      if (savedSessions) {
        const parsedSessions = JSON.parse(savedSessions);
        if (Array.isArray(parsedSessions) && parsedSessions.length > 0) {
          console.log(`Loading ${parsedSessions.length} secret sessions from localStorage`);
          // Don't set state here, just return the sessions to be used
          return parsedSessions;
        }
      }
    } catch (err) {
      console.error("Error loading from localStorage:", err);
    }
    return [];
  };

  //-----------------------------------------------------
  // DATA FETCHING
  //-----------------------------------------------------

  /**
   * Fetches all available sessions from the API
   * Updates state with fetched sessions and handles loading/error states
   */
  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get the current user ID for notifications with better error handling
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const userData = JSON.parse(userStr);
          if (userData && userData._id) {
            setUserId(userData._id);
          } else {
            console.warn('User ID not found in user data', userData);
            setUserId("anonymous");
          }
        } else {
          console.warn('User data not found in localStorage');
          setUserId("anonymous");
        }
      } catch (err) {
        console.warn('Error parsing user data from localStorage', err);
        setUserId("anonymous");
      }
      
      // Load secret sessions first
      const secretSessions = loadSecretSessionsFromStorage();
      setAccessedSecretSessions(secretSessions);
      
      console.log("Fetching sessions...");
      const allSessions = await sessionService.getAllSessions();
      console.log(`Fetched ${allSessions.length} sessions`);
      
      // Combine fetched sessions with secret sessions
      const combinedSessions = [...allSessions];
      secretSessions.forEach(secretSession => {
        if (!combinedSessions.some(s => s._id === secretSession._id)) {
          combinedSessions.push(secretSession);
        }
      });
      
      // processSessions will handle the combined list
      processSessions(combinedSessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setError("Failed to load sessions. Please try again later.");
      setSessions([]);
      setPublicSessions([]);
      setHiddenSessions([]);
      setFilteredSessions([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refreshes the sessions list with the latest data from the API
   * Handles loading/error states and provides user feedback
   */
  const refreshSessions = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    setError(null);
    
    try {
      // Load secret sessions first
      const secretSessions = loadSecretSessionsFromStorage();
      setAccessedSecretSessions(secretSessions);
      
      console.log("Refreshing all sessions for voter portal...");
      const allSessions = await sessionService.getAllSessions();
      
      if (!allSessions || !Array.isArray(allSessions)) {
        throw new Error("Invalid response format from server");
      }
      
      // Combine fetched sessions with secret sessions
      const combinedSessions = [...allSessions];
      secretSessions.forEach(secretSession => {
        if (!combinedSessions.some(s => s._id === secretSession._id)) {
          combinedSessions.push(secretSession);
        }
      });
      
      // Process the combined sessions
      processSessions(combinedSessions);
      toast.success("Sessions refreshed successfully");
    } catch (err: any) {
      console.error("Failed to refresh sessions:", err);
      setError(err.message || "Failed to refresh sessions. Please try again later.");
      toast.error("Failed to refresh sessions. Please try again later.");
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Silently refreshes the sessions list without showing any toast notifications
   * Used for auto-refresh functionality
   */
  const silentRefresh = async () => {
    try {
      if (refreshing) return;
      
      // Load secret sessions first
      const secretSessions = loadSecretSessionsFromStorage();
      setAccessedSecretSessions(secretSessions);
      
      // Don't set the refreshing state to avoid UI changes
      const allSessions = await sessionService.getAllSessions();
      
      if (allSessions && Array.isArray(allSessions)) {
        // Combine fetched sessions with secret sessions
        const combinedSessions = [...allSessions];
        secretSessions.forEach(secretSession => {
          if (!combinedSessions.some(s => s._id === secretSession._id)) {
            combinedSessions.push(secretSession);
          }
        });
        
        // Process the combined sessions
        processSessions(combinedSessions);
        console.log(`Silently refreshed ${allSessions.length} sessions`);
      }
    } catch (err) {
      // Silently log errors without showing to the user
      console.error("Silent refresh error:", err);
    }
  };

  //-----------------------------------------------------
  // EFFECTS
  //-----------------------------------------------------

  // Re-apply filters when filter values change
  useEffect(() => {
    applyFilters(publicSessions);
  }, [typeFilter, statusFilter]);

  // Initial fetch on component mount
  useEffect(() => {
    fetchSessions();
  }, []);

  // Auto-refresh sessions every 30 seconds using silent refresh
  useEffect(() => {
    const autoRefreshInterval = setInterval(() => {
      console.log('Auto-refreshing sessions silently...');
      silentRefresh();
    }, 30000); // 30 seconds in milliseconds
    
    // Clean up interval on component unmount
    return () => clearInterval(autoRefreshInterval);
  }, []);

  // Load accessed secret sessions from localStorage on initial mount
  useEffect(() => {
    try {
      const savedSessions = localStorage.getItem('accessedSecretSessions');
      if (savedSessions) {
        const parsedSessions = JSON.parse(savedSessions);
        if (Array.isArray(parsedSessions) && parsedSessions.length > 0) {
          console.log(`Loaded ${parsedSessions.length} secret sessions from localStorage`);
          setAccessedSecretSessions(parsedSessions);
        }
      }
    } catch (err) {
      console.error("Error loading from localStorage:", err);
    }
  }, []);

  // When accessedSecretSessions changes, update the processed sessions
  useEffect(() => {
    if (accessedSecretSessions.length > 0) {
      console.log("Secret sessions updated, reprocessing all sessions");
      // If we have regular sessions, combine them with secret sessions
      if (sessions.length > 0) {
        processSessions([...sessions]);
      }
    }
  }, [accessedSecretSessions]);

  //-----------------------------------------------------
  // EVENT HANDLERS
  //-----------------------------------------------------

  /**
   * Handles the process of joining a session as a candidate
   * Checks if user has already applied and shows the candidate form if not
   * @param session - The session to join as a candidate
   */
  const handleJoinAsCandidate = (session: Session) => {
    if (!session) return;
    
    // Check if user is already a candidate
    candidateService.checkApplicationStatus(session._id as string)
      .then(result => {
        if (result.exists) {
          toast.info("You have already applied as a candidate for this session.");
          return;
        }
        
        // If not, show the candidate form
        setSelectedSession(session);
        setShowCandidateForm(true);
      })
      .catch(error => {
        console.error("Error checking candidate status:", error);
        // If there's an error, we'll still allow them to try applying
        setSelectedSession(session);
        setShowCandidateForm(true);
      });
  };

  /**
   * Handles the process of casting a vote in a session
   * @param session - The session to cast a vote in
   */
  const handleCastVote = (session: Session) => {
    if (!session || !session._id) {
      toast.error("Invalid session data");
      return;
    }
    
    // The VotingDialog is now handled by the SessionCard component
    console.log(`Vote submitted for session: ${session.name} (${session._id})`);
    toast.success(`Your vote for "${session.name}" has been recorded`);
  };

  /**
   * Handles showing results for a session
   * @param session - The session to show results for
   */
  const handleShowResults = (session: Session) => {
    if (!session || !session._id) {
      toast.error("Invalid session data");
      return;
    }
    
    toast.info(`Showing results for ${session.name}`);
    // Implementation would depend on your app's navigation/routing
  };

  /**
   * Handles viewing a session profile
   * @param session - The session to view the profile for
   */
  const handleViewProfile = (session: Session) => {
    if (!session || !session._id) {
      toast.error("Invalid session data");
      return;
    }
    
    router.push(`/voter/session/${session._id}`);
  };

  /**
   * Handles secret phrase submission to access private sessions
   * @param secretPhrase - The secret phrase entered by the user
   */
  const handleSecretPhraseSubmit = async (secretPhrase: string) => {
    if (!secretPhrase.trim()) {
      toast.error("Please enter a secret phrase");
      return;
    }
    
    setIsSubmittingPhrase(true);
    
    try {
      const session = await sessionService.getSessionByPhrase(secretPhrase);
      
      if (!session || !session._id) {
        toast.error("Invalid secret phrase. Please try again.");
        return;
      }
      
      console.log("Retrieved secret session:", {
        id: session._id,
        name: session.name,
        type: session.type,
        securityMethod: session.securityMethod,
        secretPhrase: session.secretPhrase ? '[REDACTED]' : 'none',
        visibility: session.visibility
      });
      // Check if we already have this session
      const exists = sessions.some(s => s._id === session._id);
      if (exists) {
        toast.info("You already have access to this session.");
        setShowSecretPhraseDialog(false);
        return;
      }
      
      // Get existing secret sessions from localStorage
      const existingSecretSessions = loadSecretSessionsFromStorage();
      
      // Check if this session is already in localStorage
      if (existingSecretSessions.some(s => s._id === session._id)) {
        console.log("Session already exists in localStorage, but not in state. Adding to state.");
      }
      
      // Add the new session to the list
      const updatedSecretSessions = [...existingSecretSessions];
      if (!updatedSecretSessions.some(s => s._id === session._id)) {
        updatedSecretSessions.push(session);
      }
      
      // Update state and localStorage
      setAccessedSecretSessions(updatedSecretSessions);
      localStorage.setItem('accessedSecretSessions', JSON.stringify(updatedSecretSessions));
      
      // Combine with current sessions and process
      const allSessions = [...sessions];
      if (!allSessions.some(s => s._id === session._id)) {
        allSessions.push(session);
      }
      
      processSessions(allSessions);
      
      console.log("After processing, filtered sessions count:", filteredSessions.length);
      
      toast.success(`Joined session: ${session.name}`);
      
      // Close the dialog
      setShowSecretPhraseDialog(false);
    } catch (error: any) {
      console.error("Error joining session with phrase:", error);
      toast.error(error.message || "Failed to join session. Please try again.");
    } finally {
      setIsSubmittingPhrase(false);
    }
  };

  /**
   * Calculates the number of active filters for the filter badge
   * @returns Number of active filters
   */
  const getFilterCount = (): number => {
    let count = 0;
    if (typeFilter !== 'all') count++;
    if (statusFilter !== 'all') count++;
    return count;
  };

  //-----------------------------------------------------
  // RENDER UI
  //-----------------------------------------------------
  return (
    <div className="flex flex-col min-h-screen">
      {/* Voter Header */}
      <VoterHeader />
      
      {/* Main Content Area */}
      <main className="flex-1 container mx-auto py-8 px-4">
        {/* Page Title and Action Buttons */}
        <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center mb-8">
          {/* Page Title */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Available Sessions</h1>
            <p className="text-muted-foreground mt-1">Discover and participate in active voting sessions</p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-1.5 h-9 rounded-lg border-muted-foreground/20 bg-background/50 backdrop-blur-sm shadow-sm hover:bg-background transition-all"
                >
                  <Filter className="h-3.5 w-3.5" />
                  <span>Filter</span>
                  {getFilterCount() > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                      {getFilterCount()}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              
              {/* Filter Options */}
              <DropdownMenuContent className="w-56">
                {/* Session Type Filters */}
                <DropdownMenuLabel>Session Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={typeFilter === 'all'}
                  onCheckedChange={() => setTypeFilter('all')}
                >
                  All Types
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={typeFilter === 'election'}
                  onCheckedChange={() => setTypeFilter('election')}
                >
                  Elections
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={typeFilter === 'poll'}
                  onCheckedChange={() => setTypeFilter('poll')}
                >
                  Polls
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={typeFilter === 'tournament'}
                  onCheckedChange={() => setTypeFilter('tournament')}
                >
                  Tournaments
                </DropdownMenuCheckboxItem>
                
                {/* Session Status Filters */}
                <DropdownMenuLabel className="mt-2">Session Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={statusFilter === 'all'}
                  onCheckedChange={() => setStatusFilter('all')}
                >
                  All Statuses
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={statusFilter === 'nomination'}
                  onCheckedChange={() => setStatusFilter('nomination')}
                >
                  Nominations Open
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={statusFilter === 'upcoming'}
                  onCheckedChange={() => setStatusFilter('upcoming')}
                >
                  Coming Soon
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={statusFilter === 'started'}
                  onCheckedChange={() => setStatusFilter('started')}
                >
                  Active Voting
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={statusFilter === 'ended'}
                  onCheckedChange={() => setStatusFilter('ended')}
                >
                  Ended
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Refresh Button */}
            <Button 
              onClick={refreshSessions}
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 h-9 rounded-lg border-muted-foreground/20 bg-background/50 backdrop-blur-sm shadow-sm hover:bg-background transition-all"
              disabled={refreshing || loading}
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            
            {/* Secret Phrase Button */}
            <Button 
              onClick={() => setShowSecretPhraseDialog(true)}
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 h-9 rounded-lg border-muted-foreground/20 bg-background/50 backdrop-blur-sm shadow-sm hover:bg-background transition-all"
            >
              <Key className="h-3.5 w-3.5" />
              <span>Enter Secret Phrase</span>
            </Button>
            
            {/* Create Session Button */}
            <Button 
              onClick={() => setShowPricingDialog(true)}
              variant="default"
              size="sm"
              className="flex items-center gap-1.5 h-9 rounded-lg shadow-sm hover:shadow-md transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Session</span>
            </Button>
          </div>
        </div>
        
        {/* Content Area - Conditional Rendering Based on State */}
        {loading ? (
          // Loading State with Skeleton Cards
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, index) => (
              <div key={index} className="flex flex-col gap-3 p-0 rounded-lg border bg-background shadow">
                {/* Banner Skeleton */}
                <div className="relative h-36 w-full overflow-hidden rounded-t-lg">
                  <div className="w-full h-full">
                    <div className="bg-accent animate-pulse w-full h-full rounded-t-lg" />
                  </div>
                  <div className="absolute top-3 left-3 flex gap-2">
                    <div className="bg-accent animate-pulse w-16 h-5 rounded-full" />
                    <div className="bg-accent animate-pulse w-20 h-5 rounded-full" />
                  </div>
                </div>
                
                {/* Content Skeleton */}
                <div className="flex flex-col gap-2 px-4 pb-2">
                  <div className="bg-accent animate-pulse w-3/4 h-6 rounded-md" />
                  <div className="bg-accent animate-pulse w-full h-4 rounded-md" />
                  <div className="bg-accent animate-pulse w-2/3 h-4 rounded-md" />
                  
                  <div className="mt-2 space-y-2">
                    <div className="bg-accent animate-pulse w-1/2 h-3 rounded-md" />
                    <div className="bg-accent animate-pulse w-3/4 h-3 rounded-md" />
                  </div>
                </div>
                
                {/* Button Skeleton */}
                <div className="mt-auto px-4 pb-4 pt-1">
                  <div className="bg-accent animate-pulse w-full h-9 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          // Error State with Improved Visual
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-destructive/5 rounded-lg border border-destructive/20">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-xl font-semibold mb-2">Error Loading Sessions</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">{error}</p>
            <Button 
              onClick={refreshSessions} 
              variant="outline" 
              className="gap-2"
              disabled={refreshing}
            >
              <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Try Again
            </Button>
          </div>
        ) : filteredSessions.length > 0 ? (
          // Sessions Grid with Improved Layout
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSessions.map((session) => {
              // Create a properly formatted sessionLifecycle object
              const formattedLifecycle = session.sessionLifecycle ? {
                startedAt: session.sessionLifecycle.startedAt || undefined,
                endedAt: session.sessionLifecycle.endedAt || undefined,
                scheduledAt: session.sessionLifecycle.scheduledAt ? {
                  start: session.sessionLifecycle.scheduledAt.start || undefined,
                  end: session.sessionLifecycle.scheduledAt.end || undefined
                } : undefined
              } : undefined;
              
              const sessionForCard = {
                _id: String(session._id),
                name: session.name,
                description: session.description || null,
                organizationName: session.organizationName || null,
                banner: session.banner || null,
                type: session.type as 'election' | 'poll' | 'tournament',
                subtype: (session.subtype === 'single' || session.subtype === 'multiple' || session.subtype === 'ranked') 
                  ? session.subtype : undefined,
                securityMethod: session.securityMethod || undefined,
                verificationMethod: session.verificationMethod || undefined,
                sessionLifecycle: formattedLifecycle,
                candidates: session.type === 'election' ? session.candidates : undefined,
                options: session.type === 'poll' ? session.options : undefined,
                contractAddress: session.contractAddress || undefined
              };
              
              return (
                <SessionCard
                  key={sessionForCard._id}
                  session={sessionForCard}
                  onJoinAsCandidate={handleJoinAsCandidate}
                  onCastVote={handleCastVote}
                  onShowResults={handleShowResults}
                  onViewProfile={handleViewProfile}
                />
              );
            })}
          </div>
        ) : publicSessions.length > 0 ? (
          // No Sessions Match Filters - Improved Visual
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-muted/20 rounded-lg border border-muted">
            <Filter className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Matching Sessions</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">Your current filter settings don't match any available sessions. Try adjusting your filters or clear them to see all sessions.</p>
            <Button 
              onClick={() => {
                setTypeFilter('all');
                setStatusFilter('all');
              }} 
              variant="outline" 
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        ) : (
          // Empty State - No Sessions Available - Improved Visual
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-muted/20 rounded-lg border border-muted">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="80" 
              height="80" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="text-primary mb-6"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12h8" />
              <path d="M12 8v8" opacity="0" />
            </svg>
            <h3 className="text-xl font-semibold mb-2">No Sessions Yet</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">There are no active voting sessions available at this time. Check back later or refresh to see new sessions.</p>
            <Button 
              onClick={refreshSessions} 
              variant="outline" 
              className="gap-2"
              disabled={refreshing}
            >
              <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Sessions
            </Button>
          </div>
        )}
      </main>

      {/* Modals and Dialogs */}
      {/* Secret Phrase Dialog */}
      <SecretPhraseDialog
        open={showSecretPhraseDialog}
        onOpenChange={setShowSecretPhraseDialog}
        onSubmit={handleSecretPhraseSubmit}
        isSubmitting={isSubmittingPhrase}
      />

      {/* Pricing Dialog */}
      <PricingDialog 
        open={showPricingDialog} 
        onOpenChange={setShowPricingDialog} 
      />

      {/* Candidate Form Dialog */}
      {selectedSession && selectedSession._id && (
        <CandidateFormDialog 
          open={showCandidateForm}
          onOpenChange={setShowCandidateForm}
          sessionId={String(selectedSession._id)}
          sessionTitle={selectedSession.name}
        />
      )}
    </div>
  );
}
