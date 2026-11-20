import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserRole, Student, Organizer } from '../types';
import { mockCurrentStudent, mockOrganizer } from '../data/mockData';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  role: UserRole | null;
  user: Student | Organizer | null;
  theme: 'light' | 'dark';
  setAuth: (accessToken: string, refreshToken: string, role: UserRole, user: Student | Organizer) => void;
  updateUser: (user: Student | Organizer) => void;
  loginAsStudent: () => void;
  loginAsOrganizer: () => void;
  logout: () => void;
  toggleTheme: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      role: null,
      user: null,
      theme: 'light',

      setAuth: (accessToken, refreshToken, role, user) => {
        set({ accessToken, refreshToken, role, user });
      },

      updateUser: (user) => {
        set({ user });
      },

      loginAsStudent: () => {
        set({
          accessToken: 'demo-student-token-2026',
          refreshToken: 'demo-student-refresh-2026',
          role: 'student',
          user: mockCurrentStudent,
        });
      },

      loginAsOrganizer: () => {
        set({
          accessToken: 'demo-organizer-token-2026',
          refreshToken: 'demo-organizer-refresh-2026',
          role: 'organizer',
          user: mockOrganizer,
        });
      },

      logout: () => {
        set({ accessToken: null, refreshToken: null, role: null, user: null });
      },

      toggleTheme: () => {
        set((state) => {
          const nextTheme = state.theme === 'light' ? 'dark' : 'light';
          return { theme: nextTheme };
        });
      },
    }),
    {
      name: 'campusiq-auth',
    }
  )
);
