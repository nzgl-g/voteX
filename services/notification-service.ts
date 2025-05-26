import baseApi from './base-api';

export interface Notification {
  _id: string;
  recipients: string[];
  readBy: string[];
  targetType: 'user' | 'team' | 'all';
  teamId?: string;
  type: 'vote-started' | 'vote-ended' | 'team-invite' | 'candidate-invite' | 
        'team-member-accepted' | 'team-member-declined' | 'session-edit-request' | 
        'session-edit-approved' | 'task-assigned' | 'task-completed' | 
        'task-uncompleted' | 'team-member-removed' | 'support-response' | 'system';
  message: string;
  category: 'Alert' | 'Interaction';
  link: string;
  extraData?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

class NotificationService {
  /**
   * Get all notifications for the current user
   * @param limit Number of notifications to fetch (default: 5)
   * @param skip Number of notifications to skip (default: 0)
   */
  async getNotifications(limit: number = 5, skip: number = 0): Promise<Notification[]> {
    try {
      const response = await baseApi.get<Notification[]>(`/notifications?limit=${limit}&skip=${skip}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch notifications';
      throw new Error(errorMessage);
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<{ message: string }> {
    try {
      const response = await baseApi.patch<{ message: string }>(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to mark notification as read';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const notifications = await this.getNotifications(100, 0);
      const currentUserId = JSON.parse(localStorage.getItem('user') || '{}')._id;
      if (!currentUserId) return 0;
      
      return notifications.filter(n => !n.readBy.includes(currentUserId)).length;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService; 