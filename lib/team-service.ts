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
    // First, get the session data to find the team ID
    console.log(`Fetching session data for ID: ${sessionId}`);
    const response = await api.get(`/sessions/${sessionId}`);
    const sessionData = response.data;
    
    // Check if the session has a team
    if (!sessionData.team) {
      console.warn(`Session ${sessionId} does not have a team associated with it.`);
      return [];
    }
    
    // Extract the team ID from the session data
    const teamId = typeof sessionData.team === 'object' ? sessionData.team._id : sessionData.team;
    
    if (!teamId) {
      console.warn(`Could not determine team ID for session ${sessionId}`);
      return [];
    }
    
    console.log(`Found team ID: ${teamId} for session: ${sessionId}`);
    
    // Then fetch the team members using the team ID
    const teamResponse = await api.get(`/teams/${teamId}/members`);
    const teamData = teamResponse.data;
    
    // Check if the response has the expected structure
    if (!teamData) {
      console.warn(`Unexpected team data structure for team ${teamId}`);
      return [];
    }
    
    // Combine leader and members into a single array with unique IDs for React keys
    const allMembers = [];
    
    if (teamData.leader) {
      // Add a unique identifier to ensure React keys are unique
      allMembers.push({ 
        ...teamData.leader, 
        role: 'Leader',
        // Create a unique ID by combining the user ID with a role prefix
        uniqueId: `leader-${teamData.leader._id}` 
      });
    }
    
    if (teamData.members && Array.isArray(teamData.members)) {
      // Add unique identifiers to each member
      const membersWithUniqueIds = teamData.members.map((member: any, index: number) => ({ 
        ...member, 
        role: 'Member',
        // Create a unique ID by combining the user ID with index
        uniqueId: `member-${member._id}-${index}` 
      }));
      
      allMembers.push(...membersWithUniqueIds);
    }
    
    console.log(`Retrieved ${allMembers.length} team members for session ${sessionId}`);
    return allMembers;
  } catch (error: any) {
    console.error(`Error fetching team members for session ${sessionId}:`, error);
    // Add more detailed error logging
    if (error.response) {
      console.error(`Status: ${error.response.status}, Data:`, error.response.data);
    }
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
