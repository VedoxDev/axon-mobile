import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';

// User search result interface
export interface UserSearchResult {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  status: string;
  fullName: string;
}

// User search response interface
export interface UserSearchResponse {
  users: UserSearchResult[];
  total: number;
  query: string;
}

// User profile interfaces based on the comprehensive API
export interface UserProfileStats {
  totalProjects: number;
  ownerProjects: number;
  adminProjects: number;
  memberProjects: number;
  tasksCreated: number;
  tasksAssigned: number;
  tasksCompleted: number;
  tasksPending: number;
  tasksInProgress: number;
  completionRate: number;
  messagesSent: number;
  directConversations: number;
  callsParticipated: number;
  callsInitiated: number;
  invitationsSent: number;
  invitationsReceived: number;
  invitationsAccepted: number;
  invitationsPending: number;
  invitationAcceptanceRate: number;
}

export interface UserProfileActivity {
  type: 'task' | 'message' | 'call';
  action: string;
  title: string;
  project?: string;
  recipient?: string;
  timestamp: string;
  status?: string;
}

export interface UserProfileProject {
  id: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
  taskCount: number;
  messageCount: number;
}

export interface UserProfileInsights {
  mostActiveProject: string | null;
  averageTasksPerProject: number;
  peakActivityType: 'communication' | 'task_management';
  collaborationScore: number;
  leadershipScore: number;
}

export interface UserProfile {
  id: string;
  email: string;
  nombre: string;
  apellidos: string;
  fullName: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  memberSince: string;
  lastActive: string;
  stats: UserProfileStats;
  recentActivity: UserProfileActivity[];
  projects: UserProfileProject[];
  insights: UserProfileInsights;
}

export class UserService {
  // Search for users
  static async searchUsers(query: string, limit: number = 10): Promise<UserSearchResponse> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_BASE_URL}/users/search`, {
        params: { q: query, limit },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to search users', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to search users.');
      } else if (error.response?.status === 500) {
        throw new Error('Server error. Please try again later.');
      }
      
      // Generic error for network issues or other problems
      throw new Error('Failed to search users. Please check your connection and try again.');
    }
  }

  // Get current user's comprehensive profile
  static async getMyProfile(): Promise<UserProfile> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_BASE_URL}/auth/me/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch user profile', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 404) {
        throw new Error('User profile not found.');
      } else if (error.response?.status === 500) {
        throw new Error('Server error. Please try again later.');
      }
      
      // Generic error for network issues or other problems
      throw new Error('Failed to fetch profile. Please check your connection and try again.');
    }
  }

  // Get any user's comprehensive profile
  static async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_BASE_URL}/users/${userId}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch user profile', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 404) {
        throw new Error('User not found.');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid user ID.');
      } else if (error.response?.status === 500) {
        throw new Error('Server error. Please try again later.');
      }
      
      // Generic error for network issues or other problems
      throw new Error('Failed to fetch user profile. Please check your connection and try again.');
    }
  }
} 