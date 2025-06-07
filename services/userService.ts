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
} 