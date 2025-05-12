# VoteX Backend Architecture

## Overview
The VoteX backend is built using Node.js, Express.js, and MongoDB. It provides RESTful API endpoints for the vote system with blockchain integration, supporting elections, polls, and tournaments.

## Tech Stack
- **Express.js**: Web framework
- **MongoDB/Mongoose**: Database and ORM
- **Socket.io**: Real-time communication
- **JWT**: Authentication
- **Ethers.js**: Blockchain integration
- **Bcrypt**: Password hashing
- **Nodemailer**: Email notifications

## Project Structure
```
server/
├── index.js               # Entry point
├── models/                # Mongoose schemas
├── routes/                # API endpoints
├── middleware/            # Authentication and role checking
├── helpers/               # Utility functions
├── lib/                   # Core functionality
├── validation/            # Input validation
├── startup/               # Application initialization
└── logs/                  # Application logs
```

## Authentication Flow
The system uses JWT tokens for authentication:
1. User registers or logs in
2. Server issues a JWT token
3. Client includes this token in the Authorization header
4. Protected routes use the auth middleware to verify the token

## API Routes

### Authentication

#### POST /votex/api/signup
Register a new user

**Request Body**:
```json
{
  "username": "testuser",
  "password": "Password123!",
  "email": "test@example.com",
  "fullName": "Test User",
  "gender": "Male"
}
```

