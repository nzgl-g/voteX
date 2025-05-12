import baseApi from './base-api';

export interface Task {
  _id: string;
  title: string;
  description?: string;
  assignedTo: string;
  assignedBy: string;
  sessionId: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  completedAt?: string;
  color?: string;
  assignedMembers: string[];
  updatedAt?: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  assignedTo?: string;
  assignedMembers?: string[];
  sessionId: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  color?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  assignedTo?: string;
  status?: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
}

class TaskService {
  /**
   * Get all tasks for the current user
   */
  async getTasks(): Promise<Task[]> {
    try {
      const response = await baseApi.get<Task[]>('/tasks');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch tasks';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get tasks assigned to the current user
   */
  async getAssignedTasks(): Promise<Task[]> {
    try {
      const response = await baseApi.get<Task[]>('/tasks/assigned');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch assigned tasks';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get tasks created by the current user
   */
  async getCreatedTasks(): Promise<Task[]> {
    try {
      const response = await baseApi.get<Task[]>('/tasks/created');
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch created tasks';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get tasks for a specific session
   */
  async getSessionTasks(sessionId: string): Promise<Task[]> {
    try {
      const response = await baseApi.get<Task[]>(`/tasks/session/${sessionId}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Failed to fetch tasks for session ${sessionId}`;
      throw new Error(errorMessage);
    }
  }

  /**
   * Create a new task
   */
  async createTask(taskData: CreateTaskData): Promise<Task> {
    try {
      const response = await baseApi.post<Task>('/tasks', taskData);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create task';
      throw new Error(errorMessage);
    }
  }

  /**
   * Update a task
   */
  async updateTask(taskId: string, updateData: UpdateTaskData): Promise<Task> {
    try {
      const response = await baseApi.put<Task>(`/tasks/${taskId}`, updateData);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update task';
      throw new Error(errorMessage);
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<{ message: string }> {
    try {
      const response = await baseApi.delete<{ message: string }>(`/tasks/${taskId}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete task';
      throw new Error(errorMessage);
    }
  }

  /**
   * Toggle task completion status
   */
  async toggleTaskCompletion(taskId: string): Promise<Task> {
    try {
      const response = await baseApi.put<Task>(`/tasks/${taskId}/toggle-completion`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to toggle task completion';
      throw new Error(errorMessage);
    }
  }
}

export const taskService = new TaskService();
export default taskService; 