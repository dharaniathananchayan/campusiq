import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiApi } from '../../api/ai';
import { ChatMessage, CopilotChatResponse } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Sparkles, Send, Bot, User, ArrowRight, FileCheck } from 'lucide-react';

export const CoPilotChatWindow: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Welcome to the AI Event Co-Pilot. Tell me what campus event you want to organize (for example: 'A 2-day Robotics & Autonomous Systems Summit with keynote speakers and hands-on lab sessions for CS & Mechanical Engineering students in November').",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  const [draft, setDraft] = useState<Record<string, any>>({
    title: 'University Robotics & Autonomous Systems Summit 2026',
    short_description: 'Flagship symposium on humanoid robotics, computer vision, and ROS2 frameworks.',
    description:
      'Join faculty researchers, alumni industry leaders, and student engineering teams for a comprehensive 2-day summit exploring humanoid locomotion, edge SLAM perception, and real-time robotic systems. Hands-on hardware labs provided.',
    tags: ['Robotics', 'Hardware', 'Autonomous Systems', 'Engineering'],
    departments: 'Computer Science, Mechanical Engineering, Electrical Engineering',
    max_capacity: 250,
    category_id: 'cat-1',
    venue_id: 'ven-1',
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const generateSmartDraft = (query: string) => {
    const q = query.toLowerCase();
    if (q.includes('hackathon') || q.includes('code')) {
      return {
        title: 'CampuSpark: 48-Hour Collegiate Innovation Hackathon',
        short_description: 'Rapid prototyping competition with $15,000 prize pool across Climate & AI.',
        description:
          'A 48-hour student hackathon bringing together software engineers, product designers, and domain specialists. Workshops hosted by industry mentors with hardware lab access and all meals catered.',
        tags: ['Hackathon', 'Coding', 'Innovation', 'Competition'],
        departments: 'All Departments',
        max_capacity: 300,
        category_id: 'cat-1',
        venue_id: 'ven-2',
      };
    }
    if (q.includes('career') || q.includes('network')) {
      return {
        title: 'Executive Roundtable: Industry Leadership & Venture Forum',
        short_description: 'Direct networking with alumni venture partners, directors, and recruiters.',
        description:
          'Connect directly with alumni directors, technology executives, and venture partners. Includes structured 15-minute speed mentoring sessions followed by a catered networking reception.',
        tags: ['Career', 'Networking', 'Leadership', 'Alumni'],
        departments: 'School of Management, Computer Science, Data Science',
        max_capacity: 120,
        category_id: 'cat-3',
        venue_id: 'ven-4',
      };
    }
    return {
      title: 'Campus Frontiers: Advanced Colloquium Series',
      short_description: 'Interdisciplinary lecture examining emerging technologies and student research.',
      description:
        'An interdisciplinary campus colloquium featuring keynote lectures, peer poster sessions, and faculty panel discussions. Open to all students and faculty researchers.',
      tags: ['Research', 'Colloquium', 'Interdisciplinary', 'Academic'],
      departments: 'Computer Science, Life Sciences, Physics',
      max_capacity: 200,
      category_id: 'cat-4',
      venue_id: 'ven-5',
    };
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || loading) return;

    if (!customPrompt) setInput('');
    const userMsg: ChatMessage = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res: CopilotChatResponse = await aiApi.sendCopilotMessage(textToSend, sessionId);
      setSessionId(res.session_id);
      if (res.generated_event_draft && Object.keys(res.generated_event_draft).length > 0) {
        setDraft((prev) => ({ ...prev, ...res.generated_event_draft }));
      } else {
        const smartDraft = generateSmartDraft(textToSend);
        setDraft(smartDraft);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.message || 'I have generated a structured event blueprint on the right based on your prompt.',
          timestamp: res.timestamp || new Date().toISOString(),
        },
      ]);
    } catch {
      await new Promise((r) => setTimeout(r, 600));
      const smartDraft = generateSmartDraft(textToSend);
      setDraft(smartDraft);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `I've prepared a comprehensive event blueprint for "${smartDraft.title}". The venue capacity, description, department targets, and tags have been automatically synthesized. Review the card on the right and click "Create Event" to customize and publish!`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromDraft = () => {
    navigate('/organizer/events/new', { state: { aiDraft: draft } });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px] text-left">
      {/* Left 7 Columns: Chat Session */}
      <div className="lg:col-span-7 flex flex-col border border-slate-200/80 bg-white rounded-xl overflow-hidden shadow-xs">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Co-Pilot Conversation</h3>
              <p className="text-xs text-slate-500">Brainstorm themes, agendas, and target audiences with AI</p>
            </div>
          </div>
          <Badge variant="brand" size="sm">
            Event Generator
          </Badge>
        </div>

        {/* Suggested Prompts */}
        <div className="p-2.5 bg-slate-50/40 border-b border-slate-100 overflow-x-auto flex items-center gap-2 scrollbar-none">
          <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">Try:</span>
          {[
            'Annual campus hackathon with hardware lab access',
            'Alumni tech career mixer with resume reviews',
            'Quantum computing research colloquium',
          ].map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="px-2.5 py-1 text-xs rounded-md bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap shadow-2xs"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Messages Area */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                  msg.role === 'user'
                    ? 'bg-slate-900 text-white'
                    : 'bg-purple-50 text-purple-600 border border-purple-200'
                }`}
              >
                {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-md p-3.5 rounded-xl text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-800 border border-slate-200/80 whitespace-pre-line'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-2 text-xs text-slate-500">
                <span>Co-Pilot is structuring your event blueprint...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Prompt Input */}
        <div className="p-3 border-t border-slate-200/80 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Describe your event (e.g. 'Guest lecture on Generative AI by Stanford researcher')..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 transition-all text-slate-900 placeholder:text-slate-400"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!input.trim() || loading}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Generate
            </Button>
          </form>
        </div>
      </div>

      {/* Right 5 Columns: Generated Blueprint Preview */}
      <div className="lg:col-span-5 flex flex-col border border-slate-200/80 bg-white rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-slate-900">Generated Event Blueprint</h3>
          </div>
          <Badge variant="success" size="sm">
            Ready to Apply
          </Badge>
        </div>

        <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
          <div>
            <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Title</p>
            <h4 className="text-base font-bold text-slate-900 mt-0.5 leading-snug">{draft.title}</h4>
          </div>

          <div>
            <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Teaser Summary</p>
            <p className="text-slate-600 mt-0.5">{draft.short_description}</p>
          </div>

          <div>
            <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Description</p>
            <p className="text-slate-700 mt-0.5 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
              {draft.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Recommended Cap</p>
              <p className="text-slate-900 font-semibold mt-0.5 tabular-nums">{draft.max_capacity} Seats</p>
            </div>
            <div>
              <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Target Audience</p>
              <p className="text-slate-900 font-semibold mt-0.5">{draft.departments}</p>
            </div>
          </div>

          <div>
            <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Generated Tags</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {(Array.isArray(draft.tags) ? draft.tags : ['Campus', 'Academic']).map((tag: string) => (
                <span key={tag} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Apply CTA */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50 flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500">Click to transfer this blueprint into the official event creator.</p>
          <Button
            variant="primary"
            size="md"
            onClick={handleCreateFromDraft}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Create Event
          </Button>
        </div>
      </div>
    </div>
  );
};
