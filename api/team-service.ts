import api from '../lib/api';

// Types for Team API
export interface TeamMember {
  _id: string;
  username: string;
  email: string;
  fullName?: string;
}

export interface Team {
  _id: string;
  session?: string;
  sessionName: string;
  leader: TeamMember;
  members: TeamMember[];
}

export interface TeamInviteResponse {
  message: string;
  invitationId: string;
}

export interface TeamMembersResponse {
  leader: TeamMember;
  members: TeamMember[];
}

export interface RemoveMemberResponse {
  success: boolean;
  message: string;
  team: Team;
}

// Team-related API methods
export const teamService = {
  /**
   * Get all teams the current user is part of (either as leader or member)
   * @returns Array of teams
   */
  async getUserTeams(): Promise<Team[]> {
    try {
      const response = await api.get('/teams');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch user teams:', error);
      throw new Error(error.response?.data || 'Failed to fetch user teams');
    }
  },

  /**
   * Get a specific team by ID
   * @param teamId The ID of the team to fetch
   * @returns Team object
   */
  async getTeamById(teamId: string): Promise<Team> {
    try {
      const response = await api.get(`/teams/${teamId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to fetch team ${teamId}:`, error);
      throw new Error(error.response?.data || `Failed to fetch team ${teamId}`);
    }
  },

  /**
   * Get all members of a specific team
   * @param teamId The ID of the team
   * @returns Object containing leader and members
   */
  async getTeamMembers(teamId: string): Promise<TeamMembersResponse> {
    try {
      const response = await api.get(`/teams/${teamId}/members`);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to fetch team members for team ${teamId}:`, error);
      throw new Error(error.response?.data || `Failed to fetch team members for team ${teamId}`);
    }
  },

  /**
   * Send an invitation to a user to join a team
   * @param teamId The ID of the team
   * @param email The email of the user to invite
   * @returns Response with invitation ID
   */
  async inviteUserToTeam(teamId: string, email: string): Promise<TeamInviteResponse> {
    try {
      const response = await api.post(`/teams/${teamId}/invite`, { email });
      return response.data;
    } catch (error: any) {
      console.error(`Failed to invite user to team ${teamId}:`, error);
      throw new Error(error.response?.data || `Failed to invite user to team ${teamId}`);
    }
  },

  /**
   * Remove a member from a team (only team leaders can do this)
   * @param teamId The ID of the team
   * @param memberId The ID of the member to remove
   * @returns Response with updated team
   */
  async removeTeamMember(teamId: string, memberId: string): Promise<RemoveMemberResponse> {
    try {
      console.log(`Sending request to remove member ${memberId} from team ${teamId}`);
      
      // Make sure we have a valid token before making the request
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      const response = await api.delete(`/teams/${teamId}/members/${memberId}`);
      console.log('Remove member response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to remove member ${memberId} from team ${teamId}:`, error);
      
      // Enhanced error reporting
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        // Handle specific error cases
        if (error.response.status === 403) {
          throw new Error('You are not authorized to remove members from this team. Only team leaders can do this.');
        } else if (error.response.status === 404) {
          throw new Error(`Team or member not found. Please refresh and try again.`);
        }
      }
      
      throw new Error(error.response?.data?.error || `Failed to remove member from team`);
    }
  },

  /**
   * Check if the current user is the leader of a team
   * @param team The team object to check
   * @returns Boolean indicating if the current user is the team leader
   */
  isTeamLeader(team: Team): boolean {
    try {
      if (!team) {
        console.error('Team object is undefined or null');
        return false;
      }

      const userStr = localStorage.getItem('user');
      if (!userStr) {
        console.error('User not found in localStorage');
        return false;
      }
      
      const user = JSON.parse(userStr);
      
      // Handle different team leader object structures
      if (typeof team.leader === 'object' && team.leader !== null) {
        return team.leader._id === user._id;
      } else if (typeof team.leader === 'string') {
        return team.leader === user._id;
      }
      
      console.error('Unexpected team leader format:', team.leader);
      return false;
    } catch (error) {
      console.error('Failed to check if user is team leader:', error);
      return false;
    }
  },

  /**
   * Check if the current user is a member of a team
   * @param team The team object to check
   * @returns Boolean indicating if the current user is a team member
   */
  isTeamMember(team: Team): boolean {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return false;
      
      const user = JSON.parse(userStr);
      return team.members.some(member => member._id === user._id);
    } catch (error) {
      console.error('Failed to check if user is team member:', error);
      return false;
    }
  }
};
