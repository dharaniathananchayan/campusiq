import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Bot,
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Users,
  Tag,
  Building2,
  FileEdit,
  Archive,
  BarChart3,
  Copy,
  Plus,
  Send,
  Zap,
  Check,
  ChevronRight,
  ShieldCheck,
  Layers,
  MessageSquare,
  Megaphone,
  Upload,
  Crop,
  Image as ImageIcon,
  Star,
  Eye,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { INITIAL_ORGANIZER_EVENTS, OrganizerEventItem } from './OrganizerMyEventsView';
import { ImageCropperModal } from '../ui/ImageCropperModal';

export const OrganizerCreateEventView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Incoming clones or drafts
  const incomingDraft = location.state?.editDraft as OrganizerEventItem | undefined;
  const incomingClone = location.state?.cloneFrom as OrganizerEventItem | undefined;

  // Form Fields
  const [title, setTitle] = useState(incomingDraft?.title || incomingClone?.title || '');
  const [category, setCategory] = useState(incomingDraft?.category || incomingClone?.category || 'Engineering & Tech');
  const [shortDescription, setShortDescription] = useState(
    incomingDraft?.shortDescription || incomingClone?.shortDescription || ''
  );
  const [description, setDescription] = useState(
    incomingDraft?.shortDescription
      ? `${incomingDraft.shortDescription}\n\nKey Highlights:\n- Hands-on technical sessions & industry guest speakers\n- Mentor office hours and collaborative breakout rooms\n- Networking reception with light refreshments provided`
      : incomingClone?.shortDescription
      ? `${incomingClone.shortDescription}\n\nKey Highlights:\n- Hands-on technical sessions & industry guest speakers\n- Mentor office hours and collaborative breakout rooms\n- Networking reception with light refreshments provided`
      : ''
  );
  const [venue, setVenue] = useState(incomingDraft?.venue || incomingClone?.venue || 'Founders Innovation Hub · Lab 104');
  const [startDatetime, setStartDatetime] = useState('2026-11-28T10:00');
  const [endDatetime, setEndDatetime] = useState('2026-11-28T18:00');
  const [registrationDeadline, setRegistrationDeadline] = useState('2026-11-27T23:59');
  const [maxCapacity, setMaxCapacity] = useState<number>(incomingDraft?.maxCapacity || incomingClone?.maxCapacity || 150);
  const [registrationFee, setRegistrationFee] = useState<number>(
    incomingDraft?.registrationFee || incomingClone?.registrationFee || 0
  );
  const [tags, setTags] = useState(
    incomingDraft?.tags ? incomingDraft.tags.join(', ') : incomingClone?.tags ? incomingClone.tags.join(', ') : 'AI, Innovation, Workshop'
  );
  const [targetDepartments, setTargetDepartments] = useState('Computer Science, Electrical Engineering, Data Science');

  // Preview Image state (16:9 widescreen banner)
  const [previewImage, setPreviewImage] = useState<string>(
    'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80'
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [rawImageToCrop, setRawImageToCrop] = useState<string | null>(null);

  const PRESET_BANNERS = [
    {
      id: 'hacknight',
      label: 'Hackathon & Tech',
      url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'cybersec',
      label: 'CyberSec & Coding',
      url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'design',
      label: 'Design & Workshop',
      url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'robotics',
      label: 'Robotics & Hardware',
      url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'networking',
      label: 'Business & Mixer',
      url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file (PNG, JPG, WebP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setRawImageToCrop(reader.result as string);
      setIsCropperOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    setPreviewImage(croppedDataUrl);
    toast.success('Preview banner cropped to 1200×675 px (16:9 ratio)!');
  };

  const handleReCropExisting = () => {
    if (!previewImage) return;
    setRawImageToCrop(previewImage);
    setIsCropperOpen(true);
  };

  // Interactive Channel Toggles
  const [enableForum, setEnableForum] = useState(true);
  const [enableAnnouncements, setEnableAnnouncements] = useState(true);

  // AI Drafting Agent State
  const [agentPrompt, setAgentPrompt] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [activeBlueprintTab, setActiveBlueprintTab] = useState<'live' | 'draft' | 'completed' | 'archived'>('completed');

  useEffect(() => {
    if (incomingDraft) {
      toast.success(`Loaded draft "${incomingDraft.title}" into Drafting Agent!`);
    } else if (incomingClone) {
      toast.success(`Cloned blueprint from past event "${incomingClone.title}"!`);
    }
  }, [incomingDraft, incomingClone]);

  // AI Drafting Simulation
  const handleGenerateWithAgent = () => {
    if (!agentPrompt.trim()) {
      toast.error('Please enter an event idea for the Drafting Agent to formulate.');
      return;
    }

    setIsDrafting(true);
    setTimeout(() => {
      setIsDrafting(false);

      if (agentPrompt.toLowerCase().includes('hackathon') || agentPrompt.toLowerCase().includes('hack')) {
        setTitle('NexCode: 24-Hour AI & Decentralized Systems Hackathon');
        setCategory('Engineering & Tech');
        setShortDescription('A high-velocity collegiate hackathon building agentic AI, smart contracts, and open robotics.');
        setDescription(
          `NexCode 2026 brings together 200+ engineers, designers, and domain experts for an intensive 24-hour build sprint.\n\nSchedule:\n• 10:00 AM - Opening Keynote & Sponsor Tracks\n• 12:00 PM - Team Hacking Begins & Mentor Sessions\n• 06:00 PM - Dinner & Pitch Practice Breakout\n• 09:00 AM (Day 2) - Project Submissions & Live Demos\n• 12:00 PM - Awards Ceremony ($15,000 Total Prizes)\n\nPerks: Hardware access, cloud computing vouchers, swag kits, and catering.`
        );
        setVenue('Maxwell Science Complex · Innovation Hall');
        setMaxCapacity(250);
        setRegistrationFee(0);
        setTags('Hackathon, AI Agents, Hardware, Prizes, Open Source');
        setTargetDepartments('Computer Science, Electrical Engineering, Robotics, Design');
      } else if (agentPrompt.toLowerCase().includes('career') || agentPrompt.toLowerCase().includes('job')) {
        setTitle('Fall STEM Career Fair & Senior Alumni Networking Forum');
        setCategory('Career & Networking');
        setShortDescription('Connect directly with talent leads and engineering directors from top tech, finance, and biotech employers.');
        setDescription(
          `Annual university career recruitment expo. Meet 40+ premier tech companies, research labs, and seed-stage startups looking for interns and full-time new graduates.\n\nHighlights:\n- Dedicated speed-interview booths\n- Resume critique desk by senior alumni\n- Professional headshot booth provided free of charge`
        );
        setVenue('Turing Grand Auditorium');
        setMaxCapacity(400);
        setRegistrationFee(0);
        setTags('Career, Jobs, Internships, Networking, STEM');
        setTargetDepartments('All Engineering, Computer Science, Data Science, Math');
      } else {
        setTitle('Masterclass: Practical Generative AI & Autonomous Agent Architecture');
        setCategory('Engineering & Tech');
        setShortDescription('Hands-on technical laboratory building multi-agent systems, RAG vector pipelines, and live tools.');
        setDescription(
          `An intensive hands-on masterclass led by faculty and industry guest fellows.\n\nWhat you will build:\n1. Semantic search pipeline using vector embeddings and hybrid retrieval\n2. Tool-calling autonomous agents with reactive verification loops\n3. Local LLM fine-tuning and deployment on university compute clusters`
        );
        setVenue('Founders Innovation Hub · Lab 104');
        setMaxCapacity(100);
        setRegistrationFee(0);
        setTags('AI, LLMs, Vector Databases, Python, Workshop');
        setTargetDepartments('Computer Science, Artificial Intelligence, Data Science');
      }

      toast.success('Agent synthesized event blueprint! Form fields populated.');
    }, 1100);
  };

  const handleApplyBlueprint = (ev: OrganizerEventItem) => {
    setTitle(`${ev.title} (2026 Edition)`);
    setCategory(ev.category);
    setShortDescription(ev.shortDescription);
    setDescription(
      `${ev.shortDescription}\n\nRefined Agenda & Objectives:\n- Interactive hands-on breakout groups\n- Industry mentor Q&A session\n- Live demonstration and certificate of completion`
    );
    setVenue(ev.venue);
    setMaxCapacity(ev.maxCapacity);
    setRegistrationFee(ev.registrationFee);
    setTags(ev.tags.join(', '));
    toast.success(`Imported blueprint from "${ev.title}"!`);
  };

  const handleSaveDraft = () => {
    if (!title.trim()) {
      toast.error('Please provide at least an event title to save draft.');
      return;
    }
    toast.success(`Draft "${title}" saved to Events in Draft.`);
    navigate('/organizer/events');
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Event title is required.');
      return;
    }
    toast.success(`🎉 Published "${title}"! It is now live in the student discovery catalog.`);
    navigate('/organizer/events');
  };

  return (
    <div className="space-y-6 text-left w-full font-sans max-w-6xl mx-auto">
      {/* 1. Header with Back Button and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#e3dfd3]">
        <div className="space-y-1">
          <button
            onClick={() => navigate('/organizer/events')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#e65c36] hover:underline cursor-pointer mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to My Events</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#11241c] tracking-tight">
            Create Event with Drafting Agent
          </h1>
          <p className="text-xs sm:text-sm text-[#526359]">
            Draft custom events, prompt the AI Agent for intelligent blueprints, or clone proven setups from past completed sessions.
          </p>
        </div>

        {/* Action Buttons: View Analytics & Publish */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/organizer/analytics')}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-[#fbf9f3] text-[#19231e] border border-[#d8d3c5] rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <BarChart3 className="w-4 h-4 text-[#e65c36]" />
            <span>View Analytics</span>
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-[#f0eee6] hover:bg-[#e4e1d7] text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <FileEdit className="w-4 h-4 text-slate-600" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={handlePublish}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#e65c36] hover:bg-[#d8522d] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Publish Event</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive AI Drafting Agent Showcase Card */}
      <section className="bg-gradient-to-br from-[#113326] to-[#184634] text-white rounded-2xl p-5 sm:p-6 border border-[#23533e] shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d8fa57] text-[#113326] flex items-center justify-center font-extrabold shadow-sm">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                  AI Event Co-Pilot · Drafting Agent
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#26533f] text-[#d8fa57] uppercase tracking-wider">
                  GROQ AI COMPOUND · LIVE
                </span>
              </div>
              <p className="text-xs text-[#a6c1b3] mt-0.5">
                Describe your event idea or audience. The agent will formulate a full description, venue allocation, schedule, and tags.
              </p>
            </div>
          </div>
        </div>

        {/* Input & Prompt Generation */}
        <div className="space-y-3">
          <div className="relative">
            <textarea
              rows={2}
              value={agentPrompt}
              onChange={(e) => setAgentPrompt(e.target.value)}
              placeholder="e.g., Create a 24-hour collegiate hackathon focused on Generative AI and Robotics with mentor office hours..."
              className="w-full bg-[#163e2e] text-white text-xs sm:text-sm p-3.5 rounded-xl border border-[#2b654b] placeholder-[#799988] focus:outline-none focus:ring-2 focus:ring-[#d8fa57]/40 resize-none"
            />
            <button
              type="button"
              onClick={handleGenerateWithAgent}
              disabled={isDrafting}
              className="mt-2 sm:mt-0 sm:absolute sm:right-3 sm:bottom-3.5 inline-flex items-center gap-2 px-4 py-2 bg-[#d8fa57] hover:bg-[#cbf046] text-[#113326] rounded-lg text-xs font-extrabold transition-all cursor-pointer shadow-xs disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4 text-[#113326]" />
              <span>{isDrafting ? 'Agent Drafting Blueprint…' : 'Draft with Agent'}</span>
            </button>
          </div>

          {/* Quick Idea Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-[#c4d6cb]">
            <span className="text-[11px] font-semibold text-[#8fa99c] shrink-0">Quick Starters:</span>
            {[
              '24-Hour AI & Robotics Hackathon',
              'Zero-to-Hacker CTF Cybersecurity Lab',
              'STEM Career Expo & Speed Networking',
              'Campus UI/UX & Generative Design Sprint',
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setAgentPrompt(chip)}
                className="px-2.5 py-1 rounded-lg bg-[#184634] hover:bg-[#205741] border border-[#2b654b] text-[11px] font-medium whitespace-nowrap text-[#d8fa57] transition-colors cursor-pointer"
              >
                + {chip}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Reference Blueprints from Past, Drafts, Archived, and Live Events */}
        <div className="pt-3 border-t border-[#1d4d39] space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[11px] font-bold text-[#a6c1b3] uppercase tracking-wider">
              Or Clone Proven Blueprints:
            </span>

            {/* Blueprint Category Tabs */}
            <div className="flex items-center gap-1">
              {[
                { id: 'completed', label: 'Past Completed Events' },
                { id: 'draft', label: 'Events in Draft' },
                { id: 'live', label: 'Live View Events' },
                { id: 'archived', label: 'Archived Events' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveBlueprintTab(tab.id as any)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    activeBlueprintTab === tab.id
                      ? 'bg-[#d8fa57] text-[#113326]'
                      : 'text-[#a6c1b3] hover:text-white hover:bg-[#1a4735]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Blueprint Cards Carousel / Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {INITIAL_ORGANIZER_EVENTS.filter((e) => {
              if (activeBlueprintTab === 'live') return e.status === 'published';
              if (activeBlueprintTab === 'draft') return e.status === 'draft';
              if (activeBlueprintTab === 'completed') return e.status === 'completed';
              if (activeBlueprintTab === 'archived') return e.status === 'archived';
              return true;
            })
              .slice(0, 3)
              .map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => handleApplyBlueprint(ev)}
                  className="p-3 rounded-xl bg-[#163e2e] hover:bg-[#1e503b] border border-[#26533f] hover:border-[#d8fa57]/60 transition-all cursor-pointer text-left space-y-1.5 group"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#d8fa57] truncate">{ev.category}</span>
                    <span className="text-[10px] text-[#8fa99c] flex items-center gap-1">
                      <Copy className="w-3 h-3 group-hover:text-[#d8fa57]" />
                      1-Click Use
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-[#d8fa57] transition-colors truncate">
                    {ev.title}
                  </h4>
                  <p className="text-[11px] text-[#a6c1b3] line-clamp-1">{ev.shortDescription}</p>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* 4. Complete Event Creation Form */}
      <form onSubmit={handlePublish} className="bg-white rounded-2xl border border-[#dedbd4] p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Event Details & Logistics</h3>
          <p className="text-xs text-slate-500">Edit and verify generated information before publishing to campus.</p>
        </div>

        {/* ================= EVENT PREVIEW BANNER & DIMENSIONS ================= */}
        <div className="bg-[#fbf9f4] border border-[#e5e1d5] rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#ece8dc]">
            <div>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#e65c36]" />
                <h4 className="text-sm font-extrabold text-[#11241c] uppercase tracking-wider">
                  Event Preview Banner & Dimensions
                </h4>
              </div>
              <p className="text-xs text-[#526359] mt-0.5">
                Upload the hero banner image displayed on student discovery feeds, search cards, and event spotlight pages.
              </p>
            </div>

            {/* Recommended Dimension Specification Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2.5 py-1 rounded-md bg-[#112b20] text-[#d8fa57] text-[11px] font-mono font-bold shadow-2xs">
                1200 × 675 px (16:9)
              </span>
              <span className="px-2 py-1 rounded-md bg-white border border-[#dedbd4] text-[#55695f] text-[10px] font-medium">
                Min: 600 × 338 px
              </span>
            </div>
          </div>

          {/* Live Preview Card & Controls Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Live Student Card Preview (Matching User's Uploaded Screenshot) (7 cols) */}
            <div className="lg:col-span-7 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#738278]">
                <span className="font-semibold flex items-center gap-1.5 text-[#19231e]">
                  <Eye className="w-3.5 h-3.5 text-[#e65c36]" /> Live Student Feed Card Mockup
                </span>
                <span className="text-[10px] font-mono text-[#8ea79a] bg-[#112b20] px-2 py-0.5 rounded text-white font-bold">
                  16:9 Widescreen
                </span>
              </div>

              {/* The Exact Card Preview Mockup */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-lg border border-black/10 group bg-slate-900 select-none">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt={title || 'Event preview'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-800">
                    <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-xs">No preview banner selected</span>
                  </div>
                )}

                {/* Subtle dark gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/50 pointer-events-none" />

                {/* Top Badges (Category, Featured, Match Score) */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/70 backdrop-blur-xs text-white border border-white/20 shadow-xs">
                      {category}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#e65c36] text-white shadow-xs flex items-center gap-1">
                      <Star className="w-3 h-3 fill-white" />
                      <span>Featured</span>
                    </span>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#eaf6ed]/95 backdrop-blur-xs text-[#1f6b45] shadow-xs flex items-center gap-1 border border-emerald-200">
                    <Sparkles className="w-3 h-3 text-[#1f6b45]" />
                    <span>94% Match</span>
                  </span>
                </div>

                {/* Bottom Badges (Date & Time, Free / Fee) */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                  <span className="px-3 py-1 rounded-md text-[11px] font-semibold bg-black/85 backdrop-blur-xs text-white border border-white/10 shadow-xs">
                    {startDatetime
                      ? new Date(startDatetime).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        }) +
                        ' · ' +
                        new Date(startDatetime).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })
                      : 'Sat, Sep 20 · 10:00 AM'}
                  </span>

                  <span className="px-3 py-1 rounded-md text-[11px] font-bold bg-black/85 backdrop-blur-xs text-[#d8fa57] border border-white/10 shadow-xs">
                    {registrationFee === 0 ? 'Free' : `₹${registrationFee}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Controls & Preset Selectors (5 cols) */}
            <div className="lg:col-span-5 space-y-4 text-left">
              <div className="space-y-1">
                <h5 className="font-bold text-xs text-[#19231e]">Upload or Crop Custom Image</h5>
                <p className="text-[11px] text-[#738278] leading-relaxed">
                  Real photos of people in active workshops, hackathons, and auditoriums attract higher student engagement.
                </p>
              </div>

              {/* Upload & Re-crop Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-[#112b20] hover:bg-[#1a4030] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#d8fa57]" />
                  <span>Upload Image</span>
                </button>

                {previewImage && (
                  <button
                    type="button"
                    onClick={handleReCropExisting}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-[#f4f2ea] text-[#19231e] border border-[#dcd9ce] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Crop className="w-3.5 h-3.5 text-[#e65c36]" />
                    <span>Crop / Reposition</span>
                  </button>
                )}
              </div>

              {/* Curated Campus Presets */}
              <div className="pt-3 border-t border-[#e5e1d5] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#738278] block">
                  Or Pick Curated Campus Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_BANNERS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setPreviewImage(preset.url);
                        toast.success(`Applied ${preset.label} banner`);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                        previewImage === preset.url
                          ? 'bg-[#112b20] text-[#d8fa57] border-[#112b20]'
                          : 'bg-white text-[#4a574f] border-[#dcd9ce] hover:bg-[#f4f2ea]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Title */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">Event Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. HackNight: Build & Ship in 12 Hours"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e65c36]/20 focus:border-[#e65c36]"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#e65c36]/20 focus:border-[#e65c36]"
            >
              <option value="Engineering & Tech">Engineering & Tech</option>
              <option value="Leadership & Business">Leadership & Business</option>
              <option value="Career & Networking">Career & Networking</option>
              <option value="Science & Research">Science & Research</option>
              <option value="Arts & Culture">Arts & Culture</option>
            </select>
          </div>

          {/* Venue */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">Venue / Location *</label>
            <select
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#e65c36]/20 focus:border-[#e65c36]"
            >
              <option value="Founders Innovation Hub · Lab 104">Founders Innovation Hub · Lab 104 (Capacity: 120)</option>
              <option value="Turing Grand Auditorium">Turing Grand Auditorium (Capacity: 350)</option>
              <option value="Maxwell Science Complex">Maxwell Science Complex (Capacity: 300)</option>
              <option value="Executive Colloquium Room">Executive Colloquium Room (Capacity: 80)</option>
              <option value="Fine Arts Pavilion · Main Stage">Fine Arts Pavilion · Main Stage (Capacity: 500)</option>
            </select>
          </div>

          {/* Short Tagline */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">Short Hook / Tagline *</label>
            <input
              type="text"
              required
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Single catchy sentence shown on cards and feeds"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e65c36]/20 focus:border-[#e65c36]"
            />
          </div>

          {/* Full Description */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">Full Description & Schedule Agenda</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline the session itinerary, requirements, and what attendees will take away..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e65c36]/20 focus:border-[#e65c36]"
            />
          </div>

          {/* Dates & Times */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">Start Date & Time</label>
            <input
              type="datetime-local"
              value={startDatetime}
              onChange={(e) => setStartDatetime(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">End Date & Time</label>
            <input
              type="datetime-local"
              value={endDatetime}
              onChange={(e) => setEndDatetime(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none"
            />
          </div>

          {/* Capacity & Price */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">Max Seat Capacity</label>
            <input
              type="number"
              min={1}
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">Registration Fee (₹)</label>
            <input
              type="number"
              min={0}
              value={registrationFee}
              onChange={(e) => setRegistrationFee(Number(e.target.value))}
              placeholder="0 for Free"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none"
            />
          </div>

          {/* Tags */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">Tags & Keywords</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. AI, Hackathon, Coding, Career"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>

        {/* 5. Toggles for Interactive Channels */}
        <div className="pt-5 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900 tracking-tight uppercase">Community Channels</h4>
              <p className="text-[11px] text-slate-500">Toggle interactive attendee discussions and broadcast announcements for this event</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. Discussion Forum Toggle */}
            <div
              onClick={() => setEnableForum(!enableForum)}
              className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between gap-3 ${
                enableForum
                  ? 'bg-[#fff7f4] border-[#e65c36]/40 shadow-xs'
                  : 'bg-slate-50/80 border-slate-200/80 opacity-75 hover:opacity-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      enableForum ? 'bg-[#e65c36]/15 text-[#e65c36]' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-900 block leading-tight">Discussion Forum</span>
                    <span className="text-xs text-slate-500 leading-tight">Attendee pre-event chat & community Q&A</span>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={enableForum}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEnableForum(!enableForum);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    enableForum ? 'bg-[#e65c36]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      enableForum ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                <span className={`font-semibold ${enableForum ? 'text-[#e65c36]' : 'text-slate-400'}`}>
                  {enableForum ? '● Channel Active' : '○ Disabled'}
                </span>
                <span className="text-slate-400">Open conversation for registered students</span>
              </div>
            </div>

            {/* 2. Announcement Page Toggle */}
            <div
              onClick={() => setEnableAnnouncements(!enableAnnouncements)}
              className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between gap-3 ${
                enableAnnouncements
                  ? 'bg-[#fff7f4] border-[#e65c36]/40 shadow-xs'
                  : 'bg-slate-50/80 border-slate-200/80 opacity-75 hover:opacity-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      enableAnnouncements ? 'bg-[#e65c36]/15 text-[#e65c36]' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-900 block leading-tight">Announcement Page</span>
                    <span className="text-xs text-slate-500 leading-tight">Broadcast organizer updates & live alerts</span>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={enableAnnouncements}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEnableAnnouncements(!enableAnnouncements);
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    enableAnnouncements ? 'bg-[#e65c36]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      enableAnnouncements ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                <span className={`font-semibold ${enableAnnouncements ? 'text-[#e65c36]' : 'text-slate-400'}`}>
                  {enableAnnouncements ? '● Channel Active' : '○ Disabled'}
                </span>
                <span className="text-slate-400">Push notices & schedule notifications</span>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Form Bottom Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/organizer/events')}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#e65c36] hover:bg-[#d8522d] text-white text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Publish Event to Catalog</span>
            </button>
          </div>
        </div>
      </form>

      {/* ================= IMAGE CROPPER MODAL (16:9 BANNER) ================= */}
      <ImageCropperModal
        isOpen={isCropperOpen}
        onClose={() => setIsCropperOpen(false)}
        imageSrc={rawImageToCrop}
        onCropComplete={handleCropComplete}
        cropShape="banner"
        outputWidth={1200}
        outputHeight={675}
        title="Crop Event Preview Banner (16:9)"
      />
    </div>
  );
};
