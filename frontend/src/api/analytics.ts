import { apiClient } from './client';
import { LiveAnalytics, EventAnalytics, OrganizerAnalytics } from '../types';

export const analyticsApi = {
  getLiveAnalytics: async (eventId: string): Promise<LiveAnalytics> => {
    const res = await apiClient.get(`/events/${eventId}/analytics/live`);
    return res.data;
  },

  getEventAnalytics: async (eventId: string): Promise<EventAnalytics> => {
    const res = await apiClient.get(`/analytics/events/${eventId}`);
    return res.data;
  },

  getOrganizerAnalytics: async (): Promise<OrganizerAnalytics> => {
    const res = await apiClient.get('/analytics/organizer/me');
    return res.data;
  },

  getStudentDashboard: async (): Promise<any> => {
    const res = await apiClient.get('/students/me/dashboard');
    return res.data;
  },

  getOrganizerDashboard: async (): Promise<any> => {
    const res = await apiClient.get('/organizers/me/dashboard');
    return res.data;
  },
};
