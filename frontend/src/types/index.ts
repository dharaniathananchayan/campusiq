export type UserRole = 'student' | 'organizer';

export interface Student {
  id: string;
  email: string;
  full_name: string;
  institute_name?: string;
  student_id?: string;
  department?: string;
  year_of_study: number;
  phone?: string;
  profile_picture_url?: string;
  bio?: string;
  is_active: boolean;
  created_at: string;
}

export interface StudentPublic {
  id: string;
  full_name: string;
  institute_name?: string;
  student_id?: string;
  department?: string;
  year_of_study: number;
  profile_picture_url?: string;
}

export interface Organizer {
  id: string;
  email: string;
  full_name: string;
  organization_name: string;
  organization_type: 'club' | 'department' | 'committee' | 'society';
  contact_phone?: string;
  description?: string;
  website?: string;
  logo_url?: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export interface OrganizerPublic {
  id: string;
  full_name: string;
  organization_name: string;
  organization_type: string;
  logo_url?: string;
  website?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color_hex?: string;
  is_active: boolean;
}

export interface Venue {
  id: string;
  name: string;
  building: string;
  floor?: string;
  capacity: number;
  amenities?: Record<string, boolean>;
  is_available: boolean;
  location_description?: string;
}

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed' | 'archived';

export interface EligibilityCriteria {
  departments: string[];
  year_of_study: number[];
  custom_criteria: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  short_description?: string;
  organizer?: OrganizerPublic;
  category?: Category;
  category_id?: string;
  venue?: Venue;
  venue_id?: string;
  start_datetime: string;
  end_datetime: string;
  registration_deadline: string;
  max_capacity: number;
  current_registrations: number;
  available_seats: number;
  status: EventStatus;
  eligibility_criteria: EligibilityCriteria;
  tags: string[];
  banner_url?: string;
  is_featured: boolean;
  registration_fee: number;
  contact_email?: string;
  is_registration_open?: boolean;
  has_student_forum?: boolean;
  forum_access_mode?: 'open' | 'organizer_only';
  created_at: string;
  updated_at: string;
  is_registered?: boolean;
  is_bookmarked?: boolean;
  match_score?: number;
}

export interface EventAnnouncement {
  id: string;
  event_id: string;
  event_title?: string;
  organizer_name?: string;
  organizer_id?: string;
  title: string;
  content: string;
  priority: 'normal' | 'important' | 'urgent';
  is_pinned: boolean;
  created_at: string;
  updated_at?: string;
}

export interface EventForumMessage {
  id: string;
  event_id: string;
  user_id: string;
  user_role: 'student' | 'organizer';
  user_name: string;
  message: string;
  created_at: string;
}

export type RegistrationStatus = 'confirmed' | 'cancelled' | 'waitlisted' | 'attended';

export interface Registration {
  id: string;
  student_id: string;
  event_id: string;
  status: RegistrationStatus;
  registered_at: string;
  cancelled_at?: string;
  attended_at?: string;
  event?: Event;
  student?: StudentPublic;
}

export interface Feedback {
  id: string;
  event_id: string;
  student?: StudentPublic;
  rating: number;
  comment?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  sentiment_score?: number;
  is_anonymous: boolean;
  created_at: string;
}

export interface FeedbackSummary {
  avg_rating: number;
  total_count: number;
  rating_distribution: Record<string, number>;
  sentiment_breakdown: Record<string, number>;
}

export interface Bookmark {
  id: string;
  student_id: string;
  event_id: string;
  event?: Event;
  created_at: string;
}

export interface Invitation {
  id: string;
  event_id: string;
  organizer_id: string;
  status: 'pending' | 'accepted' | 'declined';
  personalized_message?: string;
  ai_match_score?: number;
  sent_at: string;
  responded_at?: string;
  event_title: string;
  event_short_description?: string;
  event_description?: string;
  category_name?: string;
  venue_name?: string;
  start_datetime?: string;
  end_datetime?: string;
  organizer_name?: string;
  organization_name?: string;
  is_registered?: boolean;
}

export interface Notification {
  id: string;
  type: 'new_event' | 'confirmation' | 'reminder' | 'change' | 'invitation' | 'cancellation' | 'general';
  title: string;
  message: string;
  is_read: boolean;
  metadata_?: Record<string, any>;
  action_url?: string;
  created_at: string;
}

export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
}

export interface LiveAnalytics {
  event_id: string;
  event_title: string;
  current_registrations: number;
  max_capacity: number;
  available_seats: number;
  capacity_utilization: number;
  registration_rate: number;
  hourly_trend: TimeSeriesPoint[];
  daily_trend: TimeSeriesPoint[];
  status: string;
}

export interface EventAnalytics {
  event_id: string;
  event_title: string;
  total_registrations: number;
  confirmed_registrations: number;
  cancelled_registrations: number;
  waitlisted: number;
  attendance_rate: number;
  registration_trend: TimeSeriesPoint[];
  department_breakdown: Record<string, number>;
  year_breakdown: Record<string, number>;
  avg_rating: number;
  total_feedback: number;
  rating_distribution: Record<string, number>;
  sentiment_breakdown: Record<string, number>;
  category_avg_rating: number;
  category_avg_registrations: number;
  campus_avg_rating: number;
  campus_avg_registrations: number;
}

export interface OrganizerAnalytics {
  organizer_id: string;
  total_events: number;
  published_events: number;
  total_registrations: number;
  avg_capacity_utilization: number;
  avg_rating: number;
  top_events: Array<{ id: string; title: string; current_registrations: number; max_capacity: number }>;
  monthly_trend: TimeSeriesPoint[];
  category_breakdown: Record<string, number>;
}

export interface InterestProfile {
  student_id: string;
  category_weights: Record<string, number>;
  keyword_interests: Record<string, number>;
  engagement_score: number;
  total_registrations: number;
  total_bookmarks: number;
  last_updated: string;
}

export interface TargetedStudent {
  student: StudentPublic;
  match_score: number;
  match_reasons: string[];
}

export interface TargetingResponse {
  event_id: string;
  recommended_students: TargetedStudent[];
  total_analyzed: number;
}

export interface EventMatchScore {
  event: Event;
  compatibility_score: number;
  match_reasons: string[];
}

export interface FeedbackAnalysis {
  event_id: string;
  overall_sentiment: string;
  avg_rating: number;
  total_responses: number;
  positive_themes: string[];
  negative_themes: string[];
  recommendations: string[];
  detailed_analysis: string;
  analyzed_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AssistantChatResponse {
  session_id: string;
  message: string;
  role: string;
  timestamp: string;
  sources: Array<{ title: string; event_id: string; relevance_score: number }>;
}

export interface CopilotChatResponse {
  session_id: string;
  message: string;
  generated_event_draft: Partial<Event>;
  suggested_actions: string[];
  timestamp: string;
}

export interface EventForumMessage {
  id: string;
  event_id: string;
  user_id: string;
  user_role: 'student' | 'organizer';
  user_name: string;
  message: string;
  created_at: string;
}

export interface ForumMember {
  user_id: string;
  user_name: string;
  user_role: string;
  message_count: number;
  last_active: string;
  is_removed: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  role: UserRole;
}
