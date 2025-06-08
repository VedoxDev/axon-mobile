import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';

// Task interfaces based on the API documentation
export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 1 | 2 | 3 | 4;
  status: 'todo' | 'in_progress' | 'done';
  dueDate?: string;
  order: number;
  project?: {
    id: string;
    name: string;
  };
  section?: {
    id: number;
    name: string;
  };
  createdBy: {
    id: string;
    nombre: string;
    apellidos: string;
  };
  assignees: Array<{
    id: string;
    nombre: string;
    apellidos: string;
  }>;
  labels: Array<{
    id: number;
    name: string;
    color: string;
  }>;
  subtasks: Array<{
    id: string;
    title: string;
    description?: string;
    completed: boolean;
    order: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

// Create task request interface
export interface CreateTaskRequest {
  title: string;
  description?: string;
  projectId?: string;
  sectionId?: number;
  assigneeIds?: string[];
  labelIds?: number[];
  priority?: 1 | 2 | 3 | 4;
  dueDate?: string;
  status?: 'todo' | 'in_progress' | 'done';
}

// Update task request interface
export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  sectionId?: number | null;
  assigneeIds?: string[];
  labelIds?: number[];
  priority?: 1 | 2 | 3 | 4;
  dueDate?: string;
  status?: 'todo' | 'in_progress' | 'done';
}

// Subtask interfaces
export interface CreateSubtaskRequest {
  title: string;
  description?: string;
  order?: number;
}

export interface UpdateSubtaskRequest {
  title?: string;
  description?: string;
  completed?: boolean;
}

// Label interfaces
export interface Label {
  id: number;
  name: string;
  color: string;
}

export interface CreateLabelRequest {
  name: string;
  color: string;
}

export interface UpdateLabelRequest {
  name?: string;
  color?: string;
}

// Task service class to handle all task-related API calls
export class TaskService {
  // Create a new task
  static async createTask(taskData: CreateTaskRequest): Promise<Task> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post(`${API_BASE_URL}/tasks`, taskData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to create task', error);
      
      if (error.response?.status === 400) {
        throw new Error('Invalid task data. Please check all required fields.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to create tasks in this project.');
      } else if (error.response?.status === 404) {
        throw new Error('Project or section not found.');
      }
      
      throw new Error('Failed to create task. Please try again.');
    }
  }

  // Get personal tasks
  static async getPersonalTasks(): Promise<Task[]> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_BASE_URL}/tasks/personal`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch personal tasks', error);
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      
      throw new Error('Failed to fetch personal tasks. Please try again.');
    }
  }

  // Get project tasks
  static async getProjectTasks(projectId: string): Promise<Task[]> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_BASE_URL}/tasks/project/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch project tasks', error);
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to view tasks in this project.');
      } else if (error.response?.status === 404) {
        throw new Error('Project not found.');
      }
      
      throw new Error('Failed to fetch project tasks. Please try again.');
    }
  }

  // Get section tasks
  static async getSectionTasks(projectId: string, sectionId: number): Promise<Task[]> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_BASE_URL}/tasks/project/${projectId}/section/${sectionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch section tasks', error);
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to view tasks in this section.');
      } else if (error.response?.status === 404) {
        throw new Error('Project or section not found.');
      }
      
      throw new Error('Failed to fetch section tasks. Please try again.');
    }
  }

  // Get task by ID
  static async getTaskById(taskId: string): Promise<Task> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_BASE_URL}/tasks/${taskId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch task', error);
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to view this task.');
      } else if (error.response?.status === 404) {
        throw new Error('Task not found.');
      }
      
      throw new Error('Failed to fetch task. Please try again.');
    }
  }

  // Update task
  static async updateTask(taskId: string, updateData: UpdateTaskRequest): Promise<Task> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.put(`${API_BASE_URL}/tasks/${taskId}`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to update task', error);
      
      if (error.response?.status === 400) {
        throw new Error('Invalid task data. Please check all fields.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to update this task.');
      } else if (error.response?.status === 404) {
        throw new Error('Task not found.');
      }
      
      throw new Error('Failed to update task. Please try again.');
    }
  }

  // Delete task
  static async deleteTask(taskId: string): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      await axios.delete(`${API_BASE_URL}/tasks/${taskId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error: any) {
      console.error('Failed to delete task', error);
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to delete this task.');
      } else if (error.response?.status === 404) {
        throw new Error('Task not found.');
      }
      
      throw new Error('Failed to delete task. Please try again.');
    }
  }

  // Subtask methods
  static async createSubtask(taskId: string, subtaskData: CreateSubtaskRequest): Promise<Task> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post(`${API_BASE_URL}/tasks/${taskId}/subtasks`, subtaskData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to create subtask', error);
      
      if (error.response?.status === 400) {
        throw new Error('Invalid subtask data.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to create subtasks for this task.');
      } else if (error.response?.status === 404) {
        throw new Error('Task not found.');
      }
      
      throw new Error('Failed to create subtask. Please try again.');
    }
  }

  static async updateSubtask(taskId: string, subtaskId: string, updateData: UpdateSubtaskRequest): Promise<Task> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.put(`${API_BASE_URL}/tasks/${taskId}/subtasks/${subtaskId}`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to update subtask', error);
      
      if (error.response?.status === 400) {
        throw new Error('Invalid subtask data.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to update this subtask.');
      } else if (error.response?.status === 404) {
        throw new Error('Task or subtask not found.');
      }
      
      throw new Error('Failed to update subtask. Please try again.');
    }
  }

  static async deleteSubtask(taskId: string, subtaskId: string): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      await axios.delete(`${API_BASE_URL}/tasks/${taskId}/subtasks/${subtaskId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error: any) {
      console.error('Failed to delete subtask', error);
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to delete this subtask.');
      } else if (error.response?.status === 404) {
        throw new Error('Task or subtask not found.');
      }
      
      throw new Error('Failed to delete subtask. Please try again.');
    }
  }

  // Label methods
  static async getProjectLabels(projectId: string): Promise<Label[]> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_BASE_URL}/tasks/projects/${projectId}/labels`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch project labels', error);
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to view labels in this project.');
      } else if (error.response?.status === 404) {
        throw new Error('Project not found.');
      }
      
      throw new Error('Failed to fetch project labels. Please try again.');
    }
  }

  static async createProjectLabel(projectId: string, labelData: CreateLabelRequest): Promise<Label> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post(`${API_BASE_URL}/tasks/projects/${projectId}/labels`, labelData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to create label', error);
      
      if (error.response?.status === 400) {
        throw new Error('Invalid label data.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to create labels in this project.');
      } else if (error.response?.status === 404) {
        throw new Error('Project not found.');
      }
      
      throw new Error('Failed to create label. Please try again.');
    }
  }

  static async updateProjectLabel(projectId: string, labelId: number, updateData: UpdateLabelRequest): Promise<Label> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.put(`${API_BASE_URL}/tasks/projects/${projectId}/labels/${labelId}`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to update label', error);
      
      if (error.response?.status === 400) {
        throw new Error('Invalid label data.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to update labels in this project.');
      } else if (error.response?.status === 404) {
        throw new Error('Project or label not found.');
      }
      
      throw new Error('Failed to update label. Please try again.');
    }
  }

  static async deleteProjectLabel(projectId: string, labelId: number): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      await axios.delete(`${API_BASE_URL}/tasks/projects/${projectId}/labels/${labelId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error: any) {
      console.error('Failed to delete label', error);
      
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to delete labels in this project.');
      } else if (error.response?.status === 404) {
        throw new Error('Project or label not found.');
      }
      
      throw new Error('Failed to delete label. Please try again.');
    }
  }
} 