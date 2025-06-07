import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/apiConfig';

// Section interface based on the API response
export interface Section {
  id: number;
  name: string;
  order: number;
  project: {
    id: string;
  };
}

// Create section request interface
export interface CreateSectionRequest {
  name: string;
  order?: number;
}

// Update section request interface
export interface UpdateSectionRequest {
  name?: string;
  order?: number;
}

// Reorder sections request interface
export interface ReorderSectionsRequest {
  sectionIds: number[];
}

// Section service class to handle all section-related API calls
export class SectionService {
  // Get all sections for a project
  static async getSections(projectId: string): Promise<Section[]> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/sections`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch sections', error);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        throw new Error('Project not found');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to view this project');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      
      throw new Error('Failed to fetch sections. Please try again.');
    }
  }

  // Create a new section
  static async createSection(projectId: string, sectionData: CreateSectionRequest): Promise<Section> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post(`${API_BASE_URL}/projects/${projectId}/sections`, sectionData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('Failed to create section', error);
      
      // Handle specific error cases
      if (error.response?.status === 409) {
        throw new Error('A section with this name already exists');
      } else if (error.response?.status === 404) {
        throw new Error('Project not found');
      } else if (error.response?.status === 400) {
        const message = error.response.data?.message;
        if (message === 'name-too-short') {
          throw new Error('Section name is too short');
        } else if (message === 'name-too-large') {
          throw new Error('Section name is too long');
        }
        throw new Error('Invalid section data');
      }
      
      throw new Error('Failed to create section. Please try again.');
    }
  }

  // Update a section
  static async updateSection(projectId: string, sectionId: number, updateData: UpdateSectionRequest): Promise<Section> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.put(
        `${API_BASE_URL}/projects/${projectId}/sections/${sectionId}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Failed to update section', error);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        throw new Error('Section not found');
      } else if (error.response?.status === 409) {
        throw new Error('A section with this name already exists');
      }
      
      throw new Error('Failed to update section. Please try again.');
    }
  }

  // Reorder sections
  static async reorderSections(projectId: string, sectionIds: number[]): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('SectionService.reorderSections called with:');
      console.log('- projectId:', projectId);
      console.log('- sectionIds:', sectionIds);
      console.log('- sectionIds types:', sectionIds.map(id => typeof id));

      const requestBody = { sectionIds };
      console.log('Request body:', JSON.stringify(requestBody, null, 2));

      const response = await axios.put(
        `${API_BASE_URL}/projects/${projectId}/sections/reorder`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('Reorder response:', response.data);
    } catch (error: any) {
      console.error('Failed to reorder sections', error);
      console.error('Request URL:', `${API_BASE_URL}/projects/${projectId}/sections/reorder`);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        throw new Error('Some sections were not found');
      } else if (error.response?.status === 400) {
        const message = error.response?.data?.message || 'Invalid section order';
        throw new Error(`Bad request: ${message}`);
      }
      
      throw new Error('Failed to reorder sections. Please try again.');
    }
  }

  // Delete a section
  static async deleteSection(projectId: string, sectionId: number): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      await axios.delete(`${API_BASE_URL}/projects/${projectId}/sections/${sectionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error: any) {
      console.error('Failed to delete section', error);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        throw new Error('Section not found');
      }
      
      throw new Error('Failed to delete section. Please try again.');
    }
  }
}

// Utility function to generate colors for sections
export const generateSectionColor = (sectionId: number, index: number): string => {
  const colors = [
    '#42A5F5', // Blue
    '#FFB74D', // Orange
    '#4CAF50', // Green
    '#AB47BC', // Purple
    '#FF7043', // Deep Orange
    '#26A69A', // Teal
    '#EC407A', // Pink
    '#5C6BC0', // Indigo
  ];
  
  return colors[index % colors.length];
}; 