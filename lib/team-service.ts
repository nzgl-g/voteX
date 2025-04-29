import api from './api';
import { TeamMember, Team } from './teamApi';

/**
 * Get the team ID associated with a session
 * @param sessionId - The ID of the session
 */
export async function getSessionTeam(sessionId: string): Promise<string> {
  try {
    const response = await api.get(`/sessions/${sessionId}`);
    // Assuming the session data includes a teamId field
    return response.data.teamId;
  } catch (error) {
    console.error(`Error fetching team ID for session ${sessionId}:`, error);
    throw error;
  }
}

/**
 * Get all team members for a specific session
 * @param sessionId - The ID of the session to get team members for
 */
export async function getSessionTeamMembers(sessionId: string): Promise<TeamMember[]> {
  try {
    // First, get the team ID associated with this session
    // For now, we'll use the session ID as the team ID since that's what your API expects
    // In a real implementation, you might need to fetch the team ID from the session data
    const teamId = sessionId;
    
    // Then fetch the team members using the team ID
    const response = await api.get(`/teams/${teamId}/members`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching team members for session ${sessionId}:`, error);
    throw error;
  }
}

/**
 * Get a specific team member by ID
 * @param teamId - The ID of the team
 * @param memberId - The ID of the team member
 */
export async function getTeamMember(teamId: string, memberId: string): Promise<TeamMember> {
  try {
    const response = await api.get(`/teams/${teamId}/members/${memberId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching team member ${memberId} from team ${teamId}:`, error);
    throw error;
  }
}

/**
 * Add a new member to a team
 * @param teamId - The ID of the team
 * @param email - Email of the user to invite
 */
export async function inviteTeamMember(teamId: string, email: string): Promise<{ message: string; invitationId: string }> {
  try {
    const response = await api.post(`/teams/${teamId}/invite`, { email });
    return response.data;
  } catch (error) {
    console.error(`Error inviting member to team ${teamId}:`, error);
    throw error;
  }
}

/**
 * Remove a member from a team
 * @param teamId - The ID of the team
 * @param memberId - The ID of the member to remove
 */
export async function removeTeamMember(teamId: string, memberId: string): Promise<{ success: boolean; message: string; team: Team }> {
  try {
    const response = await api.delete(`/teams/${teamId}/members/${memberId}`);
    return response.data;
  } catch (error) {
    console.error(`Error removing member ${memberId} from team ${teamId}:`, error);
    throw error;
  }
}
