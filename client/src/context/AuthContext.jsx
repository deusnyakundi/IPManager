import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Function to check authentication status
    const checkAuth = async () => {
        try {
            const userResponse = await api.get('/auth/me');
            setUser(userResponse.data);
            setIsAuthenticated(true);
        } catch (error) {
            console.log('Auth check failed:', error);
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    // Check auth status when the app loads
    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (credentials) => {
        try {
            const response = await api.post('/auth/login', credentials);
            if (!response.data.requiresOTP) {
                setUser(response.data.user);
                setIsAuthenticated(true);
            }
            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            setIsAuthenticated(false);
            window.location.href = '/login';
        }
    };

    const verifyOTP = async (userId, otp) => {
        try {
            const response = await api.post('/auth/verify-otp', { userId, otp });
            if (response.data.user) {
                setUser(response.data.user);
                setIsAuthenticated(true);
            }
            return response.data;
        } catch (error) {
            console.error('OTP verification error:', error);
            throw error;
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, logout, verifyOTP }}>
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

