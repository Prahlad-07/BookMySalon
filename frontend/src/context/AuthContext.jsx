import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../config/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setLoading(false);
        return;
      }
      const response = await api.get(`/api/auth/user/${userId}`);
      setUser(response.data.data);
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userId');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      
      // Validate input
      if (!email || !password) {
        setError('Email and password are required');
        return false;
      }

      const response = await api.post('/api/auth/login', { email, password });
      const { id, name, email: userEmail, role } = response.data.data;
      
      localStorage.setItem('accessToken', response.data.data.token || 'token');
      localStorage.setItem('userId', id);
      setUser({ id, name, email: userEmail, role });
      
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          'Login failed. Please try again.';
      setError(errorMessage);
      console.error('Login error:', err);
      return false;
    }
  };

  const signup = async (data) => {
    try {
      setError(null);
      
      // Validate input
      if (!data || !data.email || !data.password || !data.name) {
        setError('All required fields must be filled');
        return false;
      }

      const response = await api.post('/api/auth/signup', data);
      const { id, name, email: userEmail, role } = response.data.data;
      
      localStorage.setItem('accessToken', response.data.data.token || 'token');
      localStorage.setItem('userId', id);
      setUser({ id, name, email: userEmail, role });
      
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          'Signup failed. Please try again.';
      setError(errorMessage);
      console.error('Signup error:', err);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, signup, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
