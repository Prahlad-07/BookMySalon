/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-02-13
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../config/api';

const AuthContext = createContext();

const extractErrorMessage = (err, fallbackMessage) => {
  return err?.response?.data?.error || err?.response?.data?.message || err?.message || fallbackMessage;
};

const parseRole = (rawUser = {}) => {
  const directRole = rawUser.role || '';
  const roleList = String(directRole)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (roleList.includes('ADMIN')) return 'ADMIN';
  if (roleList.includes('SALON_OWNER')) return 'SALON_OWNER';
  if (roleList.includes('CUSTOMER')) return 'CUSTOMER';

  if (Array.isArray(rawUser.roles)) {
    if (rawUser.roles.includes('ROLE_ADMIN')) return 'ADMIN';
    if (rawUser.roles.includes('ROLE_SALON_OWNER')) return 'SALON_OWNER';
  }

  return 'CUSTOMER';
};

const normalizeUser = (rawUser = {}) => {
  const name = rawUser.name || rawUser.fullName || rawUser.username || '';
  const [firstName = '', ...rest] = name.trim().split(/\s+/);
  const lastName = rest.join(' ');

  return {
    id: rawUser.id,
    name,
    firstName,
    lastName,
    fullName: name,
    username: rawUser.username || '',
    email: rawUser.email || '',
    phone: rawUser.phone || '',
    role: parseRole(rawUser),
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
    }, 12000);

    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }

    return () => clearTimeout(safetyTimeout);
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/api/user/me');
      setUser(normalizeUser(response));
    } catch (err) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier, password) => {
    try {
      setError(null);

      if (!identifier || !password) {
        setError('Email/username and password are required');
        return false;
      }

      const normalizedIdentifier = identifier.trim();
      const response = await api.post('/api/auth/login', {
        usernameOrEmail: normalizedIdentifier,
        email: normalizedIdentifier,
        password,
      });

      const { token, refreshToken, id } = response || {};
      if (token) localStorage.setItem('accessToken', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      if (id) localStorage.setItem('userId', id);

      setUser(normalizeUser(response));
      return true;
    } catch (err) {
      const errorMessage = extractErrorMessage(err, 'Login failed. Please try again.');
      setError(errorMessage);
      return false;
    }
  };

  const signup = async (data) => {
    try {
      setError(null);

      if (!data || !data.email || !data.password || !data.name) {
        setError('All required fields must be filled');
        return false;
      }

      const name = data.name?.trim();
      const email = data.email?.trim().toLowerCase();
      const phone = data.phone?.trim();

      const signupPayload = {
        name,
        fullName: name,
        username: email.split('@')[0],
        email,
        phone,
        password: data.password,
        role: data.role,
      };

      await api.post('/api/auth/signup', signupPayload);
      return true;
    } catch (err) {
      const errorMessage = extractErrorMessage(err, 'Signup failed. Please try again.');
      setError(errorMessage);
      return false;
    }
  };

  const initiateSignupOtp = async (data) => {
    try {
      setError(null);
      if (!data || !data.email || !data.password || !data.name || !data.phone) {
        setError('Name, email, phone and password are required');
        return null;
      }

      const payload = {
        fullName: data.name.trim(),
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        password: data.password,
        role: data.role,
        username: data.email.trim().toLowerCase().split('@')[0],
      };

      const response = await api.post('/api/auth/signup/initiate', payload);
      return response;
    } catch (err) {
      const errorMessage = extractErrorMessage(err, 'Unable to send OTP. Please try again.');
      setError(errorMessage);
      return null;
    }
  };

  const resendSignupOtp = async (sessionToken) => {
    try {
      setError(null);
      return await api.post('/api/auth/signup/resend-otp', { sessionToken });
    } catch (err) {
      const errorMessage = extractErrorMessage(err, 'Unable to resend OTP. Please try again.');
      setError(errorMessage);
      return null;
    }
  };

  const verifySignupOtp = async (sessionToken, emailOtp, phoneOtp) => {
    try {
      setError(null);
      const response = await api.post('/api/auth/signup/verify-otp', {
        sessionToken,
        emailOtp,
        phoneOtp,
      });

      const { token, refreshToken, id } = response || {};
      if (token) localStorage.setItem('accessToken', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      if (id) localStorage.setItem('userId', id);
      setUser(normalizeUser(response));
      return true;
    } catch (err) {
      const errorMessage = extractErrorMessage(err, 'OTP verification failed.');
      setError(errorMessage);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        signup,
        initiateSignupOtp,
        resendSignupOtp,
        verifySignupOtp,
        logout,
        setUser,
      }}
    >
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
