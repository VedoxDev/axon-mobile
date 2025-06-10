import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';

// Define the project interface based on the API response
export interface ProjectResponse {
  id: string; // The UUID of the project
  name: string; // The name of the project
  description: string; // The description of the project
  status: string; // The current status of the project (e.g., "active", "completed")
  role: "owner" | "admin" | "member"; // The role of the authenticated user in this project
}

// Create project request interface
export interface CreateProjectRequest {
  name: string; // The name of the new project (required)
  description?: string; // An optional description for the project
  status?: string; // An optional initial status for the project
}

// Create project response interface
export interface CreateProjectResponse {
  message: string; // A success message, e.g., "project-created-succesfully"
  id: string; // The UUID of the newly created project
}

// Extended project interface for UI purposes (adds color)
export interface Project extends ProjectResponse {
  color: string; // Generated color for UI
}

// Invitation request interface
export interface InviteUserRequest {
  userId?: string; // The UUID of the user to invite (optional if email is provided)
  email?: string; // The email of the user to invite (optional if userId is provided)
}

// Invitation response interface
export interface InviteUserResponse {
  message: string; // Success message, e.g., "invitation-sent-successfully"
  invitationId: string; // The UUID of the invitation
  userId: string; // The UUID of the invited user
}

// Project member interface
export interface ProjectMember {
  id: string; // User UUID
  nombre: string; // First name
  apellidos: string; // Last name
  role: "owner" | "admin" | "member"; // User's role in the project
  status: "online" | "offline"; // User's current status
}

// Change member role request interface
export interface ChangeMemberRoleRequest {
  role: "member" | "admin"; // New role for the member
}

// Change member role response interface
export interface ChangeMemberRoleResponse {
  message: string; // Success message
  memberId: string; // ID of the member whose role was changed
  newRole: "member" | "admin"; // The new role
  memberName: string; // Name of the member
}

// Project service class to handle all project-related API calls
export class ProjectService {
  // Get all projects for the authenticated user
  static async getMyProjects(): Promise<ProjectResponse[]> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_BASE_URL}/projects/mine`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch projects', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to access projects.');
      } else if (error.response?.status === 500) {
        throw new Error('Server error. Please try again later.');
      }
      
      // Generic error for network issues or other problems
      throw new Error('Failed to fetch projects. Please check your connection and try again.');
    }
  }

  // Create a new project
  static async createProject(projectData: CreateProjectRequest): Promise<CreateProjectResponse> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post(`${API_BASE_URL}/projects`, projectData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to create project', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        throw new Error('Invalid project data. Please check all required fields.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to create projects.');
      } else if (error.response?.status === 500) {
        throw new Error('Server error. Please try again later.');
      }
      
      // Generic error for network issues or other problems
      throw new Error('Failed to create project. Please check your connection and try again.');
    }
  }

  // Invite a user to a project
  static async inviteUserToProject(projectId: string, inviteData: InviteUserRequest): Promise<InviteUserResponse> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post(`${API_BASE_URL}/projects/${projectId}/invite`, inviteData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to invite user to project', error);
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        throw new Error('Invalid invitation data. Please check the user information.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to invite users to this project.');
      } else if (error.response?.status === 404) {
        throw new Error('Project or user not found.');
      } else if (error.response?.status === 409) {
        throw new Error('User is already a member of this project.');
      } else if (error.response?.status === 500) {
        throw new Error('Server error. Please try again later.');
      }
      
      // Generic error for network issues or other problems
      throw new Error('Failed to send invitation. Please check your connection and try again.');
    }
  }

  // Get project members for task assignment
  static async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_BASE_URL}/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data.members || [];
    } catch (error: any) {
      console.error('Failed to fetch project members', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to view this project.');
      } else if (error.response?.status === 404) {
        throw new Error('Project not found.');
      } else if (error.response?.status === 500) {
        throw new Error('Server error. Please try again later.');
      }
      
      // Generic error for network issues or other problems
      throw new Error('Failed to fetch project members. Please check your connection and try again.');
    }
  }

  // Change a project member's role (owner only)
  static async changeMemberRole(projectId: string, memberId: string, newRole: "member" | "admin"): Promise<ChangeMemberRoleResponse> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.put(`${API_BASE_URL}/projects/${projectId}/members/${memberId}/role`, 
        { role: newRole }, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Failed to change member role', error);
      
      // Handle specific error cases based on API documentation
      if (error.response?.status === 400) {
        const message = error.response?.data?.message;
        if (message === 'cannot-change-owner-role') {
          throw new Error('No se puede cambiar el rol del propietario del proyecto.');
        } else if (message === 'cannot-change-own-role') {
          throw new Error('No puedes cambiar tu propio rol.');
        } else if (message?.includes('role-must-be-member-or-admin')) {
          throw new Error('El rol debe ser "miembro" o "administrador".');
        }
        throw new Error('Datos de rol inválidos. Por favor verifica la información.');
      } else if (error.response?.status === 401) {
        throw new Error('Autenticación fallida. Por favor inicia sesión de nuevo.');
      } else if (error.response?.status === 403) {
        const message = error.response?.data?.message;
        if (message === 'only-owner-can-change-roles') {
          throw new Error('Solo el propietario del proyecto puede cambiar roles.');
        }
        throw new Error('No tienes permisos para cambiar roles en este proyecto.');
      } else if (error.response?.status === 404) {
        const message = error.response?.data?.message;
        if (message === 'project-not-found') {
          throw new Error('Proyecto no encontrado.');
        } else if (message === 'member-not-found') {
          throw new Error('Miembro no encontrado en el proyecto.');
        }
        throw new Error('Proyecto o miembro no encontrado.');
      } else if (error.response?.status === 500) {
        throw new Error('Error del servidor. Por favor inténtalo de nuevo más tarde.');
      }
      
      // Generic error for network issues or other problems
      throw new Error('Error al cambiar el rol del miembro. Por favor verifica tu conexión e inténtalo de nuevo.');
    }
  }
}

// Utility function to generate colors for projects (since API doesn't provide colors)
export const generateProjectColor = (projectId: string): string => {
  const colors = [
    '#FFB3BA', // Light pink
    '#BAFFC9', // Light green
    '#BAE1FF', // Light blue
    '#FFFFBA', // Light yellow
    '#FFDFBA', // Light orange
    '#E1BAFF', // Light purple
    '#FFCCCB', // Light coral
    '#B3E5D1', // Light mint
    '#D4EDDA', // Light sage
    '#F8F9FA', // Light gray
  ];
  
  // Use project ID to consistently generate the same color for the same project
  let hash = 0;
  for (let i = 0; i < projectId.length; i++) {
    const char = projectId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return colors[Math.abs(hash) % colors.length];
}; 