import { create } from 'zustand';
import { storage } from '../utils/storage';

interface User {
  id: string;
  email: string;
  displayName?: string;
  avatar?: string;
  role: string;
  isActive: boolean;
  experienceLevel?: string;
  dailyWordCount?: number;
  availability?: string;
  writingGoals?: string[];
  genres?: string[];
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true, // Initially true while we check SecureStore

  login: async (user, accessToken, refreshToken) => {
    await storage.setItem('accessToken', accessToken);
    await storage.setItem('refreshToken', refreshToken);
    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: async () => {
    await storage.removeItem('accessToken');
    await storage.removeItem('refreshToken');
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  updateUser: (data) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    }));
  },

  setTokens: async (accessToken, refreshToken) => {
    await storage.setItem('accessToken', accessToken);
    await storage.setItem('refreshToken', refreshToken);
    set({ accessToken, refreshToken });
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },
}));

// Initialize auth state
export const initAuth = async () => {
  const token = await storage.getItem('accessToken');
  const refreshToken = await storage.getItem('refreshToken');
  if (token) {
    // You might want to fetch user profile here using the token
    useAuthStore.setState({ accessToken: token, refreshToken, isAuthenticated: true, isLoading: false });
  } else {
    useAuthStore.setState({ isLoading: false });
  }
};
