import { apiClient } from './client';
import { Event, Category, Venue, PaginatedResponse, EventAnnouncement, EventForumMessage, ForumMember } from '../types';

export interface EventSearchParams {
  q?: string;
  category_id?: string;
  venue_id?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  department?: string;
  year_of_study?: number;
  is_featured?: boolean;
  has_seats_available?: boolean;
  page?: number;
  page_size?: number;
}

export const eventsApi = {
  listEvents: async (params?: EventSearchParams): Promise<PaginatedResponse<Event>> => {
    const res = await apiClient.get('/events', { params });
    return res.data;
  },

  getFeaturedEvents: async (): Promise<Event[]> => {
    const res = await apiClient.get('/events/featured');
    return res.data;
  },

  getMyEvents: async (): Promise<PaginatedResponse<Event>> => {
    const res = await apiClient.get('/events/my');
    return res.data;
  },

  getEventById: async (id: string): Promise<Event> => {
    const res = await apiClient.get(`/events/${id}`);
    return res.data;
  },

  createEvent: async (data: any): Promise<Event> => {
    const res = await apiClient.post('/events', data);
    return res.data;
  },

  updateEvent: async (id: string, data: any): Promise<Event> => {
    const res = await apiClient.put(`/events/${id}`, data);
    return res.data;
  },

  publishEvent: async (id: string): Promise<Event> => {
    const res = await apiClient.post(`/events/${id}/publish`);
    return res.data;
  },

  cancelEvent: async (id: string): Promise<Event> => {
    const res = await apiClient.post(`/events/${id}/cancel`);
    return res.data;
  },

  deleteEvent: async (id: string): Promise<void> => {
    await apiClient.delete(`/events/${id}`);
  },

  listCategories: async (): Promise<Category[]> => {
    const res = await apiClient.get('/categories');
    return res.data;
  },

  listVenues: async (): Promise<Venue[]> => {
    const res = await apiClient.get('/venues');
    return res.data;
  },

  toggleRegistration: async (id: string, isOpen?: boolean): Promise<Event> => {
    const params = isOpen !== undefined ? { is_open: isOpen } : {};
    const res = await apiClient.post(`/events/${id}/toggle-registration`, null, { params });
    return res.data;
  },

  getEventAnnouncements: async (eventId: string): Promise<EventAnnouncement[]> => {
    const res = await apiClient.get(`/events/${eventId}/announcements`);
    return res.data;
  },

  createEventAnnouncement: async (
    eventId: string,
    data: { title: string; content: string; priority?: string; is_pinned?: boolean }
  ): Promise<EventAnnouncement> => {
    const res = await apiClient.post(`/events/${eventId}/announcements`, data);
    return res.data;
  },

  deleteEventAnnouncement: async (eventId: string, announcementId: string): Promise<void> => {
    await apiClient.delete(`/events/${eventId}/announcements/${announcementId}`);
  },

  getStudentAnnouncements: async (): Promise<EventAnnouncement[]> => {
    const res = await apiClient.get('/students/me/announcements');
    return res.data;
  },

  archiveEvent: async (id: string): Promise<Event> => {
    const res = await apiClient.post(`/events/${id}/archive`);
    return res.data;
  },

  getForumMessages: async (eventId: string): Promise<EventForumMessage[]> => {
    const res = await apiClient.get(`/events/${eventId}/forum`);
    return res.data;
  },

  postForumMessage: async (eventId: string, message: string): Promise<EventForumMessage> => {
    const res = await apiClient.post(`/events/${eventId}/forum`, { message });
    return res.data;
  },

  updateForumControls: async (
    eventId: string,
    data: { has_student_forum?: boolean; forum_access_mode?: string }
  ): Promise<Event> => {
    const res = await apiClient.put(`/events/${eventId}/forum-controls`, data);
    return res.data;
  },

  getForumMembers: async (eventId: string): Promise<ForumMember[]> => {
    const res = await apiClient.get(`/events/${eventId}/forum-members`);
    return res.data;
  },

  removeForumMember: async (eventId: string, userId: string, reason?: string): Promise<{ message: string }> => {
    const res = await apiClient.post(`/events/${eventId}/forum-members/${userId}/remove`, { reason });
    return res.data;
  },

  deleteForumMessage: async (eventId: string, messageId: string): Promise<{ message: string }> => {
    const res = await apiClient.delete(`/events/${eventId}/forum-messages/${messageId}`);
    return res.data;
  },
};
