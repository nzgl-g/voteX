import baseApi from './base-api';

export interface Invitation {
  _id: string;
  userId: string;
  teamId: string;
  sessionId: string;
  role: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface InvitationData {
  userId: string;
  teamId: string;
  sessionId: string;
  role: 'team_member';
}

class InvitationService {
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
   * Delete an invitation
   */
  async deleteInvitation(invitationId: string): Promise<{ message: string }> {
    try {
      const response = await baseApi.delete<{ message: string }>(`/invitations/${invitationId}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete invitation';
      throw new Error(errorMessage);
    }
  }
}

export const invitationService = new InvitationService();
export default invitationService;
