import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from './SocketContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket() || {};

  // Helper to determine destination dashboard by role
  const getDashboardRoute = (targetUser) => {
    const role = targetUser?.role || user?.role;
    switch (role) {
      case 'SUPER_ADMIN':
        return '/super-admin';
      case 'ADMIN':
        return '/admin';
      case 'DRIVER':
        return '/driver';
      case 'CITIZEN':
      default:
        return '/citizen';
    }
  };

  // Verify and refresh session on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('[Auth] Stored session invalid or expired. Logging out.');
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Synchronize WebSocket rooms upon authentication
  useEffect(() => {
    if (socket && user) {
      socket.emit('join_user_room', user.id || user._id);
      if (user.wardName) {
        socket.emit('join_ward_room', user.wardName);
      }
    }
  }, [socket, user]);

  // Establish session helper
  const establishSession = (receivedToken, receivedUser) => {
    setToken(receivedToken);
    setUser(receivedUser);
    localStorage.setItem('token', receivedToken);
    localStorage.setItem('user', JSON.stringify(receivedUser));
  };

  // Citizen Authentication via Email + Password
  const loginCitizen = async (email, password) => {
    const res = await api.post('/auth/login-citizen', { email, password });
    if (res.data.success && res.data.token) {
      establishSession(res.data.token, res.data.user);
    }
    return res.data;
  };

  // Verify Citizen Monthly ~30-Day OTP
  const verifyMonthlyOtp = async (email, otp) => {
    const res = await api.post('/auth/verify-monthly-otp', { email, otp });
    if (res.data.success && res.data.token) {
      establishSession(res.data.token, res.data.user);
    }
    return res.data;
  };

  // Request Staff Login OTP (Driver / Admin / Super Admin)
  const sendStaffOtp = async (email, expectedPortal) => {
    const res = await api.post('/auth/send-staff-otp', { email, expectedPortal });
    return res.data;
  };

  // Verify Staff Login OTP
  const verifyStaffOtp = async (email, otp, expectedPortal) => {
    const res = await api.post('/auth/verify-staff-otp', { email, otp, expectedPortal });
    if (res.data.success && res.data.token) {
      establishSession(res.data.token, res.data.user);
    }
    return res.data;
  };

  // Step 1: Initiate Public Citizen Registration
  const initiateRegister = async (citizenData) => {
    const res = await api.post('/auth/register/initiate', citizenData);
    return res.data;
  };

  // Step 2: Verify Registration OTP and Activate Citizen Account
  const verifyRegister = async (email, otp) => {
    const res = await api.post('/auth/register/verify', { email, otp });
    if (res.data.success && res.data.token) {
      establishSession(res.data.token, res.data.user);
    }
    return res.data;
  };

  // Citizen Password Recovery
  const forgotPassword = async (email) => {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  };

  const resetPassword = async (email, otp, newPassword) => {
    const res = await api.post('/auth/reset-password', { email, otp, newPassword });
    return res.data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUserProfile = async (updatedData) => {
    const res = await api.put('/auth/profile', updatedData);
    if (res.data.success) {
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      return { success: true, user: res.data.user };
    }
    return { success: false, message: res.data.message };
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.error('[Auth] Failed to refresh user profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        loginCitizen,
        verifyMonthlyOtp,
        sendStaffOtp,
        verifyStaffOtp,
        initiateRegister,
        verifyRegister,
        forgotPassword,
        resetPassword,
        logout,
        updateUserProfile,
        refreshUser,
        getDashboardRoute,
      }}
    >
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
