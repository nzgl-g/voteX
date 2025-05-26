import baseApi from './base-api';

export interface Task {
  _id: string;
  title: string;
  description?: string;
  assignedMembers: string[];
  session: string; // This matches the server model
  sessionId?: string; // This is for compatibility with frontend components
  status: 'pending' | 'completed';
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  color?: string;
  updatedAt?: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  assignedMembers: string[];
  session: string; // This matches the server model
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
   * 
   * Note: This adapts to use the existing session tasks endpoint
   * and filters client-side, as the server doesn't have a dedicated 
   * endpoint for tasks assigned to a specific user.
   */
  async getAssignedTasks(): Promise<Task[]> {
    try {
      // Get current user
      const currentUser = localStorage.getItem('user') ? 
        JSON.parse(localStorage.getItem('user') || '{}') : {};
      
      if (!currentUser._id) {
        throw new Error('User not authenticated');
      }
      
      // Get all tasks via getTasks (could be optimized if server adds a filter)
      const allTasks = await this.getTasks();
      
      // Filter tasks where the current user is in assignedMembers
      // Handle both string comparison and ObjectId comparison
      const assignedTasks = allTasks.filter(task => 
        task.assignedMembers.some(memberId => {
          // Compare as strings to handle different ID formats
          return String(memberId) === String(currentUser._id);
        })
      );
      
      console.log(`Found ${assignedTasks.length} tasks assigned to user ${currentUser.username || currentUser._id}`);
      
      return assignedTasks;
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
      
      // Handle empty successful response
      if (!response.data || Object.keys(response.data).length === 0) {
        return { message: "Task deleted successfully" };
      }
      
      return response.data;
    } catch (error: any) {
      // If we got an empty error object from the API
      if (error.message === "API Error: {}") {
        throw new Error("Server permission error. Only team leaders can delete tasks.");
      }
      
      // Handle "Failed to fetch" network errors
      if (error.message && error.message.includes("Failed to fetch")) {
        throw new Error("Network error: Could not connect to the server");
      }
      
      // For authorization errors
      if (error.status === 403) {
        throw new Error("Access denied. Not authorized as team leader");
      }
      
      // For other errors
      const errorMessage = error.response?.data?.message || 'Failed to delete task';
      throw new Error(errorMessage);
    }
  }

  /**
   * Toggle task completion status
   */
  async toggleTaskCompletion(taskId: string): Promise<Task> {
    try {
      const response = await baseApi.patch<{ message: string; task: Task }>(`/tasks/${taskId}/complete`);
      return response.data.task;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to toggle task completion';
      throw new Error(errorMessage);
    }
  }
}

export const taskService = new TaskService();
export default taskService; 