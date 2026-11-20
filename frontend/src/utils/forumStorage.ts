import { EventForumMessage } from '../types';

export interface ForumThreadMessage extends EventForumMessage {
  likes?: number;
  isLiked?: boolean;
  isPinned?: boolean;
}

export const FORUM_STORAGE_KEY = 'campusiq_event_discussions';
export const SELECTED_DISCUSSION_EVENT_KEY = 'campusiq_selected_discussion_event';

export const DEFAULT_DISCUSSIONS: Record<string, ForumThreadMessage[]> = {
  'ev-1': [
    {
      id: 'msg-ev1-pin',
      event_id: 'ev-1',
      user_id: 'user-org',
      user_name: 'Dr. Sarah Jenkins',
      user_role: 'organizer',
      message: '📌 Welcome to the University AI Symposium Forum! Please post all technical setup queries, compute credit questions, and speaker discussion topics here.',
      created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
      likes: 18,
      isPinned: true,
    },
    {
      id: 'msg-ev1-1',
      event_id: 'ev-1',
      user_id: 'user-stu-1',
      user_name: 'Aarav Sharma',
      user_role: 'student',
      message: 'Will cloud GPU instances (A100/H100) be provisioned for attendees during the hands-on distributed inference session, or should we bring our own setup?',
      created_at: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
      likes: 9,
    },
    {
      id: 'msg-ev1-2',
      event_id: 'ev-1',
      user_id: 'user-org',
      user_name: 'Dr. Sarah Jenkins',
      user_role: 'organizer',
      message: 'Hi Aarav! Cloud JupyterLab environments with GPU acceleration are fully provisioned for all registered attendees. Just bring a laptop with a modern web browser!',
      created_at: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
      likes: 12,
    },
    {
      id: 'msg-ev1-3',
      event_id: 'ev-1',
      user_id: 'user-stu-2',
      user_name: 'Rohan Mehra',
      user_role: 'student',
      message: 'Are there any pre-reading materials or repos we should clone beforehand?',
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      likes: 4,
    },
    {
      id: 'msg-ev1-4',
      event_id: 'ev-1',
      user_id: 'user-org',
      user_name: 'Prof. Alan Vance',
      user_role: 'organizer',
      message: 'We will post the GitHub starter repo link right here tomorrow morning at 8:00 AM before the opening keynote.',
      created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      likes: 7,
    },
  ],
  'ev-2': [
    {
      id: 'msg-ev2-1',
      event_id: 'ev-2',
      user_id: 'user-org',
      user_name: 'Campus Venture Hub',
      user_role: 'organizer',
      message: 'Pitch decks must be submitted as PDF via the organizer link by midnight before pitch day. 5-minute hard limit with 3-minute Q&A per team!',
      created_at: new Date(Date.now() - 1000 * 60 * 400).toISOString(),
      likes: 14,
      isPinned: true,
    },
    {
      id: 'msg-ev2-2',
      event_id: 'ev-2',
      user_id: 'user-stu-3',
      user_name: 'Ananya Deshmukh',
      user_role: 'student',
      message: 'Will non-pitching audience members have an opportunity to participate in the investor lounge networking hour?',
      created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      likes: 8,
    },
    {
      id: 'msg-ev2-3',
      event_id: 'ev-2',
      user_id: 'user-org',
      user_name: 'Campus Venture Hub',
      user_role: 'organizer',
      message: 'Yes! The Founders & Angel Networking mixer in Hall B is open to all registered student ticket holders.',
      created_at: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
      likes: 11,
    },
  ],
  'ev-3': [
    {
      id: 'msg-ev3-pin',
      event_id: 'ev-3',
      user_id: 'user-org',
      user_name: 'CodeCell Society',
      user_role: 'organizer',
      message: '⚡ Welcome Hackers! High-speed Wi-Fi network credentials: SSID "HackNight_5G", key available on your event badges.',
      created_at: new Date(Date.now() - 1000 * 60 * 250).toISOString(),
      likes: 24,
      isPinned: true,
    },
    {
      id: 'msg-ev3-1',
      event_id: 'ev-3',
      user_id: 'user-stu-4',
      user_name: 'Karan Patel',
      user_role: 'student',
      message: 'Looking for 1 frontend dev (React/Tailwind) to team up for the Web3 / AI track! Hit reply or find me at Table 14.',
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      likes: 6,
    },
    {
      id: 'msg-ev3-2',
      event_id: 'ev-3',
      user_id: 'user-stu-5',
      user_name: 'Priya Iyer',
      user_role: 'student',
      message: 'Hey Karan, I do React and Vite! Coming over to Table 14 now.',
      created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      likes: 5,
    },
  ],
  'ev-4': [
    {
      id: 'msg-ev4-1',
      event_id: 'ev-4',
      user_id: 'user-org',
      user_name: 'Quantum Physics Society',
      user_role: 'organizer',
      message: 'Please install Python 3.10+ and run `pip install qiskit qiskit-aer` beforehand to minimize setup delays.',
      created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
      likes: 16,
      isPinned: true,
    },
    {
      id: 'msg-ev4-2',
      event_id: 'ev-4',
      user_id: 'user-stu-6',
      user_name: 'Siddharth Rao',
      user_role: 'student',
      message: 'Is prior knowledge of quantum mechanics required or is basic linear algebra sufficient?',
      created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      likes: 10,
    },
    {
      id: 'msg-ev4-3',
      event_id: 'ev-4',
      user_id: 'user-org',
      user_name: 'Quantum Physics Society',
      user_role: 'organizer',
      message: 'Basic matrix multiplication and complex vector spaces are plenty! We cover quantum gates from first principles.',
      created_at: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
      likes: 13,
    },
  ],
  'ev-5': [
    {
      id: 'msg-ev5-1',
      event_id: 'ev-5',
      user_id: 'user-org',
      user_name: 'CyberSec Guild',
      user_role: 'organizer',
      message: 'VPN configs for the CTF scoring arena will be released 15 minutes before the first challenge flag opens.',
      created_at: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
      likes: 19,
      isPinned: true,
    },
    {
      id: 'msg-ev5-2',
      event_id: 'ev-5',
      user_id: 'user-stu-7',
      user_name: 'Vikram Joshi',
      user_role: 'student',
      message: 'Are automated directory fuzzers allowed against the public web challenge instances?',
      created_at: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
      likes: 7,
    },
    {
      id: 'msg-ev5-3',
      event_id: 'ev-5',
      user_id: 'user-org',
      user_name: 'CyberSec Guild',
      user_role: 'organizer',
      message: 'Rate limit is 50 req/sec per team IP. DoS against scoreboard infrastructure will result in disqualification.',
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      likes: 15,
    },
  ],
};

