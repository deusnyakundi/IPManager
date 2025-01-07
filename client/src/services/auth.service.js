import api from '../utils/api';
import { clearCSRFToken, refreshCSRFToken } from '../utils/csrf';

export const refreshTokens = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post('/auth/refresh', { refreshToken });
    const { accessToken, newRefreshToken } = response.data;

    // Update tokens in localStorage
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', newRefreshToken);

    // Refresh CSRF token as well
    await refreshCSRFToken();

    return { accessToken, refreshToken: newRefreshToken };
  } catch (error) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    clearCSRFToken();
    throw error;
  }
};

export const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  const { accessToken, refreshToken } = response.data;
  
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  
  // Get initial CSRF token after login
  await refreshCSRFToken();
  
  return response.data;
};

export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } finally {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    clearCSRFToken();
  }
};

export const verifySession = async () => {
  try {
    const response = await api.get('/auth/verify');
    // Check if we need to refresh the CSRF token
    if (response.headers['x-csrf-token']) {
      await refreshCSRFToken();
    }
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      clearCSRFToken();
    }
    throw error;
  }
}; 