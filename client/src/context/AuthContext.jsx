import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { checkSessionTimeout } from '../utils/sessionManager';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    // Check for session timeout
    if (checkSessionTimeout()) {
      handleLogout('Your session has expired. Please log in again.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth check failed:', error);
      handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogin = async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { token, refreshToken, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('lastActivity', new Date().getTime().toString());
      
      setUser(userData);
      setIsAuthenticated(true);
      
      // Redirect based on force password change
      if (userData.force_password_change) {
        navigate(`/change-password/${userData.id}`);
      } else {
        navigate('/');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  const handleLogout = (message = '') => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    setUser(null);
    setIsAuthenticated(false);
    
    navigate('/login', message ? {
      state: {
        message,
        severity: message.includes('expired') ? 'warning' : 'info'
      }
    } : undefined);
  };

  const handleSessionTimeout = () => {
    handleLogout('Your session has expired. Please log in again.');
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login: handleLogin,
    logout: handleLogout,
    handleSessionTimeout,
  };

  if (isLoading) {
    return null; // or a loading spinner
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

