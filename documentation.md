# **System Documentation**

## Backend Architecture

The backend is developed using **Node.js** with **Express.js**, and data is stored in **MongoDB**. The backend is modular, with distinct responsibilities divided into:

- **Models**: Define database schema and relationships
- **Routes**: Define API endpoints and logic
- **Middleware**: Handle authentication and role-based access
- **Utilities**: Contain shared helper functions

---

### Models Overview

| Model | Description | Key Fields | Relations |
| --- | --- | --- | --- |
| **User** | Stores user credentials & profiles | `username`, `email`, `password`, `walletAddress` | Teams, Sessions |
| **Session** | Represents a voting session | `name`, `type`, `organizationName`, `banner` | Teams, SessionDetails, Requests |
| **Team** | Group of users collaborating on sessions | `leader`, `members`, `session` | Users, Sessions |
| **CandidateRequest** | Tracks candidate requests | `user`, `session`, `status`, `approvedAt` | User, Session |
| **Invitation** | Manages team invites | `teamId`, `userId`, `status`, `invitedBy` | Team, User |
| **SessionParticipants** | Tracks user roles in sessions | `sessionId`, `userId`, `role`, `joinedAt` | Session, User |

---

### API Route Summary

| Endpoint | Description |
| --- | --- |
| **/sessionRequests** | POST to request a session, PUT to approve, GET to list (admin) |
| **/user** | Auth, profile, user search, logout |
| **/team** | Manage teams and members |
| **/session** | Fetch user-specific or all sessions |
| **/session/:id/candidate** | Candidate management for sessions |
| **/invitation** | Accept/decline team invitations |
| **/login /signUp** | User authentication |

---

### Data Flow Diagrams

### 1. Session Creation Flow

1. User submits form → `/sessionRequests`
2. Admin approval → Creates `Team`, `Session`, `SessionDetails`
3. Participants assigned roles

### 2. Authentication Flow

1. Login → JWT generated
2. Token verified by middleware
3. User data appended to request

### 3. Voting Process Flow

1. User requests candidate role → `/candidate/request`
2. Admin reviews request
3. Approved users displayed in voting interface

### 4. Team Management Flow

1. Leader creates team → `/team`
2. Invites sent → `/invitation`
3. User joins/declines team

### 5. Session Participation Flow

- Tracked via `SessionParticipants`
- Manages join times and user roles

---

### Invitation Workflow

1. **Create**: POST to `/invitation` with `teamId`, `userId`
2. **User Receives**: Notification sent
3. **Accept**: POST `/invitation/:id/accept` → added to team
4. **Decline**: POST `/invitation/:id/decline` → optional reason
5. **Track Status**: Timestamps and history maintained

---

### Middleware

| Middleware | Purpose |
| --- | --- |
| `auth.js` | Verifies JWT |
| `IsAdmin.js` | Checks for admin privileges |
| `isTeamLeader.js` | Validates team leader |
| `isTeamMember.js` | Validates team member |

All follow the pattern:

1. Extract JWT from header
2. Validate
3. Attach user info
4. Proceed or throw error

---

### Key Files

### Models

- `User.js`
- `Sessions.js`
- `Team.js`

### Routes

- `sessionRequests.js`
- `user.js`
- `team.js`

---

## Frontend Integration

The frontend communicates with the backend via RESTful APIs using JSON. Auth is managed through JWT tokens stored client-side.

---

### Landing Page Components

| Component | Description | API Use |
| --- | --- | --- |
| **Hero Section** | Entry point with login check | `authApi.isAuthenticated()` |
| **Features** | Static section | None |
| **Pricing** | Dynamic pricing dialog | Custom event via URL param |
| **Navigation** | Route protection, logout | `authApi`, routing utils |

---

### Component Tree

```
MainPage
├── Navbar
├── HeroSection
├── FeaturesSection
├── ProblemSection
├── TestimonialSection
├── PricingSection
├── FAQSection
├── ContactSection
└── FooterSection

```

---

## Future Improvements

1. Improved input validation
2. Centralized error handling
3. Auto-generated API docs (e.g., Swagger)
4. Add rate limiting for security
5. WebSocket for real-time updates