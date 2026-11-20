import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface StudentAchievement {
  id: string;
  title: string;
  subtitle: string;
  date?: string;
  badge?: string;
}

export interface StudentProfileData {
  name: string;
  department: string;
  deptShort: string;
  year: string;
  university: string;
  major: string;
  avatarUrl: string;
  bio: string;
  email: string;
  phone: string;
  joinedDate: string;
  github: string;
  linkedin: string;
  portfolio: string;
  eventsCount: number;
  avgMatch: number;
  savedCount: number;
  bookmarksCount: number;
  invitesAcceptedRate: number;
  aiScore: number;
  interests: string[];
  strengths: { name: string; percentage: number }[];
  achievements: StudentAchievement[];
}

interface StudentProfileState {
  profile: StudentProfileData;
  updateProfile: (data: Partial<StudentProfileData>) => void;
  addAchievement: (achievement: Omit<StudentAchievement, 'id'>) => void;
  removeAchievement: (id: string) => void;
  addInterest: (interest: string) => void;
  removeInterest: (interest: string) => void;
  resetProfile: () => void;
}

export const INITIAL_STUDENT_PROFILE: StudentProfileData = {
  name: 'Aarav Rao',
  department: 'Computer Science',
  deptShort: 'CS',
  year: 'Year 3',
  university: 'Northwood University',
  major: 'Computer Science',
  avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&q=80',
  bio: 'Undergraduate junior concentrating in distributed systems, machine learning, and campus open-source tools.',
  email: 'aarav.rao@northwood.edu',
  phone: '+1 (555) 234-5678',
  joinedDate: 'Joined Aug 2022',
  github: '',
  linkedin: '',
  portfolio: '',
  eventsCount: 24,
  avgMatch: 87,
  savedCount: 12,
  bookmarksCount: 31,
  invitesAcceptedRate: 71,
  aiScore: 87,
  interests: [
    'Machine Learning',
    'Python',
    'Hackathons',
    'Design',
    'Cybersecurity',
    'Football',
    'Robotics',
    'Open Source',
  ],
  strengths: [
    { name: 'Technology', percentage: 78 },
    { name: 'Career', percentage: 55 },
    { name: 'Sports', percentage: 32 },
  ],
  achievements: [
    { id: 'ach-1', title: 'HackNight Finalist', subtitle: 'Top 5 of 220 teams', date: 'Sep 2024' },
    { id: 'ach-2', title: '5-Event Streak', subtitle: 'Attended 5 in a row', date: 'Aug 2024' },
    { id: 'ach-3', title: 'Early Adopter', subtitle: 'Campus beta user', date: 'Aug 2022' },
    { id: 'ach-4', title: 'Perfect Match', subtitle: '98% AI match score', date: 'Current' },
  ],
};

export const useStudentProfileStore = create<StudentProfileState>()(
  persist(
    (set) => ({
      profile: INITIAL_STUDENT_PROFILE,

      updateProfile: (data) =>
        set((state) => ({
          profile: { ...state.profile, ...data },
        })),

      addAchievement: (achievement) =>
        set((state) => ({
          profile: {
            ...state.profile,
            achievements: [
              ...state.profile.achievements,
              { ...achievement, id: `ach-${Date.now()}` },
            ],
          },
        })),

      removeAchievement: (id) =>
        set((state) => ({
          profile: {
            ...state.profile,
            achievements: state.profile.achievements.filter((a) => a.id !== id),
          },
        })),

      addInterest: (interest) =>
        set((state) => {
          if (state.profile.interests.includes(interest)) return state;
          return {
            profile: {
              ...state.profile,
              interests: [...state.profile.interests, interest],
            },
          };
        }),

      removeInterest: (interest) =>
        set((state) => ({
          profile: {
            ...state.profile,
            interests: state.profile.interests.filter((i) => i !== interest),
          },
        })),

      resetProfile: () => set({ profile: INITIAL_STUDENT_PROFILE }),
    }),
    {
      name: 'campusiq-student-profile-v4',
    }
  )
);
