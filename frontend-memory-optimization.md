# Frontend Memory Optimization Plan

## Identified Issues

1. **Socket.IO Connection Management**: Multiple connection instances and improper cleanup
2. **Memory Leaks in React Components**: Components not properly cleaning up resources
3. **Large Component Re-renders**: Inefficient rendering patterns causing excessive DOM updates
4. **Unoptimized State Management**: Redundant state updates and inefficient data structures
5. **Missing Pagination in Data-Heavy Components**: Loading all data at once
6. **Excessive DOM Elements**: Complex UI components with many elements

## Optimization Steps

### 1. Socket.IO Connection Optimization

The `notification-provider.tsx` component has several issues with Socket.IO connection management:

```javascript
// Current implementation in notification-provider.tsx
useEffect(() => {
  // Check if we're in the browser
  if (typeof window === 'undefined') return;

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No authentication token found, cannot connect to socket');
      return;
    }

    // Get user information
    let userId;
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        userId = user._id;
        console.log('User ID for socket authentication:', userId);
      } catch (e) {
        console.error('Failed to parse user data from localStorage:', e);
      }
    }

    if (!userId) {
      console.log('No user ID found, cannot authenticate socket');
      return;
    }

    console.log('Connecting to socket.io server...');
    const socketInstance = io('http://localhost:2000', {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      transports: ['websocket', 'polling'],
    });

    // ... event handlers ...

    setSocket(socketInstance);

    return () => {
      console.log('Disconnecting socket...');
      socketInstance.disconnect();
    };
  } catch (error: any) {
    console.error('Failed to connect to socket:', error);
  }
}, []);
```

**Optimized Implementation:**

```javascript
// Create a singleton socket service
// In services/socket-service.ts
import { io, Socket } from 'socket.io-client';

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  
  private constructor() {}
  
  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }
  
  public connect(userId: string, token: string): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }
    
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:2000';
    
    this.socket = io(socketUrl, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      transports: ['websocket'], // Only use websocket to reduce overhead
      forceNew: false,
      multiplex: true,
    });
    
    this.socket.on('connect', () => {
      console.log('Socket connected with ID:', this.socket?.id);
      this.socket?.emit('authenticate', userId);
    });
    
    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
    
    return this.socket;
  }
  
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
  
  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
    
    if (this.socket) {
      this.socket.on(event, callback as any);
    }
  }
  
  public off(event: string, callback: Function): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)?.delete(callback);
    }
    
    if (this.socket) {
      this.socket.off(event, callback as any);
    }
  }
}

export const socketService = SocketService.getInstance();
export default socketService;
```

**Updated Notification Provider:**

```jsx
// In notification-provider.tsx
import socketService from '@/services/socket-service';

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationWithUI[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // Setup socket connection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    let userId;
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        userId = user._id;
      }
    } catch (e) {
      console.error('Failed to parse user data:', e);
      return;
    }
    
    if (!userId) return;
    
    // Connect using singleton service
    const socket = socketService.connect(userId, token);
    setIsConnected(socket.connected);
    
    // Setup event handlers
    const handleNewNotification = (notification: Notification) => {
      console.log('New notification received:', notification);
      const uiNotification: NotificationWithUI = {
        ...notification,
        id: notification._id,
        category: notification.type === 'invitation' ? 'Interaction' : 'Information',
        timestamp: notification.createdAt
      };
      setNotifications(prev => [uiNotification, ...prev]);
    };
    
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    
    socketService.on('new-notification', handleNewNotification);
    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);
    
    return () => {
      socketService.off('new-notification', handleNewNotification);
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
    };
  }, []);
  
  // Rest of the component...
}
```

### 2. React Component Memory Leak Prevention

The `task-block.tsx` component has potential memory leaks with its interval:

```javascript
// Current implementation in task-block.tsx
useEffect(() => {
  // Fetch initial data
  fetchData()
  
  // Set up auto-refresh interval
  autoRefreshIntervalRef.current = setInterval(() => {
    quietFetchData()
  }, 30000) // Refresh every 30 seconds
  
  return () => {
    // Clear interval on unmount
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current)
    }
  }
}, [sessionId, fetchData, quietFetchData])
```

**Optimized Implementation:**

