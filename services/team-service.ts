import baseApi from './base-api';

export interface TeamMember {
  _id: string;
  username: string;
  email: string;
  fullName?: string;
  profilePic?: string;
}

export interface Team {
  _id: string;
  session: string;
  sessionName: string;
  leader: string | TeamMember;
  members: string[] | TeamMember[];
  createdAt?: string;
}

export interface CreateTeamData {
  sessionId: string;
  members?: string[];
}

export interface InvitationData {
  userId: string;
  teamId: string;
  sessionId: string;
  role: 'team_member';
}

export interface Invitation {
  _id: string;
  userId: string;
  teamId: string;
  sessionId: string;
  role: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

class TeamService {
  /**
   * Get a specific team by ID
   */
  async getTeamById(teamId: string): Promise<Team> {
    try {
      const response = await baseApi.get<Team>(`/teams/${teamId}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Failed to fetch team with ID ${teamId}`;
      throw new Error(errorMessage);
    }
  }

  /**
   * Get teams where the current user is a leader
   */
  async getUserTeams(): Promise<Team[]> {
    try {
      const response = await baseApi.get<Team[]>('/teams');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch user teams';
      throw new Error(errorMessage);
    }
  }

  /**
   * Create a new team
   */
  async createTeam(teamData: CreateTeamData): Promise<Team> {
    try {
      const response = await baseApi.post<Team>('/teams', teamData);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create team';
      throw new Error(errorMessage);
    }
  }

  /**
   * Update a team
   */
  async updateTeam(teamId: string, updateData: { members?: string[] }): Promise<Team> {
    try {
      const response = await baseApi.put<Team>(`/teams/${teamId}`, updateData);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update team';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get all invitations for the current user
   */
  async getInvitations(): Promise<Invitation[]> {
    try {
      const response = await baseApi.get<Invitation[]>('/invitations');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch invitations';
      throw new Error(errorMessage);
    }
  }

  /**
   * Create a new invitation
   */
  async createInvitation(invitationData: InvitationData): Promise<Invitation> {
    try {
      const response = await baseApi.post<Invitation>('/invitations', invitationData);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create invitation';
      throw new Error(errorMessage);
    }
  }

  /**
   * Update invitation status (accept/reject)
   */
  async updateInvitation(invitationId: string, status: 'accepted' | 'rejected'): Promise<Invitation> {
    try {
      const response = await baseApi.put<Invitation>(`/invitations/${invitationId}`, { status });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update invitation';
      throw new Error(errorMessage);
    }
  }

  /**
   * Search for users to invite to a team
   */
  async searchUsers(query: string): Promise<TeamMember[]> {
    try {
      const response = await baseApi.get<TeamMember[]>(`/users/search?query=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to search users';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get team members for a specific team
   */
  async getTeamMembers(teamId: string): Promise<Team> {
    try {
      const response = await baseApi.get<Team>(`/teams/${teamId}/members`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Failed to fetch team members for team ${teamId}`;
      throw new Error(errorMessage);
    }
  }

  /**
   * Invite a user to join a team
   */
  async inviteUserToTeam(teamId: string, userId: string, sessionId: string): Promise<Invitation> {
    try {
      const invitationData: InvitationData = {
        userId,
        teamId,
        sessionId,
        role: 'team_member'
      };
      const response = await baseApi.post<Invitation>('/invitations', invitationData);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to invite user to team';
      throw new Error(errorMessage);
    }
  }

  /**
   * Remove a member from a team
   */
  async removeTeamMember(teamId: string, memberId: string): Promise<Team> {
    try {
      const response = await baseApi.delete<Team>(`/teams/${teamId}/members/${memberId}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to remove team member';
      throw new Error(errorMessage);
    }
  }

  /**
   * Check if the current user has a team role (leader or member)
   */
  async checkTeamRole(): Promise<{ isTeam: boolean; role?: string; sessionId?: string }> {
    try {
      const response = await baseApi.get<{ isTeam: boolean; role?: string; sessionId?: string }>('/users/role');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to check team role';
      throw new Error(errorMessage);
    }
  }
}

export const teamService = new TeamService();
export default teamService; 