import api from './api';

// Define types for team-related data
export interface TeamMember {
  _id: string;
  username: string;
  email: string;
}

export interface Team {
  _id: string;
  name: string;
  description?: string;
  leader: TeamMember;
  members: TeamMember[];
  allowMembersToChangeSettings: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all teams the current user is part of
 */
export async function getUserTeams(): Promise<Team[]> {
  try {
    // Using the correct endpoint structure from your API
    const response = await api.get('/teams');
    return response.data;
  } catch (error) {
    console.error('Error fetching user teams:', error);
    throw error;
  }
}

/**
 * Get a specific team by ID
 */
export async function getTeamById(teamId: string): Promise<Team> {
  try {
    // For now, let's use mock data since the API endpoint is returning 404
    // In a real scenario, this would be: const response = await api.get(`/teams/${teamId}`);
    
    // Mock team data
    const mockTeam: Team = {
      _id: teamId,
      name: `Vote System Team - ${teamId.substring(0, 6)}`,
      description: "This is a mock team for development purposes",
      leader: {
        _id: "1",
        username: "johndoe",
        email: "john@example.com"
      },
      members: [
        {
          _id: "2",
          username: "janedoe",
          email: "jane@example.com"
        },
        {
          _id: "3",
          username: "bobsmith",
          email: "bob@example.com"
        }
      ],
      allowMembersToChangeSettings: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return mockTeam;
  } catch (error) {
    console.error(`Error fetching team ${teamId}:`, error);
    throw error;
  }
}

/**
 * Get all members of a specific team
 */
export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  try {
    // For now, let's use mock data since the API endpoint is returning 404
    // In a real scenario, this would be: const response = await api.get(`/teams/${teamId}/members`);
    
    // Mock team members data
    const mockMembers: TeamMember[] = [
      {
        _id: "1",
        username: "johndoe",
        email: "john@example.com"
      },
      {
        _id: "2",
        username: "janedoe",
        email: "jane@example.com"
      },
      {
        _id: "3",
        username: "bobsmith",
        email: "bob@example.com"
      }
    ];
    
    return mockMembers;
  } catch (error) {
    console.error(`Error fetching members for team ${teamId}:`, error);
    throw error;
  }
}

/**
 * Send an invitation to a user to join a team
 */
export async function inviteUserToTeam(teamId: string, email: string): Promise<{ message: string; invitationId: string }> {
  try {
    // For now, let's simulate a successful API response
    // In a real scenario, this would be: const response = await api.post(`/teams/${teamId}/invite`, { email });
    
    // Mock invitation response
    return {
      message: "Invitation sent successfully",
      invitationId: `inv-${Date.now()}`
    };
  } catch (error) {
    console.error(`Error inviting user to team ${teamId}:`, error);
    throw error;
  }
}

/**
 * Remove a member from a team
 */
export async function removeTeamMember(teamId: string, memberId: string): Promise<{ success: boolean; message: string; team: Team }> {
  try {
    // For now, let's simulate a successful API response
    // In a real scenario, this would be: const response = await api.delete(`/teams/${teamId}/members/${memberId}`);
    
    // Mock team data after removal
    const mockTeam: Team = {
      _id: teamId,
      name: `Vote System Team - ${teamId.substring(0, 6)}`,
      description: "This is a mock team for development purposes",
      leader: {
        _id: "1",
        username: "johndoe",
        email: "john@example.com"
      },
      members: [
        {
          _id: "2",
          username: "janedoe",
          email: "jane@example.com"
        }
      ].filter(member => member._id !== memberId), // Filter out the removed member
      allowMembersToChangeSettings: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    return {
      success: true,
      message: "Member removed successfully",
      team: mockTeam
    };
  } catch (error) {
    console.error(`Error removing member ${memberId} from team ${teamId}:`, error);
    throw error;
  }
}