```javascript
// In task-block.tsx
useEffect(() => {
  // Fetch initial data
  fetchData();
  
  // Set up auto-refresh interval with clear reference tracking
  const intervalId = setInterval(() => {
    // Only fetch if component is mounted and visible
    if (document.visibilityState === 'visible') {
      quietFetchData();
    }
  }, 30000);
  
  autoRefreshIntervalRef.current = intervalId;
  
  // Add visibility change listener to pause fetching when tab is not visible
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && !autoRefreshIntervalRef.current) {
      // Resume fetching if tab becomes visible again
      quietFetchData();
      autoRefreshIntervalRef.current = setInterval(quietFetchData, 30000);
    } else if (document.visibilityState !== 'visible' && autoRefreshIntervalRef.current) {
      // Pause fetching if tab is hidden
      clearInterval(autoRefreshIntervalRef.current);
      autoRefreshIntervalRef.current = null;
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  return () => {
    // Clean up all resources
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
      autoRefreshIntervalRef.current = null;
    }
  };
}, [sessionId]);
```

### 3. Optimize React Rendering

The `task-dialog.tsx` component has inefficient rendering patterns:

**Current Implementation:**
```jsx
// In task-dialog.tsx
export default function TaskDialog({ isOpen, onClose, selectedMembers, sessionId, taskToEdit }: TaskDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState(TASK_COLORS[9].value)
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [time, setTime] = useState<{ hours: string; minutes: string }>({ hours: "12", minutes: "00" })
  const [assignedMembers, setAssignedMembers] = useState<string[]>(selectedMembers)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // ... rest of component
}
```

**Optimized Implementation:**

```jsx
// In task-dialog.tsx
import { memo, useMemo } from 'react';

// Use memo to prevent unnecessary re-renders
const TaskDialog = memo(function TaskDialog({ 
  isOpen, 
  onClose, 
  selectedMembers, 
  sessionId, 
  taskToEdit 
}: TaskDialogProps) {
  // Combine related state into a single object to reduce re-renders
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    color: TASK_COLORS[9].value,
    priority: "medium" as "low" | "medium" | "high",
    date: new Date(),
    time: { hours: "12", minutes: "00" },
  });
  
  const [assignedMembers, setAssignedMembers] = useState<string[]>(selectedMembers);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use updater functions to modify state
  const updateFormField = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Use useMemo for expensive calculations
  const filteredTeamMembers = useMemo(() => {
    return teamMembers.filter(member => !assignedMembers.includes(member._id));
  }, [teamMembers, assignedMembers]);
  
  // ... rest of component with optimized rendering
});

export default TaskDialog;
```

### 4. Implement Virtual Lists for Large Data Sets

The notification sheet and task list components render all items at once, which can be inefficient:

**Current Implementation:**
```jsx
// In notification-sheet.tsx
{notifications.length > 0 ? (
  <div className="mt-4 flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-120px)] pr-1">
    {notifications.map((notification) => (
      <div key={notification._id || notification.id || Math.random().toString()} className="rounded-lg border p-3 shadow-sm">
        {/* Notification content */}
      </div>
    ))}
  </div>
) : (
  <div className="flex items-center justify-center h-full py-16 text-muted-foreground">
    No notifications for you
  </div>
)}
```

**Optimized Implementation with Virtual List:**

```jsx
// Install react-window: npm install react-window
import { FixedSizeList as List } from 'react-window';

// In notification-sheet.tsx
{notifications.length > 0 ? (
  <div className="mt-4 pr-1 h-[calc(100vh-120px)]">
    <List
      height={window.innerHeight - 120}
      width="100%"
      itemCount={notifications.length}
      itemSize={100} // Adjust based on your notification height
      overscanCount={5}
    >
      {({ index, style }) => {
        const notification = notifications[index];
        return (
          <div 
            key={notification._id || notification.id || index}
            style={style}
            className="rounded-lg border p-3 shadow-sm mb-3"
          >
            {/* Notification content */}
          </div>
        );
      }}
    </List>
  </div>
) : (
  <div className="flex items-center justify-center h-full py-16 text-muted-foreground">
    No notifications for you
  </div>
)}
```

### 5. Implement Pagination for Data Fetching

The task block component fetches all tasks at once:

**Current Implementation:**
```javascript
// In task-block.tsx
const fetchData = async () => {
  setIsLoading(true)
  try {
    // Fetch tasks for the session
    const tasksData = await taskService.getSessionTasks(sessionId)
    setTasks(tasksData)
    
    // Get team ID for the session
    const teamId = await sessionService.getSessionTeam(sessionId)
    
    if (teamId) {
      // Fetch team members data
      const teamData = await teamService.getTeamMembers(teamId)
      
      // Create a map of member IDs to member data
      const membersMap = {}
      
      // Add members to map
      // ...
      
      setTeamMembers(membersMap)
    }
  } catch (error) {
    console.error("Error fetching tasks:", error)
    toast.error("Failed to load tasks")
  } finally {
    setIsLoading(false)
  }
}
```

