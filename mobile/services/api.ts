import axios from 'axios';
import { storage } from '../utils/storage';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';

const getBaseUrl = () => {
  if (!__DEV__) return 'https://api.inkspire.com/api';
  // Use env variable if provided (crucial for physical devices)
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  // Use 10.0.2.2 for Android emulator, localhost for iOS simulator/Web
  return Platform.OS === 'android' ? 'http://10.0.2.2:8000/api' : 'http://localhost:8000/api';
};

export const BASE_URL = getBaseUrl();

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized errors (Token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await storage.getItem('refreshToken');
        if (!refreshToken) {
          useAuthStore.getState().logout();
          return Promise.reject(error);
        }

        const response = await axios.post(`${BASE_URL}/auth/refresh-token`, { refreshToken });
        
        if (response.data.success) {
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data;
          
          await useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    
    // Handle Network Errors
    if (!error.response && error.message === 'Network Error') {
      console.error('No internet connection');
      error.message = 'Please check your internet connection and try again.';
    }
    
    // Extract user-friendly error message from our backend
    // Our backend sends: { success: false, error: { message: '...', code: '...' } }
    if (error.response?.data?.error?.message) {
      error.message = error.response.data.error.message;
    } else if (error.response?.data?.message) {
      error.message = error.response.data.message;
    } else if (error.response?.status >= 500) {
      error.message = 'Something went wrong on our end. Please try again later.';
    }
    
    return Promise.reject(error);
  }
);
