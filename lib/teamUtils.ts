/**
 * Team Utility Functions
 * 
 * This utility provides functions to fetch and manage teams for session creation.
 */

import apiClient from './api';

/**
 * Fetches teams for the current authenticated user
 * @returns Promise with teams data
 */
export async function fetchUserTeams() {
  try {
    const response = await apiClient.get('/teams/user');
    return response.data;
  } catch (error) {
    console.error('Error fetching user teams:', error);
    return [];
  }
}

/**
 * Gets the default team for the user if available
 * @param teams Array of user teams
 * @returns The first team or null if no teams
 */
export function getDefaultTeam(teams: any[]) {
  if (teams && teams.length > 0) {
    return teams[0]._id;
  }
  return null;
}