function notifyForumUpdated(eventId: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('campusiq-forum-updated', { detail: { eventId } }));
  }
}

/** Get entire forum discussion store from localStorage, merged with defaults */
export function getStoredForumStore(): Record<string, ForumThreadMessage[]> {
  try {
    const raw = localStorage.getItem(FORUM_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        // Ensure defaults are present if not in parsed
        let needsSave = false;
        const merged = { ...parsed };
        for (const [key, msgs] of Object.entries(DEFAULT_DISCUSSIONS)) {
          if (!merged[key] || merged[key].length === 0) {
            merged[key] = msgs;
            needsSave = true;
          }
        }
        if (needsSave) {
          localStorage.setItem(FORUM_STORAGE_KEY, JSON.stringify(merged));
        }
        return merged;
      }
    }
  } catch (err) {
    console.warn('Failed to parse stored forum discussions:', err);
  }

  // Initialize with defaults if empty
  try {
    localStorage.setItem(FORUM_STORAGE_KEY, JSON.stringify(DEFAULT_DISCUSSIONS));
  } catch {}
  return { ...DEFAULT_DISCUSSIONS };
}

/** Get forum messages for a specific event */
export function getStoredForumMessages(eventId: string, eventTitle?: string, organizerName?: string): ForumThreadMessage[] {
  const store = getStoredForumStore();
  if (store[eventId] && store[eventId].length > 0) {
    return store[eventId];
  }

  // Check if default exists
  if (DEFAULT_DISCUSSIONS[eventId] && DEFAULT_DISCUSSIONS[eventId].length > 0) {
    store[eventId] = [...DEFAULT_DISCUSSIONS[eventId]];
    try {
      localStorage.setItem(FORUM_STORAGE_KEY, JSON.stringify(store));
    } catch {}
    return store[eventId];
  }

  // Generate a friendly starter message for any custom event
  const initialMsg: ForumThreadMessage = {
    id: `welcome-${eventId}`,
    event_id: eventId,
    user_id: 'system',
    user_name: organizerName || 'Event Host',
    user_role: 'organizer',
    message: `👋 Welcome to the discussion forum for "${eventTitle || 'this event'}"! Ask any questions or connect with fellow participants below.`,
    created_at: new Date().toISOString(),
    likes: 1,
    isPinned: true,
  };

  store[eventId] = [initialMsg];
  try {
    localStorage.setItem(FORUM_STORAGE_KEY, JSON.stringify(store));
  } catch {}
  return store[eventId];
}