**Response**:
```json
{
  "user": {
    "_id": "60d21b4667d0d8992e610c85",
    "username": "testuser",
    "email": "test@example.com",
    "fullName": "Test User",
    "gender": "Male",
    "createdAt": "2023-06-22T10:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /votex/api/login
Authenticate a user

**Request Body**:
```json
{
  "email": "test@example.com",
  "password": "Password123!"
}
```

**Response**:
```json
{
  "user": {
    "_id": "60d21b4667d0d8992e610c85",
    "username": "testuser",
    "email": "test@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### User Management

#### GET /votex/api/users/me
Get current user profile

**Headers**:
```
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:
```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "username": "testuser",
  "email": "test@example.com",
  "fullName": "Test User",
  "gender": "Male",
  "profilePic": "https://example.com/profile.jpg",
  "createdAt": "2023-06-22T10:00:00.000Z"
}
```

#### PUT /votex/api/users/me
Update user profile

**Headers**:
```
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body**:
```json
{
  "fullName": "Updated User",
  "profilePic": "https://example.com/new-profile.jpg"
}
```

**Response**:
```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "username": "testuser",
  "email": "test@example.com",
  "fullName": "Updated User",
  "profilePic": "https://example.com/new-profile.jpg"
}
```

#### PUT /votex/api/users/link-wallet
Link blockchain wallet to user account

**Headers**:
```
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body**:
```json
{
  "walletAddress": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  "chainId": "1",
  "networkName": "Ethereum Mainnet",
  "balance": "1.5",
  "signature": "0xsignature...",
  "message": "Connect wallet to VoteX"
}
```

**Response**:
```json
{
  "message": "Wallet linked successfully",
  "wallet": {
    "walletAddress": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
    "chainId": "1",
    "networkName": "Ethereum Mainnet",
    "balance": "1.5"
  }
}
```

### Sessions

#### POST /votex/api/sessions
Create a new voting session

**Headers**:
```
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body (Election)**:
```json
{
  "name": "Presidential Election 2024",
  "description": "Election for the next president",
  "organizationName": "National Election Committee",
  "banner": "https://example.com/banner.jpg",
  "type": "election",
  "subtype": "single",
  "subscription": {
    "name": "pro",
    "price": 99.99,
    "voterLimit": 10000,
    "features": ["KYC verification", "Real-time results"]
  },
  "sessionLifecycle": {
    "scheduledAt": {
      "start": "2024-01-01T00:00:00.000Z",
      "end": "2024-01-02T00:00:00.000Z"
    }
  },
  "securityMethod": "Secret Phrase",
  "accessLevel": "Private",
  "secretPhrase": "election2024",
  "verificationMethod": "KYC",
  "maxChoices": 1
}
```

**Response**:
```json
{
  "_id": "60d21b4667d0d8992e610c86",
  "name": "Presidential Election 2024",
  "description": "Election for the next president",
  "type": "election",
  "createdBy": "60d21b4667d0d8992e610c85",
  "team": "60d21b4667d0d8992e610c87",
  "sessionLifecycle": {
    "createdAt": "2023-11-15T10:00:00.000Z",
    "scheduledAt": {
      "start": "2024-01-01T00:00:00.000Z",
      "end": "2024-01-02T00:00:00.000Z"
    }
  }
}
```

#### GET /votex/api/sessions/my-sessions
Get sessions created by the authenticated user

**Headers**:
```
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:
```json
[
  {
    "_id": "60d21b4667d0d8992e610c86",
    "name": "Presidential Election 2024",
    "description": "Election for the next president",
    "type": "election",
    "createdBy": {
      "_id": "60d21b4667d0d8992e610c85",
      "username": "testuser",
      "email": "test@example.com"
    },
    "team": {
      "_id": "60d21b4667d0d8992e610c87",
      "sessionName": "Presidential Election 2024"
    }
  }
]
```

#### POST /votex/api/sessions/:sessionId/vote
Cast a vote in a session

**Headers**:
```
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body (Election)**:
```json
{
  "candidateId": "60d21b4667d0d8992e610c88"
}
```

**Response**:
```json
{
  "message": "Vote cast successfully",
  "voteId": "60d21b4667d0d8992e610c89"
}
```

### Candidates

#### POST /votex/api/sessions/:sessionId/candidate
Apply to be a candidate in a session

**Headers**:
```
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body**:
```json
{
  "partyName": "Progressive Party",
  "fullName": "John Smith",
  "biography": "Political leader with 10 years of experience",
  "experience": "Former Mayor of Springfield (2015-2020)",
  "nationalities": ["United States"],
  "dobPob": {
    "dateOfBirth": "1975-05-15T00:00:00.000Z",
    "placeOfBirth": "Chicago, IL"
  },
  "promises": [
    "Improve healthcare system",
    "Reduce taxes for middle class",
    "Invest in renewable energy"
  ]
}
```

**Response**:
```json
{
  "message": "Candidate application submitted successfully",
  "requestId": "60d21b4667d0d8992e610c90"
}
```

### Teams

#### POST /votex/api/teams
Create a new team

**Headers**:
```
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body**:
```json
{
  "sessionId": "60d21b4667d0d8992e610c86",
  "members": [
    "60d21b4667d0d8992e610c91",
    "60d21b4667d0d8992e610c92"
  ]
}
```

**Response**:
```json
{
  "_id": "60d21b4667d0d8992e610c87",
  "session": "60d21b4667d0d8992e610c86",
  "sessionName": "Presidential Election 2024",
  "leader": "60d21b4667d0d8992e610c85",
  "members": [
    "60d21b4667d0d8992e610c91",
    "60d21b4667d0d8992e610c92"
  ]
}
```

### Invitations

#### POST /votex/api/invitations
Create an invitation to join a team

**Headers**:
```
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body**:
```json
{
  "userId": "60d21b4667d0d8992e610c93",
  "teamId": "60d21b4667d0d8992e610c87",
  "sessionId": "60d21b4667d0d8992e610c86",
  "role": "team_member"
}
```

**Response**:
```json
{
  "_id": "60d21b4667d0d8992e610c94",
  "userId": "60d21b4667d0d8992e610c93",
  "teamId": "60d21b4667d0d8992e610c87",
  "sessionId": "60d21b4667d0d8992e610c86",
  "role": "team_member",
  "status": "pending",
  "createdAt": "2023-11-15T10:00:00.000Z"
}
```

### Tasks

#### POST /votex/api/tasks
Create a task for team members

**Headers**:
```
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body**:
```json
{
  "title": "Review candidate applications",
  "description": "Review and approve/reject candidate applications for the election",
  "assignedTo": "60d21b4667d0d8992e610c91",
  "sessionId": "60d21b4667d0d8992e610c86",
  "dueDate": "2023-12-01T00:00:00.000Z",
  "priority": "high"
}
```

**Response**:
```json
{
  "_id": "60d21b4667d0d8992e610c95",
  "title": "Review candidate applications",
  "description": "Review and approve/reject candidate applications for the election",
  "assignedTo": "60d21b4667d0d8992e610c91",
  "assignedBy": "60d21b4667d0d8992e610c85",
  "sessionId": "60d21b4667d0d8992e610c86",
  "status": "pending",
  "dueDate": "2023-12-01T00:00:00.000Z",
  "priority": "high",
  "createdAt": "2023-11-15T10:00:00.000Z"
}
```

### Notifications

#### GET /votex/api/notifications
Get user notifications

**Headers**:
```
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response**:
```json
[
  {
    "_id": "60d21b4667d0d8992e610c96",
    "userId": "60d21b4667d0d8992e610c85",
    "title": "New task assigned",
    "message": "You have been assigned a new task: Review candidate applications",
    "type": "task",
    "read": false,
    "createdAt": "2023-11-15T10:00:00.000Z",
    "relatedId": "60d21b4667d0d8992e610c95"
  }
]
```

## WebSocket Events

The server uses Socket.io for real-time communication:

### Connection
```javascript
socket.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
});
```

### Authentication
```javascript
socket.on('authenticate', (userId) => {
  socket.join(userId.toString());
});
```

### Server-to-Client Events
- `notification`: Sent when a user receives a notification
- `session_update`: Sent when a session status changes
- `vote_cast`: Sent when a vote is cast in a session

## Error Handling
The API returns appropriate HTTP status codes:
- 200: Success
- 400: Bad Request (client error)
- 401: Unauthorized (authentication error)
- 403: Forbidden (permission error)
- 404: Not Found
- 500: Server Error

## Running the Server
```bash
# Install dependencies
npm install

# Start development server
npm start
```

The server will start on port 2000 by default, or the port specified in the .env file. 