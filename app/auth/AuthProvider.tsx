import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios'; // Import axios
import { API_BASE_URL } from '../../config/apiConfig'; // Import the base URL

// Define the shape of the authentication context
interface AuthContextType {
  user: User | null; // Use User type
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, nombre: string, apellidos: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean; // To indicate if the auth state is being loaded (e.g., from storage)
}

// Define a basic User interface based on the /auth/me response
interface User {
  id: string;
  email: string;
  nombre: string;
  apellidos: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Define error interfaces for better error handling
interface AuthError {
  statusCode: number;
  message: string;
  error: string;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the AuthProvider component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null); // Use User type
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as true because we need to check storage

  // Function to fetch user details using the token
  const fetchUser = async (authToken: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setUser(response.data);
    } catch (error: any) {
      console.error('Failed to fetch user data', error);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        // Token is invalid or expired, clear stored token
        console.log('Token is invalid or expired, logging out');
        await AsyncStorage.removeItem('access_token');
        setToken(null);
        setUser(null);
      } else if (error.response?.status === 404) {
        // User not found but token is valid (rare case)
        console.log('User not found for valid token');
        await AsyncStorage.removeItem('access_token');
        setToken(null);
        setUser(null);
      }
      
      throw error; // Re-throw to indicate fetch failure
    }
  };

  // Effect to load the token from storage on app start and fetch user
  useEffect(() => {
    const loadTokenAndUser = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('access_token');
        if (storedToken) {
          setToken(storedToken);
          await fetchUser(storedToken); // Fetch user data with the stored token
        }
      } catch (error) {
        console.error('Failed to load token or fetch user', error);
        // If there's an error loading or fetching, clear everything
        await AsyncStorage.removeItem('access_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadTokenAndUser();
  }, []);

  // Login function
  const login = async (email: string, password: string) => { // Added types
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { 
        email, 
        password 
      });
      
      const { access_token } = response.data;
      
      // Store token and update state
      await AsyncStorage.setItem('access_token', access_token);
      setToken(access_token);
      
      // Fetch user data after successful login
      await fetchUser(access_token);
      
    } catch (error: any) {
      console.error('Login failed', error);
      
      // Handle specific error cases
      if (error.response) {
        const authError: AuthError = error.response.data;
        
        if (error.response.status === 400) {
          // Invalid input format or missing fields
          throw new Error('Invalid input. Please check your email and password.');
        } else if (error.response.status === 401 && authError.message === 'invalid-credentials') {
          // Invalid credentials
          throw new Error('Invalid email or password. Please try again.');
        }
      }
      
      // Generic error for network issues or other problems
      throw new Error('Login failed. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (email: string, nombre: string, apellidos: string, password: string) => { // Added types
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, { 
        email, 
        nombre, 
        apellidos, 
        password 
      });
      
      console.log('Registration successful', response.data);
      
      // Automatically log in the user after successful registration
      await login(email, password);
      
    } catch (error: any) {
      console.error('Registration failed', error);
      
      // Handle specific error cases
      if (error.response) {
        const authError: AuthError = error.response.data;
        
        if (error.response.status === 400) {
          if (authError.message === 'email-already-exists') {
            throw new Error('An account with this email already exists. Please try logging in instead.');
          } else {
            // Invalid input format or missing fields
            throw new Error('Invalid input. Please check all fields and try again.');
          }
        }
      }
      
      // Generic error for network issues or other problems
      throw new Error('Registration failed. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    try {
      // Clear token from storage and state
      await AsyncStorage.removeItem('access_token');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
       setIsLoading(false);
    }
  };

  // Provide the context value to children components
  const contextValue: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {isLoading ? (
        // Show a loading indicator while checking storage/fetching user
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 