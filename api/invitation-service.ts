import api from '../lib/api';

// Types for Invitation API
export interface Invitation {
  _id: string;
  teamId: string;
  userId: string;
  status: 'pending' | 'accepted' | 'declined';
  invitedBy: string;
}

export interface Team {
  _id: string;
  sessionName: string;
  leader: string;
  members: string[];
}

export interface InvitationWithTeam extends Invitation {
  team?: {
    _id: string;
    sessionName: string;
    leader: {
      _id: string;
      username: string;
      email: string;
    };
  };
}

// Invitation-related API methods
export const invitationService = {
  /**
   * Get all pending invitations for the current user
   * @returns Array of invitations with team details
   */
  async getUserInvitations(): Promise<InvitationWithTeam[]> {
    try {
      const response = await api.get('/invitations/my-invitations');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch user invitations:', error);
      throw new Error(error.response?.data || 'Failed to fetch invitations');
    }
  },

  /**
   * Accept an invitation to join a team
   * @param invitationId ID of the invitation to accept
   * @returns Response containing the team information
   */
  async acceptInvitation(invitationId: string): Promise<{ message: string; team: Team }> {
    try {
      if (!invitationId) {
        throw new Error('Invitation ID is required');
      }

      const response = await api.post(`/invitations/${invitationId}/accept`);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to accept invitation ${invitationId}:`, error);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        throw new Error('Invitation not found or has been removed');
      } else if (error.response?.status === 403) {
        throw new Error('You are not authorized to accept this invitation');
      } else if (error.response?.status === 400) {
        const message = error.response.data || 'Invalid invitation';
        if (message.includes('already processed')) {
          throw new Error('This invitation has already been processed');
        } else if (message.includes('already in team')) {
          throw new Error('You are already a member of this team');
        }
        throw new Error(message);
      }
      
      throw new Error(error.response?.data || 'Failed to accept invitation');
    }
  },

  /**
   * Decline an invitation to join a team
   * @param invitationId ID of the invitation to decline
   * @returns Success message
   */
  async declineInvitation(invitationId: string): Promise<{ message: string }> {
    try {
      if (!invitationId) {
        throw new Error('Invitation ID is required');
      }

      const response = await api.post(`/invitations/${invitationId}/decline`);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to decline invitation ${invitationId}:`, error);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        throw new Error('Invitation not found or has been removed');
      } else if (error.response?.status === 403) {
        throw new Error('You are not authorized to decline this invitation');
      } else if (error.response?.status === 400) {
        const message = error.response.data || 'Invalid invitation';
        if (message.includes('already processed')) {
          throw new Error('This invitation has already been processed');
        }
        throw new Error(message);
      }
      
      throw new Error(error.response?.data || 'Failed to decline invitation');
    }
  },

  /**
   * Cancel an invitation that you've sent (only for team leaders)
   * @param invitationId ID of the invitation to cancel
   * @returns Success message
   */
  async cancelInvitation(invitationId: string): Promise<{ message: string }> {
    try {
      if (!invitationId) {
        throw new Error('Invitation ID is required');
      }

      const response = await api.delete(`/invitations/${invitationId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to cancel invitation ${invitationId}:`, error);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        throw new Error('Invitation not found');
      } else if (error.response?.status === 403) {
        throw new Error('Only the team leader who sent this invitation can cancel it');
      }
      
      throw new Error(error.response?.data || 'Failed to cancel invitation');
    }
  },

  /**
   * Get all pending invitations for a specific team (team leaders only)
   * @param teamId ID of the team to get invitations for
   * @returns Array of pending invitations
   */
  async getTeamPendingInvitations(teamId: string): Promise<Invitation[]> {
    try {
      if (!teamId) {
        throw new Error('Team ID is required');
      }

      const response = await api.get(`/teams/${teamId}/invitations`);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to fetch pending invitations for team ${teamId}:`, error);
      
      if (error.response?.status === 403) {
        throw new Error('Only team leaders can view team invitations');
      } else if (error.response?.status === 404) {
        throw new Error('Team not found');
      }
      
      throw new Error(error.response?.data || 'Failed to fetch team invitations');
    }
  },

  /**
   * Check if an invitation is pending for a user to a specific team
   * @param email Email of the user to check
   * @param teamId ID of the team to check
   * @returns Boolean indicating if an invitation is pending
   */
  async isInvitationPending(email: string, teamId: string): Promise<boolean> {
    try {
      if (!email || !teamId) {
        throw new Error('Email and Team ID are required');
      }

      const response = await api.get(`/teams/${teamId}/invitations/check?email=${encodeURIComponent(email)}`);
      return response.data.isPending;
    } catch (error: any) {
      console.error(`Failed to check invitation status for ${email} to team ${teamId}:`, error);
      
      // Default to false on error to prevent showing incorrect UI state
      return false;
    }
  }
}; 