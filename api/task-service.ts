import api from "../lib/api";

// Types for Task API
export interface Task {
  _id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  dueDate?: string;
  assignedMembers: string[];
  session: string;
  color: string;
  status: "pending" | "completed";
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskParams {
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  assignedMembers: string[];
  session: string;
  color?: string;
}

export interface TaskResponse {
  message: string;
  task: Task;
}

// Task-related API methods
export const taskService = {
  /**
   * Get all tasks for a session
   * @param sessionId The ID of the session
   * @returns Array of tasks in the session
   */
  async getSessionTasks(sessionId: string): Promise<Task[]> {
    try {
      const response = await api.get(`/tasks/session/${sessionId}`);
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch session tasks:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch session tasks");
    }
  },

  /**
   * Get a task by its ID
   * @param taskId The ID of the task
   * @returns Task object
   */
  async getTaskById(taskId: string): Promise<Task> {
    try {
      const response = await api.get(`/tasks/${taskId}`);
      return response.data;
    } catch (error: any) {
      console.error("Failed to fetch task:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch task");
    }
  },

  /**
   * Create a new task
   * @param taskData The task data
   * @returns Created task object
   */
  async createTask(taskData: CreateTaskParams): Promise<Task> {
    try {
      const response = await api.post("/tasks", taskData);
      return response.data;
    } catch (error: any) {
      console.error("Failed to create task:", error);
      throw new Error(error.response?.data?.message || "Failed to create task");
    }
  },

  /**
   * Update a task
   * @param taskId The ID of the task to update
   * @param taskData The updated task data
   * @returns Updated task object
   */
  async updateTask(taskId: string, taskData: Partial<CreateTaskParams>): Promise<Task> {
    try {
      const response = await api.put(`/tasks/${taskId}`, taskData);
      return response.data;
    } catch (error: any) {
      console.error("Failed to update task:", error);
      throw new Error(error.response?.data?.message || "Failed to update task");
    }
  },

  /**
   * Delete a task
   * @param taskId The ID of the task to delete
   * @returns Object with success message
   */
  async deleteTask(taskId: string): Promise<{ message: string }> {
    try {
      const response = await api.delete(`/tasks/${taskId}`);
      return response.data;
    } catch (error: any) {
      console.error("Failed to delete task:", error);
      throw new Error(error.response?.data?.message || "Failed to delete task");
    }
  },

  /**
   * Assign members to a task
   * @param taskId The ID of the task
   * @param memberIds Array of member IDs to assign
   * @returns Updated task object
   */
  async assignMembers(taskId: string, memberIds: string[]): Promise<Task> {
    try {
      const response = await api.patch(`/tasks/${taskId}/assign`, {
        assignedMembers: memberIds,
      });
      return response.data;
    } catch (error: any) {
      console.error("Failed to assign members to task:", error);
      throw new Error(error.response?.data?.message || "Failed to assign members to task");
    }
  },

  /**
   * Toggle the completion status of a task
   * @param taskId The ID of the task
   * @returns Updated task object
   */
  async toggleTaskCompletion(taskId: string): Promise<Task> {
    try {
      // Get the current user role
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const isTeamLeader = user.role === 'team-leader';
      
      // Use different endpoint based on role
      const endpoint = isTeamLeader 
        ? `/tasks/${taskId}/toggle-completion-leader` 
        : `/tasks/${taskId}/complete`;
      
      const response = await api.patch<TaskResponse>(endpoint, {});
      return response.data.task;
    } catch (error: any) {
      console.error("Failed to toggle task completion:", error);
      
      // Check if there's a specific message from the server
      const errorMessage = error.response?.data?.message || "Failed to toggle task completion";
      
      // Log detailed error information for debugging
      if (error.response) {
        console.error("Server response:", {
          status: error.response.status,
          data: error.response.data
        });
      }
      
      throw new Error(errorMessage);
    }
  },
}; 