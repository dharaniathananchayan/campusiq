import { apiClient } from './client';
import { Registration, Feedback, FeedbackSummary, Bookmark, Notification, PaginatedResponse, Invitation } from '../types';

export const registrationsApi = {
  registerForEvent: async (eventId: string): Promise<Registration> => {
    const res = await apiClient.post(`/events/${eventId}/register`);
    return res.data;
  },

  cancelRegistration: async (eventId: string): Promise<Registration> => {
    const res = await apiClient.delete(`/events/${eventId}/register`);
    return res.data;
  },

  getMyRegistrations: async (statusFilter?: string): Promise<Registration[]> => {
    const res = await apiClient.get('/students/me/registrations', {
      params: { status: statusFilter },
    });
    return res.data;
  },

  getEventRegistrations: async (eventId: string): Promise<Registration[]> => {
    const res = await apiClient.get(`/events/${eventId}/registrations`);
    return res.data;
  },

  markAttendance: async (registrationId: string): Promise<Registration> => {
    const res = await apiClient.post(`/registrations/${registrationId}/attend`);
    return res.data;
  },

  // Feedback
  submitFeedback: async (eventId: string, data: { rating: number; comment?: string; is_anonymous?: boolean }): Promise<Feedback> => {
    const res = await apiClient.post(`/events/${eventId}/feedback`, data);
    return res.data;
  },

  getEventFeedback: async (eventId: string, page = 1, page_size = 20): Promise<Feedback[]> => {
    const res = await apiClient.get(`/events/${eventId}/feedback`, {
      params: { page, page_size },
    });
    return res.data;
  },

  getFeedbackSummary: async (eventId: string): Promise<FeedbackSummary> => {
    const res = await apiClient.get(`/events/${eventId}/feedback/summary`);
    return res.data;
  },

  // Bookmarks
  addBookmark: async (eventId: string): Promise<Bookmark> => {
    const res = await apiClient.post(`/events/${eventId}/bookmark`);
    return res.data;
  },

  removeBookmark: async (eventId: string): Promise<void> => {
    await apiClient.delete(`/events/${eventId}/bookmark`);
  },

  getMyBookmarks: async (page = 1, page_size = 20): Promise<PaginatedResponse<Bookmark>> => {
    const res = await apiClient.get('/students/me/bookmarks', {
      params: { page, page_size },
    });
    const items = Array.isArray(res.data) ? res.data : res.data.items || [];
    return { items, total: items.length, page, page_size, total_pages: 1, has_next: false, has_prev: false };
  },

  // Notifications
  getNotifications: async (page = 1, page_size = 20): Promise<PaginatedResponse<Notification>> => {
    const res = await apiClient.get('/notifications', {
      params: { page, page_size },
    });
    return res.data;
  },

  getUnreadNotificationCount: async (): Promise<{ unread_count: number }> => {
    const res = await apiClient.get('/notifications/unread-count');
    return res.data;
  },

  markNotificationRead: async (notificationId: string): Promise<void> => {
    await apiClient.put(`/notifications/${notificationId}/read`);
  },

  markAllNotificationsRead: async (): Promise<void> => {
    await apiClient.put('/notifications/read-all');
  },

  // Invitations
  getMyInvitations: async (): Promise<Invitation[]> => {
    const res = await apiClient.get('/students/me/invitations');
    return res.data;
  },

  acceptInvitation: async (invitationId: string): Promise<{ message: string; invitation_id: string; event_id: string; status: string }> => {
    const res = await apiClient.post(`/students/me/invitations/${invitationId}/accept`);
    return res.data;
  },
};