/** Save a new message into the persistent forum store */
export function saveForumMessage(eventId: string, message: ForumThreadMessage | EventForumMessage): ForumThreadMessage[] {
  const store = getStoredForumStore();
  const existing = store[eventId] ? [...store[eventId]] : [];

  const threadMsg: ForumThreadMessage = {
    likes: 0,
    isLiked: false,
    ...message,
  };

  // Avoid duplicate ID if it exists
  const existingIdx = existing.findIndex((m) => m.id === threadMsg.id);
  if (existingIdx >= 0) {
    existing[existingIdx] = threadMsg;
  } else {
    existing.push(threadMsg);
  }

  store[eventId] = existing;
  try {
    localStorage.setItem(FORUM_STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn('Failed to persist forum message:', err);
  }

  notifyForumUpdated(eventId);
  return existing;
}

/** Delete a message from the persistent forum store */
export function deleteStoredForumMessage(eventId: string, messageId: string): ForumThreadMessage[] {
  const store = getStoredForumStore();
  if (!store[eventId]) return [];

  const updated = store[eventId].filter((m) => m.id !== messageId);
  store[eventId] = updated;

  try {
    localStorage.setItem(FORUM_STORAGE_KEY, JSON.stringify(store));
  } catch {}

  notifyForumUpdated(eventId);
  return updated;
}

/** Toggle like on a forum message */
export function toggleLikeForumMessage(eventId: string, messageId: string): ForumThreadMessage[] {
  const store = getStoredForumStore();
  const list = store[eventId] || [];

  const updated = list.map((m) => {
    if (m.id === messageId) {
      const isLiked = !m.isLiked;
      const currentLikes = m.likes || 0;
      return {
        ...m,
        isLiked,
        likes: isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1),
      };
    }
    return m;
  });

  store[eventId] = updated;
  try {
    localStorage.setItem(FORUM_STORAGE_KEY, JSON.stringify(store));
  } catch {}

  notifyForumUpdated(eventId);
  return updated;
}

/** Merge backend messages with local messages, preserving local ones */
export function syncBackendMessages(eventId: string, backendMessages: EventForumMessage[]): ForumThreadMessage[] {
  if (!Array.isArray(backendMessages) || backendMessages.length === 0) {
    return getStoredForumMessages(eventId);
  }

  const store = getStoredForumStore();
  const localList = store[eventId] || [];
  const map = new Map<string, ForumThreadMessage>();

  // Add local messages
  for (const m of localList) {
    map.set(m.id, m);
  }

  // Add or update from backend
  for (const bm of backendMessages) {
    const existing = map.get(bm.id);
    map.set(bm.id, {
      likes: existing?.likes || 0,
      isLiked: existing?.isLiked || false,
      isPinned: existing?.isPinned || false,
      ...bm,
    });
  }

  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  store[eventId] = merged;
  try {
    localStorage.setItem(FORUM_STORAGE_KEY, JSON.stringify(store));
  } catch {}

  notifyForumUpdated(eventId);
  return merged;
}

/** Get the last active discussion event id */
export function getSelectedDiscussionEvent(): string {
  try {
    const saved = localStorage.getItem(SELECTED_DISCUSSION_EVENT_KEY);
    if (saved) return saved;
  } catch {}
  return 'ev-1';
}

/** Save the last active discussion event id */
export function saveSelectedDiscussionEvent(eventId: string): void {
  try {
    localStorage.setItem(SELECTED_DISCUSSION_EVENT_KEY, eventId);
  } catch {}
}
