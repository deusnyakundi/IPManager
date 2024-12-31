import React, { createContext, useContext, useState } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // User state: Stores the authenticated user's information
  const [user, setUser] = useState(null); // Removed localStorage initialization
  const [token, setToken] = useState(null); // Store access token in memory only
  const [loading, setLoading] = useState(false); // Manage loading state
  const [error, setError] = useState(null); // Manage errors

  // Login function: Handles authentication and updates state
  const login = async (credentials) => {
    try {
      setLoading(true); // Set loading state
      setError(null); // Reset error state

      const response = await api.post('/auth/login', credentials); // API call to login
      const { accessToken, user } = response.data; // Receive accessToken and user info from backend

      setToken(accessToken); // Store access token in memory
      setUser(user); // Update user state

      return true; // Indicate success
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed'); // Handle error response
      return false; // Indicate failure
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  // Logout function: Clears user and token state
  const logout = () => {
    setToken(null); // Clear token from memory
    setUser(null); // Clear user information
  };

  // Function to refresh the access token
  const refreshToken = async (currentRefreshToken) => {
    try {
      const response = await api.post('/auth/refresh', { refreshToken: currentRefreshToken }); // API call to refresh token
      const { accessToken } = response.data; // Receive new access token

      setToken(accessToken); // Update access token in memory
    } catch (err) {
      console.error('Failed to refresh token:', err.response?.data?.error || err.message);
      logout(); // Logout on refresh token failure
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        logout,
        refreshToken, // Expose refresh token functionality
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to access Auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
