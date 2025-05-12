import baseApi from './base-api';

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'task' | 'invitation' | 'session' | 'candidate' | 'system';
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