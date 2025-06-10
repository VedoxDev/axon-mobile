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
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean; // To indicate if the auth state is being loaded (e.g., from storage)
  isAuthTransitioning: boolean; // To indicate if we're transitioning after successful auth
  justLoggedIn: boolean; // New state to indicate if a fresh login just occurred
  setJustLoggedIn: React.Dispatch<React.SetStateAction<boolean>>; // Add setJustLoggedIn to context type
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
  const [isAuthTransitioning, setIsAuthTransitioning] = useState(false); // New state for auth transitions
  const [justLoggedIn, setJustLoggedIn] = useState(false); // New state for fresh login

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
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { 
        email, 
        password 
      });
      
      const { access_token } = response.data;
      
      // Set transition loading before updating auth state
      setIsAuthTransitioning(true);
      
      // Store token and update state
      await AsyncStorage.setItem('access_token', access_token);
      setToken(access_token);
      
      // Fetch user data after successful login
      await fetchUser(access_token);

      // Set justLoggedIn to true after successful login
      setJustLoggedIn(true);

      // Small delay to ensure smooth transition
      setTimeout(() => {
        setIsAuthTransitioning(false);
      }, 500);
      
    } catch (error: any) {
      console.error('Login failed', error);
      
      // Handle specific error cases
      if (error.response) {
        const authError: AuthError = error.response.data;
        
        if (error.response.status === 400) {
          // Invalid input format or missing fields
          throw new Error('Entrada inválida. Por favor verifica tu email y contraseña.');
        } else if (error.response.status === 401 && authError.message === 'invalid-credentials') {
          // Invalid credentials
          throw new Error('Email o contraseña incorrectos. Por favor inténtalo de nuevo.');
        }
      }
      
      // Generic error for network issues or other problems
      throw new Error('Error de inicio de sesión. Por favor verifica tu conexión e inténtalo de nuevo.');
    }
  };

  // Register function
  const register = async (email: string, nombre: string, apellidos: string, password: string) => { // Added types
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
            throw new Error('Ya existe una cuenta con este email. Por favor intenta iniciar sesión.');
          } else {
            // Invalid input format or missing fields
            throw new Error('Entrada inválida. Por favor verifica todos los campos e inténtalo de nuevo.');
          }
        }
      }
      
      // Generic error for network issues or other problems
      throw new Error('Error de registro. Por favor verifica tu conexión e inténtalo de nuevo.');
    }
  };

  // Change password function
  const changePassword = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    try {
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.put(`${API_BASE_URL}/auth/change-password`, {
        currentPassword,
        newPassword,
        confirmPassword
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Password changed successfully', response.data);
      
    } catch (error: any) {
      console.error('Change password failed', error);
      
      // Handle specific error cases
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message;
        
        if (status === 401) {
          if (message === 'current-password-incorrect') {
            throw new Error('La contraseña actual es incorrecta');
          } else if (message === 'user-not-found') {
            throw new Error('Usuario no encontrado');
          } else {
            throw new Error('No autorizado. Por favor inicia sesión de nuevo.');
          }
        } else if (status === 400) {
          if (Array.isArray(message)) {
            // Handle validation errors
            const errorMessages = message.map((msg: string) => {
              switch (msg) {
                case 'current-password-required':
                  return 'La contraseña actual es requerida';
                case 'new-password-required':
                  return 'La nueva contraseña es requerida';
                case 'confirm-password-required':
                  return 'La confirmación de contraseña es requerida';
                case 'new-password-too-short':
                  return 'La nueva contraseña es muy corta';
                case 'new-password-too-weak (needs uppercase, number, symbol)':
                  return 'La nueva contraseña necesita mayúscula, número y símbolo';
                case 'new-password-invalid-characters':
                  return 'La nueva contraseña contiene caracteres inválidos';
                default:
                  return msg;
              }
            });
            throw new Error(errorMessages.join(', '));
          } else if (message === 'passwords-do-not-match') {
            throw new Error('Las contraseñas no coinciden');
          } else if (message === 'new-password-must-be-different') {
            throw new Error('La nueva contraseña debe ser diferente a la actual');
          } else {
            throw new Error('Datos inválidos. Por favor verifica todos los campos.');
          }
        }
      }
      
      // Generic error for network issues or other problems
      throw new Error('Error al cambiar la contraseña. Por favor verifica tu conexión e inténtalo de nuevo.');
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Set transition loading before clearing auth state
      setIsAuthTransitioning(true);
      
      // Clear token from storage and state
      await AsyncStorage.removeItem('access_token');
      setToken(null);
      setUser(null);
      
      // Small delay to ensure smooth transition
      setTimeout(() => {
        setIsAuthTransitioning(false);
      }, 500);
      
    } catch (error) {
      console.error('Logout failed', error);
      // Reset transition state even if logout fails
      setIsAuthTransitioning(false);
    }
  };

  // Provide the context value to children components
  const contextValue: AuthContextType = {
    user,
    token,
    login,
    register,
    changePassword,
    logout,
    isLoading,
    isAuthTransitioning,
    justLoggedIn,
    setJustLoggedIn, // Add setJustLoggedIn to context value
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

// Add default export to fix route warning
export default AuthProvider; 