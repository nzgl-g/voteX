# Session Form and Backend Integration

## Overview

This document explains how the session creation form in the frontend integrates with the backend session models and routes. It serves as a guide for developers working on the Votex application to understand the data flow and ensure consistency between frontend and backend.

## Data Flow

1. **Frontend Form** (`/app/session-creation/page.tsx` and `/components/voting/session-form.tsx`)
   - User fills out multi-step form with session details
   - Form data is collected and validated
   - On submission, data is mapped to backend format using `sessionMapper.ts`
   - API request is sent to `/sessionRequests` endpoint

2. **Backend Processing** (`/server/routes/sessionRequests.js`)
   - Request is validated and processed
   - Session request is created in database
   - When approved, a full session is created with associated team and details

## Key Models

### Frontend Form Data Structure

```typescript
{
  name: string;
  description: string;
  organization: string;
  banner: { id: string; url: string };
  sessionType: VotingSessionType; // "poll", "election", "tournament"
  votingMode: VotingMode; // "single-choice", "multiple-choice", etc.
  startDate: Date;
  endDate: Date;
  preparationSchedule: Date | null;
  accessControl: AccessControlType; // "public", "private", etc.
  secretPhrase: string;
  csvInviteFile: File | null;
  displayLiveResults: boolean;
  verificationMethod: string;
  options: { title: string; description: string }[];
  candidateEntryMethod: CandidateEntryType; // "manual", "email", "open"
  candidates: { name: string; email: string }[];
}
```

### Backend Models

#### SessionRequest Model

```javascript
{
  createdBy: ObjectId,
  status: String, // "pending", "approved", "rejected"
  name: String,
  description: String,
  type: String, // "election", "poll", "tournament"
  voteMode: String, // "single", "multiple", "ranked", etc.
  startTime: Date,
  endTime: Date,
  visibility: String, // "Public", "Private"
  secretPhrase: String,
  locationRestriction: String,
  resultVisibility: String // "Visible", "Hidden"
}
```

#### Session Model

```javascript
{
  name: String,
  type: String, // "election", "poll", "tournament"
  voteMode: String, // "single", "multiple", "ranked", etc.
  details: ObjectId, // Reference to SessionDetails
  sessionRequest: ObjectId, // Reference to original request
  description: String,
  createdBy: ObjectId,
  team: ObjectId,
  status: String, // "InProgress", "Complete", "Rejected", "Approved", "Pending"
  sessionLifecycle: {
    createdAt: Date,
    scheduledAt: Date,
    startedAt: Date,
    endedAt: Date
  },
  visibility: String, // "Public", "Private"
  secretPhrase: String,
  locationRestriction: String,
  resultVisibility: String, // "Visible", "Hidden"
  organizationName: String,
  banner: String,
  verificationMethod: String, // "KYC", "CVC", null
  candidateStep: String, // "Nomination", "Invitation"
  subscription: {
    id: String,
    name: String, // "free", "pro", "enterprise"
    price: Number,
    voterLimit: Number,
    features: [String],
    isRecommended: Boolean
  }
}
```

## Field Mapping

The `sessionMapper.ts` utility handles mapping between frontend and backend models:

| Frontend Field | Backend Field | Notes |
|----------------|---------------|-------|
| name | name | Direct mapping |
| description | description | Direct mapping |
| sessionType | type | Mapped using mapSessionType() |
| votingMode | voteMode | Mapped using mapVotingMode() |
| startDate | startTime | Date object |
| endDate | endTime | Date object |
| accessControl | visibility | "public" → "Public", else "Private" |
| secretPhrase | secretPhrase | Direct mapping |
| locationRestriction | locationRestriction | Direct mapping |
| displayLiveResults | resultVisibility | true → "Visible", false → "Hidden" |
| organization | organizationName | Direct mapping |
| banner.url | banner | URL string |
| verificationMethod | verificationMethod | Mapped using mapVerificationMethod() |
| candidateEntryMethod | candidateStep | "open" → "Nomination", else "Invitation" |
| plan | subscription.name | Used for subscription details |

## Session Request Approval Process

When a session request is approved:

1. A new Team is created with the request creator as leader
2. A new Session is created with data from the request
3. SessionDetails are created for the session
4. The request status is updated to "approved"
5. The user's role is updated to "team_leader" if needed

## Best Practices

1. Always use the `sessionMapper.ts` utility to ensure consistent data mapping
2. Validate all required fields on both frontend and backend
3. Handle date formatting consistently (ISO strings in transit, Date objects in code)
4. Ensure proper error handling and user feedback
5. Maintain this documentation when making changes to the session models or form

## Future Improvements

1. Add more comprehensive validation on both frontend and backend
2. Implement form data persistence to prevent data loss on page refresh
3. Add support for draft session requests
4. Improve error messaging and field validation feedback
5. Add support for editing existing sessions