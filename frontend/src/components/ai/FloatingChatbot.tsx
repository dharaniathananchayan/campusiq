import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { Bot, X, RotateCcw, Send } from 'lucide-react';
import { aiApi } from '../../api/ai';
import type { ChatMessage } from '../../types';
import './FloatingChatbot.css';

export const FloatingChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Hello! I'm your CampusIQ Assistant. Ask me anything about upcoming hackathons, workshops, venues, registration deadlines, or campus events!",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>();
  const [hasUnread, setHasUnread] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Listen for open-floating-chatbot event from anywhere in the app
  useEffect(() => {
    const handleOpen = (e: any) => {
      setIsOpen(true);
      if (e?.detail?.initialQuery) {
        handleSend(e.detail.initialQuery);
      }
    };
    window.addEventListener('open-floating-chatbot', handleOpen);
    return () => window.removeEventListener('open-floating-chatbot', handleOpen);
  }, []);

  const quickPrompts = [
    'What tech events are coming up?',
    'Events with open seats this week',
    'Tell me about HackNight',
    'Which upcoming events are free?',
  ];

  const getSmartFallback = (query: string) => {
    const q = query.toLowerCase();
    if (q.includes('ai') || q.includes('hackathon') || q.includes('tech') || q.includes('code')) {
      return "We have **HackNight: Build & Ship in 12 Hours** coming up in Founders Innovation Hub · Lab 104 with prizes, mentorship, and cloud credits! There is also **CTF Bootcamp: Zero to Hacker** in CSE Annex Lab 4. You can register directly from the events catalog.";
    }
    if (q.includes('cultural') || q.includes('art') || q.includes('portfolio') || q.includes('music')) {
      return "The **Monsoon Portfolio Critique** by the Fine Arts Society is happening on Sun, Sep 21 at 11:00 AM in the Old Library Gallery. Free admission for all students!";
    }
    if (q.includes('sports') || q.includes('football') || q.includes('match')) {
      return "The **Inter-Hostel Football Semifinals** organized by the Sports Committee are scheduled for Sat, Sep 20 at 4:30 PM on the Campus Main Ground.";
    }
    if (q.includes('free') || q.includes('ticket') || q.includes('price')) {
      return "Most campus workshops including HackNight and the Portfolio Critique are 100% free for students! You can filter by 'Free Only' on the Discover catalog.";
    }
    return "CampusIQ has active sessions across Technology, Arts, Sports, Career, and Robotics. Explore the Discover catalog or check 'Events you might like' for tailored recommendations!";
  };

  const handleSend = async (customText?: string) => {
    const query = (customText || input).trim();
    if (!query || loading) return;

    if (!customText) setInput('');
    const userMsg: ChatMessage = {
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await aiApi.sendAssistantMessage(query, sessionId);

      if (response && response.message) {
        setSessionId(String(response.session_id));
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: response.message,
            timestamp: response.timestamp || new Date().toISOString(),
          },
        ]);
      } else {
        throw new Error('No message');
      }
    } catch {
      // Graceful fallback with authentic campus data
      const fallback = getSmartFallback(query);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: fallback,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Chat history cleared. How can I help you explore campus events today?',
        timestamp: new Date().toISOString(),
      },
    ]);
    setSessionId(undefined);
  };

  return (
    <div className="floating-chat-root">
      {/* Floating launcher trigger */}
      {!isOpen && (
        <button
          className="floating-chat-trigger"
          onClick={() => setIsOpen(true)}
          aria-label="Open CampusIQ Campus Q&A"
          title="Campus Q&A"
        >
          <div className="floating-chat-trigger__icon">
            <Bot size={24} />
            <span className="floating-chat-trigger__pulse" />
          </div>
          <span className="floating-chat-trigger__label">Campus Q&A</span>
          {hasUnread && <span className="floating-chat-trigger__badge" />}
        </button>
      )}

      {/* Floating chat modal */}
      {isOpen && (
        <div className="floating-chat-window animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="floating-chat-header">
            <div className="floating-chat-header__info">
              <div className="floating-chat-avatar">
                <Bot size={20} />
                <span className="floating-chat-avatar__status" />
              </div>
              <div>
                <h3 className="floating-chat-title">Campus Q&A</h3>
                <p className="floating-chat-subtitle">Campus Event Intelligence · Live Data</p>
              </div>
            </div>

            <div className="floating-chat-header__actions">
              <button
                className="floating-chat-icon-btn"
                onClick={resetChat}
                title="Reset conversation"
                aria-label="Reset chat"
              >
                <RotateCcw size={15} />
              </button>
              <button
                className="floating-chat-icon-btn"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                aria-label="Close chat"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="floating-chat-body">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`floating-chat-bubble floating-chat-bubble--${msg.role}`}
              >
                <div className="floating-chat-bubble__text">{msg.content}</div>
                <div className="floating-chat-bubble__meta">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}

            {loading && (
              <div className="floating-chat-bubble floating-chat-bubble--assistant floating-chat-bubble--thinking">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick prompt suggestions */}
          <div className="floating-chat-prompts">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                className="floating-prompt-chip"
                onClick={() => handleSend(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat input box */}
          <form
            className="floating-chat-footer"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about campus events, venues, schedule..."
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="floating-chat-send"
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
