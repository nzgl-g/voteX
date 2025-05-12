import baseApi from './base-api';

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'task' | 'invitation' | 'session' | 'candidate' | 'system';
  read: boolean;
  createdAt: string;
  relatedId?: string;
}

class NotificationService {
  /**
   * Get all notifications for the current user
   */
  async getNotifications(): Promise<Notification[]> {
    try {
      const response = await baseApi.get<Notification[]>('/notifications');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch notifications';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<{ count: number }> {
    try {
      const response = await baseApi.get<{ count: number }>('/notifications/unread/count');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch unread count';
      throw new Error(errorMessage);
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    try {
      const response = await baseApi.put<Notification>(`/notifications/${notificationId}`, {
        read: true
      });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to mark notification as read';
      throw new Error(errorMessage);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ message: string; count: number }> {
    try {
      const response = await baseApi.put<{ message: string; count: number }>('/notifications/read-all', {});
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to mark all notifications as read';
      throw new Error(errorMessage);
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<{ message: string }> {
    try {
      const response = await baseApi.delete<{ message: string }>(`/notifications/${notificationId}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete notification';
      throw new Error(errorMessage);
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService; 