# Services

This directory contains services for communicating with the VoteX backend API. Each service provides a set of methods for interacting with specific API endpoints.

## Overview

- **base-api.ts**: Core Axios configuration with interceptors for authentication and error handling
- **auth-service.ts**: Authentication, user profile, and wallet management
- **session-service.ts**: Session creation, management, and voting
- **team-service.ts**: Team management and invitations
- **task-service.ts**: Task management for team members
- **notification-service.ts**: User notifications handling

## Usage

Import services in your components like this:

```typescript
// Import a specific service
import { authService } from '@/services';

// Or import all services
import services from '@/services';

// Then use the services
const login = async () => {
  try {
    const response = await authService.login({
      email: 'user@example.com',
      password: 'password123'
    });
    console.log('Logged in as:', response.user);
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

## Authentication

The services handle authentication tokens automatically:

1. When a user logs in or signs up, the token is stored in localStorage
2. The token is attached to API requests via the request interceptor
3. If a token expires or becomes invalid (401 response), the user is automatically logged out

## Service Methods

### Auth Service

- `login(credentials)`: Authenticate a user
- `signup(userData)`: Register a new user
- `logout()`: Log out the current user
- `isAuthenticated()`: Check if a user is authenticated
- `getCurrentUser()`: Get the current user from local storage
- `fetchUserProfile()`: Fetch current user profile from server
- `checkUsernameAvailability(username)`: Check if a username is available
- `updateProfile(userData)`: Update user profile
- `linkWallet(walletData)`: Link blockchain wallet to user account
- `verifyWallet()`: Verify wallet status

### Session Service

- `getAllSessions()`: Get all sessions
- `getUserSessions()`: Get sessions created by the current user
- `getUserSessionsAsMember()`: Get sessions where current user is a team member
- `getSessionById(sessionId, fields?)`: Get session by ID
- `getSessionByPhrase(phrase)`: Get session by secret phrase
- `checkSecretPhrase(phrase)`: Check if a secret phrase is available
- `createSession(sessionData)`: Create a new session
- `deleteSession(sessionId)`: Delete a session
- `applyAsCandidate(sessionId, applicationData)`: Apply to be a candidate in a session
- `castVote(sessionId, voteData)`: Cast a vote in a session

### Team Service

- `getTeamById(teamId)`: Get a specific team by ID
- `getUserTeams()`: Get teams where the current user is a leader
- `createTeam(teamData)`: Create a new team
- `updateTeam(teamId, updateData)`: Update a team
- `getInvitations()`: Get all invitations for the current user
- `createInvitation(invitationData)`: Create a new invitation
- `updateInvitation(invitationId, status)`: Update invitation status (accept/reject)
- `searchUsers(query)`: Search for users to invite to a team
- `checkTeamRole()`: Check if the current user has a team role (leader or member)

### Task Service

- `getTasks()`: Get all tasks for the current user
- `getAssignedTasks()`: Get tasks assigned to the current user
- `getCreatedTasks()`: Get tasks created by the current user
- `getSessionTasks(sessionId)`: Get tasks for a specific session
- `createTask(taskData)`: Create a new task
- `updateTask(taskId, updateData)`: Update a task
- `deleteTask(taskId)`: Delete a task

### Notification Service

- `getNotifications()`: Get all notifications for the current user
- `getUnreadCount()`: Get unread notifications count
- `markAsRead(notificationId)`: Mark a notification as read
- `markAllAsRead()`: Mark all notifications as read
- `deleteNotification(notificationId)`: Delete a notification 