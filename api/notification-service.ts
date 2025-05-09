import api from '../lib/api';

export interface NotificationPayload {
  id: string;
  type: string;
  message: string;
  link: string;
  targetType: 'user' | 'team' | 'all';
  category: 'Alert' | 'Interaction';
  timestamp: string;
  read: boolean;
  createdAt: string;
}

export const notificationService = {
  /**
   * Get user notifications
   * @param limit Number of notifications to fetch
   * @param skip Number of notifications to skip
   * @returns Array of notifications
   */
  async getUserNotifications(limit = 5, skip = 0): Promise<NotificationPayload[]> {
    const response = await api.get(`/notifications?limit=${limit}&skip=${skip}`);
    return response.data;
  },

  /**
   * Mark notification as read
   * @param notificationId ID of the notification to mark as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await api.patch(`/notifications/${notificationId}/read`);
  },
  
  /**
   * Send a task status notification
   * @param taskId ID of the task
   * @param taskTitle Title of the task
   * @param status New status of the task
   * @param sessionId ID of the session
   * @returns Response from the notification creation
   */
  async sendTaskStatusNotification(
    taskId: string,
    taskTitle: string,
    status: 'completed' | 'pending',
    sessionId: string
  ): Promise<any> {
    try {
      // Get current user
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      
      const user = JSON.parse(userStr);
      const isCompleted = status === 'completed';
      
      const notificationData = {
        type: isCompleted ? 'task-completed' : 'task-reopened',
        message: `Task "${taskTitle}" was ${isCompleted ? 'completed' : 'reopened'} by ${user.username || 'a team member'}`,
        link: `/tasks/${taskId}`,
        targetType: 'team',
        category: 'Interaction',
        session: sessionId
      };
      
      // Try to send the notification to the server
      try {
        const response = await api.post('/notifications', notificationData);
        return response.data;
      } catch (error) {
        console.warn('Failed to send notification to server, using local notification instead:', error);
        
        // If server notification fails, we could implement a local notification system
        // For now, we'll just log it
        console.log('Local notification:', notificationData);
        return null;
      }
    } catch (error) {
      console.error('Error creating task status notification:', error);
      return null;
    }
  }
}; 