import { apiClient } from './client';
import { TokenResponse, Student, Organizer } from '../types';

export const authApi = {
  registerStudent: async (data: any): Promise<TokenResponse> => {
    const res = await apiClient.post('/auth/student/register', data);
    return res.data;
  },

  registerOrganizer: async (data: any): Promise<TokenResponse> => {
    const res = await apiClient.post('/auth/organizer/register', data);
    return res.data;
  },

  loginStudent: async (data: any): Promise<TokenResponse> => {
    const res = await apiClient.post('/auth/student/login', data);
    return res.data;
  },

  loginOrganizer: async (data: any): Promise<TokenResponse> => {
    const res = await apiClient.post('/auth/organizer/login', data);
    return res.data;
  },

  getStudentProfile: async (): Promise<Student> => {
    const res = await apiClient.get('/students/me');
    return res.data;
  },

  getOrganizerProfile: async (): Promise<Organizer> => {
    const res = await apiClient.get('/organizers/me');
    return res.data;
  },
};