**Optimized Implementation with Pagination:**

```javascript
// Update task service to support pagination
// In services/task-service.ts
async getSessionTasks(sessionId: string, page = 1, limit = 10): Promise<{tasks: Task[], total: number}> {
  try {
    const response = await baseApi.get<{tasks: Task[], total: number}>(
      `/tasks/session/${sessionId}?page=${page}&limit=${limit}`
    );
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || 'Failed to fetch tasks';
    throw new Error(errorMessage);
  }
}

// In task-block.tsx
const [currentPage, setCurrentPage] = useState(1);
const [totalTasks, setTotalTasks] = useState(0);
const [hasMore, setHasMore] = useState(true);
const PAGE_SIZE = 10;

const fetchData = async (page = 1) => {
  setIsLoading(true);
  try {
    // Fetch tasks with pagination
    const { tasks: tasksData, total } = await taskService.getSessionTasks(
      sessionId, 
      page, 
      PAGE_SIZE
    );
    
    setTotalTasks(total);
    setHasMore(page * PAGE_SIZE < total);
    
    if (page === 1) {
      setTasks(tasksData);
    } else {
      setTasks(prev => [...prev, ...tasksData]);
    }
    
    // Rest of the function...
  } catch (error) {
    console.error("Error fetching tasks:", error);
    toast.error("Failed to load tasks");
  } finally {
    setIsLoading(false);
  }
};

// Add load more button
<Button 
  variant="outline" 
  onClick={() => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchData(nextPage);
  }}
  disabled={!hasMore || isLoading}
  className="w-full mt-4"
>
  {isLoading ? (
    <Loader2 className="h-4 w-4 animate-spin mr-2" />
  ) : null}
  {hasMore ? "Load More Tasks" : "No More Tasks"}
</Button>
```

### 6. Implement React.memo and useMemo for Expensive Components

Use memoization to prevent unnecessary re-renders:

```jsx
// For task card component in task-block.tsx
const TaskCard = memo(function TaskCard({ 
  task, 
  teamMembers, 
  onToggleComplete, 
  onEdit, 
  onDelete 
}) {
  // Component implementation
});

// In the main component
const renderedTasks = useMemo(() => {
  return filteredTasks.map(task => (
    <TaskCard
      key={task._id}
      task={task}
      teamMembers={teamMembers}
      onToggleComplete={handleToggleComplete}
      onEdit={handleEditTask}
      onDelete={handleDeleteTask}
    />
  ));
}, [filteredTasks, teamMembers, handleToggleComplete, handleEditTask, handleDeleteTask]);
```

### 7. Implement Code Splitting and Lazy Loading

Use Next.js dynamic imports to load components only when needed:

```jsx
// In app/layout.tsx
import dynamic from 'next/dynamic';

// Lazy load the notification provider
const NotificationProvider = dynamic(
  () => import('@/components/shared/notification-provider').then(mod => mod.NotificationProvider),
  { ssr: false } // Don't render on server since it uses browser APIs
);

// Lazy load task dialog
const TaskDialog = dynamic(
  () => import('@/components/team-manager/task-dialog'),
  { ssr: false, loading: () => <div>Loading...</div> }
);
```

### 8. Optimize Images and Media

Ensure all images are properly optimized:

```jsx
// Use Next.js Image component for automatic optimization
import Image from 'next/image';

// Instead of:
<img src={user.avatar} alt={user.name} />

// Use:
<Image 
  src={user.avatar} 
  alt={user.name} 
  width={40} 
  height={40} 
  loading="lazy"
/>
```

## Implementation Priority

1. Socket.IO Connection Optimization (High Impact)
2. React Component Memory Leak Prevention (High Impact)
3. Implement Pagination for Data Fetching (High Impact)
4. Optimize React Rendering (Medium Impact)
5. Implement Virtual Lists for Large Data Sets (Medium Impact)
6. Implement Code Splitting and Lazy Loading (Medium Impact)
7. Implement React.memo and useMemo (Low-Medium Impact)
8. Optimize Images and Media (Low Impact)
