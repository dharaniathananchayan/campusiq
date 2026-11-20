import { apiClient } from './client';
import {
  InterestProfile,
  TargetingResponse,
  EventMatchScore,
  FeedbackAnalysis,
  AssistantChatResponse,
  CopilotChatResponse,
} from '../types';

export const aiApi = {
  // Interest Profile
  getInterestProfile: async (): Promise<InterestProfile> => {
    const res = await apiClient.get('/ai/interest-profile');
    return res.data;
  },

  rebuildInterestProfile: async (): Promise<InterestProfile> => {
    const res = await apiClient.post('/ai/interest-profile/refresh');
    return res.data;
  },

  // Event Match Scores (Student)
  getEventMatches: async (topN = 10): Promise<EventMatchScore[]> => {
    const res = await apiClient.get('/ai/events/match-scores');
    const data = res.data?.items || res.data || [];
    return Array.isArray(data) ? data.slice(0, topN) : [];
  },

  // Student Targeting (Organizer)
  getTargetedStudents: async (eventId: string, _topN = 20): Promise<TargetingResponse> => {
    const res = await apiClient.get(`/ai/events/${eventId}/targeting`);
    return res.data;
  },

  sendInvitations: async (eventId: string, studentIds: string[], personalizedMessage?: string): Promise<any> => {
    const res = await apiClient.post(`/ai/events/${eventId}/invitations`, {
      student_ids: studentIds,
      personalized_message: personalizedMessage,
    });
    return res.data;
  },

  // Feedback Analysis
  analyzeFeedback: async (eventId: string): Promise<FeedbackAnalysis> => {
    const res = await apiClient.post(`/ai/events/${eventId}/feedback-analysis`);
    return res.data;
  },

  getFeedbackAnalysis: async (eventId: string): Promise<FeedbackAnalysis> => {
    const res = await apiClient.get(`/ai/events/${eventId}/feedback-analysis`);
    return res.data;
  },

  // RAG Assistant Chat (Student & Any User)
  sendAssistantMessage: async (message: string, sessionId?: string): Promise<AssistantChatResponse> => {
    const res = await apiClient.post('/ai/assistant/chat', {
      message,
      session_id: sessionId,
    });
    return res.data;
  },

  getAssistantHistory: async (sessionId: string): Promise<any> => {
    const res = await apiClient.get(`/ai/assistant/sessions`);
    return res.data;
  },

  // Event Co-Pilot Chat (Organizer)
  sendCopilotMessage: async (message: string, sessionId?: string): Promise<CopilotChatResponse> => {
    if (sessionId) {
      const res = await apiClient.post(`/ai/copilot/sessions/${sessionId}/chat`, {
        message,
      });
      return res.data;
    } else {
      const res = await apiClient.post('/ai/copilot/sessions', {
        initial_message: message,
      });
      return res.data;
    }
  },

  getCopilotSession: async (sessionId: string): Promise<any> => {
    const res = await apiClient.get(`/ai/copilot/sessions/${sessionId}`);
    return res.data;
  },

  applyCopilotDraft: async (sessionId: string): Promise<{ message: string; event_id: string }> => {
    const res = await apiClient.post(`/ai/copilot/sessions/${sessionId}/apply`);
    return res.data;
  },

  generateEventProposal: async (concept: string): Promise<{
    title: string;
    short_description: string;
    description: string;
    max_capacity: number;
    tags: string;
    category?: string;
  }> => {
    try {
      const res = await apiClient.post('/ai/copilot/sessions', {
        initial_message: `Draft an event plan for: ${concept}`,
      });
      const draft = res.data?.generated_event_draft;
      if (draft && draft.title) {
        return {
          title: draft.title || '',
          short_description: draft.short_description || '',
          description: draft.description || '',
          max_capacity: draft.max_capacity || 50,
          tags: Array.isArray(draft.tags) ? draft.tags.join(', ') : (draft.tags || ''),
          category: draft.category || '',
        };
      }
    } catch {
      // Fallback local blueprint if copilot backend has issues or missing API key
    }
    return {
      title: concept.charAt(0).toUpperCase() + concept.slice(1),
      short_description: `An immersive session focusing on ${concept}.`,
      description: `Join us for ${concept}! This event connects motivated students with hands-on practice, peer collaboration, interactive workshops, and expert mentors. All departments and experience levels are welcome to participate.`,
      max_capacity: 50,
      tags: 'technology, workshop, student-community',
      category: 'Technology',
    };
  },
};
