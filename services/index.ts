import baseApi from './base-api';
import authService from './auth-service';
import sessionService from './session-service';
import teamService from './team-service';
import taskService from './task-service';
import notificationService from './notification-service';

// Re-export services for easy import
export { authService, sessionService, teamService, taskService, notificationService };

// Re-export interfaces for use in components
export type {
  UserProfile, 
  LoginCredentials, 
  SignupData,
  ProfileUpdateData,
  WalletLinkData
} from './auth-service';

export type {
  Session,
  SessionBase,
  Election,
  Poll,
  Tournament,
  SessionLifecycle,
  Subscription,
  Candidate,
  PollOption,
  CandidateApplication,
  VoteData
} from './session-service';

export type {
  Team,
  TeamMember,
  CreateTeamData,
  Invitation,
  InvitationData
} from './team-service';

export type {
  Task,
  CreateTaskData,
  UpdateTaskData
} from './task-service';

export type {
  Notification
} from './notification-service';

// Export base API for direct use if needed
export { baseApi };

// Default export of all services
export default {
  auth: authService,
  session: sessionService,
  team: teamService,
  task: taskService,
  notification: notificationService,
  api: baseApi
}; 