import baseApi from './base-api';

export interface EventData {
  id?: string;
  session: string;
  title: string;
  description?: string;
  startDate: Date | string;
  endDate: Date | string;
  allDay?: boolean;
  color?: string;
}

class EventService {
  /**
   * Get all events for a session
   */
  async getSessionEvents(sessionId: string) {
    try {
      const response = await baseApi.get(`/events/session/${sessionId}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch events';
      throw new Error(errorMessage);
    }
  }

  /**
   * Create a new event
   */
  async createEvent(eventData: EventData) {
    try {
      const response = await baseApi.post('/events', eventData);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create event';
      throw new Error(errorMessage);
    }
  }

  /**
   * Update an existing event
   */
  async updateEvent(eventId: string, eventData: Partial<EventData>) {
    try {
      const response = await baseApi.put(`/events/${eventId}`, eventData);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update event';
      throw new Error(errorMessage);
    }
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string) {
    try {
      const response = await baseApi.delete(`/events/${eventId}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete event';
      throw new Error(errorMessage);
    }
  }
}

const eventService = new EventService();
export default eventService; 