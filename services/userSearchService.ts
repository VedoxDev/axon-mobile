import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';

// User search interfaces
export interface SearchUser {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  status: string;
  fullName: string;
}

export interface UserSearchResponse {
  users: SearchUser[];
  total: number;
  query: string;
}

export class UserSearchService {
  // Search for users
  static async searchUsers(query: string, limit: number = 10): Promise<UserSearchResponse> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      if (query.length < 2) {
        throw new Error('Search query must be at least 2 characters');
      }

      const response = await axios.get(`${API_BASE_URL}/users/search`, {
        params: {
          q: query,
          limit: Math.min(limit, 50) // Max 50 as per API
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to search users', error);
      
      if (error.response?.status === 400) {
        throw new Error('Invalid search parameters. Query must be at least 2 characters.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      
      throw new Error(error.message || 'Failed to search users. Please try again.');
    }
  }
} 