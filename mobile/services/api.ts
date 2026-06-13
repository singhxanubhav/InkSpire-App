import axios from 'axios';
import { storage } from '../utils/storage';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';

// For Android emulator to access local server, we use 10.0.2.2
// For iOS simulator, localhost works
const BASE_URL = __DEV__
  ? 'http://10.165.153.125:8000/api'
  : 'https://api.inkspire.com/api'; // Production URL

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
      error.message = 'No internet connection';
    }
    
    return Promise.reject(error);
  }
);
