import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Calendar,
  MapPin,
  Building2,
  GraduationCap,
  Users,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Mail,
  Globe,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { mockEvents, mockOrganizer, mockCurrentStudent } from '../../data/mockData';
import { Event, Organizer, Student } from '../../types';

export interface SearchStudent {
  id: string;
  student_id: string;
  full_name: string;
  email: string;
  department: string;
  year_of_study: number;
  bio?: string;
  interests?: string[];
  status?: string;
}

export interface SearchOrganizer {
  id: string;
  full_name: string;
  organization_name: string;
  organization_type: string;
  email: string;
  website?: string;
  description?: string;
  verified?: boolean;
}

export const KNOWN_STUDENTS: SearchStudent[] = [
  {
    id: 'stu-1',
    student_id: 'CS-2023-8941',
    full_name: 'Alex Chen',
    email: 'alex.chen@university.edu',
    department: 'Computer Science',
    year_of_study: 3,
    bio: 'Specializing in systems architectures, LLM agents, and distributed computing. VP of Association of Computing.',
    interests: ['Artificial Intelligence', 'Distributed Systems', 'Hackathons'],
    status: 'Active Student',
  },
  {
    id: 'stu-2',
    student_id: 'CS-2023-1102',
    full_name: 'Maya Lin',
    email: 'maya.lin@university.edu',
    department: 'Computer Science',
    year_of_study: 3,
    bio: 'Full-stack engineer and React enthusiast. Open source contributor and robotics club lead.',
    interests: ['Web Development', 'Robotics', 'UI/UX'],
    status: 'Active Student',
  },
  {
    id: 'stu-3',
    student_id: 'EE-2022-4910',
    full_name: 'Devin Vance',
    email: 'devin.vance@university.edu',
    department: 'Electrical Engineering',
    year_of_study: 4,
    bio: 'Hardware systems, FPGA design, and edge robotics researcher. Senior thesis on neuromorphic computing.',
    interests: ['Hardware Design', 'Embedded Systems', 'Robotics'],
    status: 'Final Year Lead',
  },
  {
    id: 'stu-4',
    student_id: 'DS-2024-3312',
    full_name: 'Priya Sharma',
    email: 'priya.sharma@university.edu',
    department: 'Data Science',
    year_of_study: 2,
    bio: 'Passionate about predictive modeling, causal inference, and biostatistics.',
    interests: ['Machine Learning', 'Data Visualization', 'Genomics'],
    status: 'Active Student',
  },
  {
    id: 'stu-5',
    student_id: 'BIO-2023-7741',
    full_name: 'Jordan Patel',
    email: 'jordan.patel@university.edu',
    department: 'Biomedical Engineering',
    year_of_study: 3,
    bio: 'Working on computational genomics and bio-MEMS sensors.',
    interests: ['Biotech', 'Synthetic Biology', 'Healthcare'],
    status: 'Active Student',
  },
  {
    id: 'stu-6',
    student_id: 'CS-2025-9012',
    full_name: 'Marcus Sterling',
    email: 'marcus.s@university.edu',
    department: 'Computer Science',
    year_of_study: 1,
    bio: 'First-year competitive programmer and cybersecurity CTF player.',
    interests: ['Cybersecurity', 'Algorithms', 'CTF'],
    status: 'Freshman Scholar',
  },
  {
    id: 'stu-7',
    student_id: 'ME-2023-2219',
    full_name: 'Elena Rostova',
    email: 'elena.r@university.edu',
    department: 'Mechanical Engineering',
    year_of_study: 3,
    bio: 'Aerodynamics, additive manufacturing, and Formula Student engineering lead.',
    interests: ['Aerospace', 'CAD/CAM', 'Automotive'],
    status: 'Active Student',
  },
  {
    id: 'stu-8',
    student_id: 'CS-2024-5510',
    full_name: 'Aarav Sharma',
    email: 'aarav.sharma@university.edu',
    department: 'Computer Science',
    year_of_study: 2,
    bio: 'Distributed ML and GPU inference optimization researcher.',
    interests: ['Deep Learning', 'PyTorch', 'Cloud Computing'],
    status: 'Active Student',
  },
  {
    id: 'stu-9',
    student_id: 'DS-2023-4122',
    full_name: 'Rohan Mehra',
    email: 'rohan.mehra@university.edu',
    department: 'Data Science',
    year_of_study: 3,
    bio: 'Natural language processing and semantic search architectures.',
    interests: ['NLP', 'Semantic Search', 'Vector Databases'],
    status: 'Active Student',
  },
  {
    id: 'stu-10',
    student_id: 'BUS-2023-6612',
    full_name: 'Ananya Deshmukh',
    email: 'ananya.d@university.edu',
    department: 'School of Management',
    year_of_study: 3,
    bio: 'Venture capital scout, student startup founder, and campus entrepreneurship lead.',
    interests: ['Venture Capital', 'Pitching', 'FinTech'],
    status: 'Active Student',
  },
  {
    id: 'stu-11',
    student_id: 'CS-2023-8821',
    full_name: 'Karan Patel',
    email: 'karan.patel@university.edu',
    department: 'Computer Science',
    year_of_study: 3,
    bio: 'Web3 and decentralized systems developer. Hacker and hackathon organizer.',
    interests: ['Web3', 'Smart Contracts', 'Frontend'],
    status: 'Active Student',
  },
  {
    id: 'stu-12',
    student_id: 'DES-2024-2190',
    full_name: 'Priya Iyer',
    email: 'priya.iyer@university.edu',
    department: 'Design & Fine Arts',
    year_of_study: 2,
    bio: 'Product designer, design systems specialist, and frontend designer.',
    interests: ['Design Systems', 'Figma', 'React'],
    status: 'Active Student',
  },
];

export const KNOWN_ORGANIZERS: SearchOrganizer[] = [
  {
    id: 'org-1',
    full_name: 'Dr. Sarah Jenkins',
    organization_name: 'Association of Computing & Engineering',
    organization_type: 'Department',
    email: 'association@university.edu',
    website: 'https://engineering.university.edu',
    description: 'Official academic committee governing undergraduate and graduate technical symposia, research summits, and guest keynote lectures.',
    verified: true,
  },
  {
    id: 'org-2',
    full_name: 'Marcus Vance',
    organization_name: 'Campus Venture Hub',
    organization_type: 'Student Hub & Incubator',
    email: 'venturehub@university.edu',
    website: 'https://venturehub.university.edu',
    description: 'Campus incubator supporting student founders, hosting demo days, angel investor mixers, and pitch competitions.',
    verified: true,
  },
  {
    id: 'org-3',
    full_name: 'Alex Vance',
    organization_name: 'CodeCell Society',
    organization_type: 'Student Technical Club',
    email: 'codecell@university.edu',
    website: 'https://codecell.university.edu',
    description: "The university's premier student coding community, organizing 24-hour hackathons, algorithmic code sprints, and open-source workshops.",
    verified: true,
  },
  {
    id: 'org-4',
    full_name: 'Prof. Alan Vance',
    organization_name: 'Quantum Physics Society',
    organization_type: 'Academic Department',
    email: 'quantum@university.edu',
    website: 'https://physics.university.edu',
    description: 'Advancing campus engagement in quantum computing, circuit simulation, linear algebra, and quantum algorithm design.',
    verified: true,
  },
  {
    id: 'org-5',
    full_name: 'Vikram Patel',
    organization_name: 'CyberSec Guild',
    organization_type: 'Security Research Society',
    email: 'cybersec@university.edu',
    website: 'https://cybersec.university.edu',
    description: 'Student-led security research group hosting university CTF tournaments, red team / blue team challenges, and defensive architecture labs.',
    verified: true,
  },
  {
    id: 'org-6',
    full_name: 'Elena Gomez',
    organization_name: 'Fine Arts & Culture Society',
    organization_type: 'Arts & Culture Committee',
    email: 'arts@university.edu',
    website: 'https://arts.university.edu',
    description: 'Curating campus art exhibitions, gallery openings, theatre performances, and inter-collegiate music festivals.',
    verified: true,
  },
  {
    id: 'org-7',
    full_name: 'Coach David Miller',
    organization_name: 'Campus Athletics Board',
    organization_type: 'Sports & Athletics Committee',
    email: 'athletics@university.edu',
    website: 'https://athletics.university.edu',
    description: 'Organizing collegiate sports leagues, inter-hostel tournaments, fitness challenges, and varsity athletics fixtures.',
    verified: true,
  },
  {
    id: 'org-8',
    full_name: 'Rachel Foster',
    organization_name: 'University Career Center',
    organization_type: 'Institutional Office',
    email: 'careers@university.edu',
    website: 'https://careers.university.edu',
    description: 'Connecting students with institutional recruitment partners, alumni mentorship networks, and career expos.',
    verified: true,
  },
];

interface GlobalSearchBarProps {
  placeholder?: string;
  className?: string;
  variant?: 'dark' | 'light';
  onSelectEvent?: (eventId: string) => void;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  placeholder = 'Search events, organizers, or student profiles...',
  className = '',
  variant = 'dark',
  onSelectEvent,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'events' | 'organizers' | 'students'>('all');

  // Selected profile previews
  const [selectedStudent, setSelectedStudent] = useState<SearchStudent | null>(null);
  const [selectedOrganizer, setSelectedOrganizer] = useState<SearchOrganizer | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Aggregate events (mockEvents + created)
  const allEvents = useMemo<Event[]>(() => {
    try {
      const local = localStorage.getItem('campusiq_created_events');
      if (local) {
        const parsed = JSON.parse(local);
        return [...parsed, ...mockEvents];
      }
    } catch {}
    return mockEvents;
  }, []);

  // Filtered matching items
  const matchedEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allEvents.slice(0, 5);

    return allEvents.filter((ev) => {
      const title = ev.title?.toLowerCase() || '';
      const desc = (ev.description || ev.short_description || '').toLowerCase();
      const cat = ev.category?.name?.toLowerCase() || '';
      const ven = ev.venue?.name?.toLowerCase() || '';
      const bld = ev.venue?.building?.toLowerCase() || '';
      const org = ev.organizer?.organization_name?.toLowerCase() || '';
      const tags = ev.tags?.map((t) => t.toLowerCase()) || [];

      return (
        title.includes(q) ||
        desc.includes(q) ||
        cat.includes(q) ||
        ven.includes(q) ||
        bld.includes(q) ||
        org.includes(q) ||
        tags.some((t) => t.includes(q))
      );
    });
  }, [allEvents, query]);

  const matchedOrganizers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return KNOWN_ORGANIZERS.slice(0, 4);

    return KNOWN_ORGANIZERS.filter((org) => {
      const orgName = org.organization_name.toLowerCase();
      const personName = org.full_name.toLowerCase();
      const email = org.email.toLowerCase();
      const type = org.organization_type.toLowerCase();
      const desc = (org.description || '').toLowerCase();

      return (
        orgName.includes(q) ||
        personName.includes(q) ||
        email.includes(q) ||
        type.includes(q) ||
        desc.includes(q)
      );
    });
  }, [query]);

  const matchedStudents = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return KNOWN_STUDENTS.slice(0, 4);

    return KNOWN_STUDENTS.filter((stu) => {
      const name = stu.full_name.toLowerCase();
      const studentId = stu.student_id.toLowerCase();
      const dept = stu.department.toLowerCase();
      const email = stu.email.toLowerCase();
      const bio = (stu.bio || '').toLowerCase();
      const interests = stu.interests?.map((i) => i.toLowerCase()) || [];

      return (
        name.includes(q) ||
        studentId.includes(q) ||
        dept.includes(q) ||
        email.includes(q) ||
        bio.includes(q) ||
        interests.some((i) => i.includes(q))
      );
    });
  }, [query]);

  const totalMatches = matchedEvents.length + matchedOrganizers.length + matchedStudents.length;

  const handleOpenEvent = (eventId: string) => {
    setIsOpen(false);
    if (onSelectEvent) {
      onSelectEvent(eventId);
    } else {
      navigate(`/events/${eventId}`);
    }
  };

  const handleSelectStudent = (stu: SearchStudent) => {
    setSelectedStudent(stu);
    setSelectedOrganizer(null);
  };

  const handleSelectOrganizer = (org: SearchOrganizer) => {
    setSelectedOrganizer(org);
    setSelectedStudent(null);
  };

  const handleClear = () => {
    setQuery('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input Box */}
      <div className="relative flex items-center">
        <Search
          className={`absolute left-3 w-4 h-4 pointer-events-none ${
            variant === 'dark' ? 'text-[#8ea79a]' : 'text-slate-400'
          }`}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          placeholder={placeholder}
          className={`w-full text-xs pl-9 pr-9 py-2 rounded-xl transition-all outline-none ${
            variant === 'dark'
              ? 'bg-[#1b4333] text-white placeholder-[#8ea79a] border border-[#26533f] focus:ring-2 focus:ring-[#d8fa57]/40 focus:border-[#387a5d]'
              : 'bg-white text-slate-800 placeholder-slate-400 border border-slate-200 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600'
          }`}
        />
        {query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 p-1 rounded-md text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span
            className={`absolute right-2.5 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
              variant === 'dark'
                ? 'bg-[#26533f] text-[#d8fa57]'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            ⌘K
          </span>
        )}
      </div>

      {/* Dropdown Results Overlay */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150 sm:min-w-[480px] md:min-w-[560px]">
          {/* Filter Pills Header */}
          <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  activeTab === 'all'
                    ? 'bg-[#113326] text-[#d8fa57]'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                All ({totalMatches})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('events')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
                  activeTab === 'events'
                    ? 'bg-[#113326] text-[#d8fa57]'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <Calendar className="w-3 h-3 text-[#e65c36]" />
                <span>Events ({matchedEvents.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('organizers')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
                  activeTab === 'organizers'
                    ? 'bg-[#113326] text-[#d8fa57]'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <Building2 className="w-3 h-3 text-purple-600" />
                <span>Organizers ({matchedOrganizers.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('students')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
                  activeTab === 'students'
                    ? 'bg-[#113326] text-[#d8fa57]'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <GraduationCap className="w-3 h-3 text-blue-600" />
                <span>Students ({matchedStudents.length})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick suggestions when query is empty */}
          {!query.trim() && (
            <div className="px-4 py-2.5 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2 text-[11px] text-slate-500 overflow-x-auto">
              <span className="font-semibold text-slate-400 uppercase tracking-wider shrink-0">Popular:</span>
              {['AI Symposium', 'CodeCell Society', 'HackNight', 'Alex Chen', 'Quantum Computing'].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:border-[#113326] hover:text-[#113326] transition-colors shrink-0 cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
          )}

          {/* Results Scroll Area */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100 p-2">
            {totalMatches === 0 ? (
              <div className="py-10 text-center space-y-2">
                <Search className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">No matching results found</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Try searching for keywords like "Hackathon", "Dr. Sarah", "CodeCell", or "Computer Science".
                </p>
              </div>
            ) : (
              <>
                {/* 1. MATCHED EVENTS */}
                {(activeTab === 'all' || activeTab === 'events') && matchedEvents.length > 0 && (
                  <div className="py-2 space-y-1">
                    <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#e65c36]" />
                      <span>Campus Events ({matchedEvents.length})</span>
                    </div>
                    {matchedEvents.map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => handleOpenEvent(ev.id)}
                        className="px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-slate-900 group-hover:text-[#e65c36] transition-colors truncate">
                              {ev.title}
                            </span>
                            {ev.category?.name && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                                {ev.category.name}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {ev.venue?.name || 'Campus Venue'}
                            </span>
                            <span>•</span>
                            <span>
                              {ev.start_datetime ? new Date(ev.start_datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Upcoming'}
                            </span>
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. MATCHED ORGANIZERS */}
                {(activeTab === 'all' || activeTab === 'organizers') && matchedOrganizers.length > 0 && (
                  <div className="py-2 space-y-1">
                    <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-purple-600" />
                      <span>Organizers & Clubs ({matchedOrganizers.length})</span>
                    </div>
                    {matchedOrganizers.map((org) => (
                      <div
                        key={org.id}
                        onClick={() => handleSelectOrganizer(org)}
                        className="px-3 py-2.5 rounded-xl hover:bg-purple-50/50 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-slate-900 group-hover:text-purple-700 transition-colors truncate">
                              {org.organization_name}
                            </span>
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 shrink-0">
                              {org.organization_type}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">
                            Lead: {org.full_name} • {org.email}
                          </p>
                        </div>

                        <span className="text-[11px] font-medium text-purple-600 group-hover:underline shrink-0">
                          View Profile
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. MATCHED STUDENTS */}
                {(activeTab === 'all' || activeTab === 'students') && matchedStudents.length > 0 && (
                  <div className="py-2 space-y-1">
                    <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                      <span>Student Profiles ({matchedStudents.length})</span>
                    </div>
                    {matchedStudents.map((stu) => (
                      <div
                        key={stu.id}
                        onClick={() => handleSelectStudent(stu)}
                        className="px-3 py-2.5 rounded-xl hover:bg-blue-50/50 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                              {stu.full_name}
                            </span>
                            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 shrink-0">
                              {stu.student_id}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">
                            {stu.department} • Year {stu.year_of_study}
                          </p>
                        </div>

                        <span className="text-[11px] font-medium text-blue-600 group-hover:underline shrink-0">
                          View Profile
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= STUDENT PROFILE MODAL ================= */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-150">
            {/* Header banner */}
            <div className="bg-[#113326] text-white p-5 relative">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-[#1b4333] hover:bg-[#26533f] text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl bg-[#d8fa57] text-[#113326] font-bold text-xl flex items-center justify-center shadow-md">
                  {selectedStudent.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-extrabold text-lg leading-tight text-white">
                    {selectedStudent.full_name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[#a6c1b3]">Student Profile</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#26533f] text-[#d8fa57] font-mono text-[10px] font-bold">
                      {selectedStudent.student_id}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Body */}
            <div className="p-5 space-y-4 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Department
                  </span>
                  <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
                    {selectedStudent.department}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Academic Year
                  </span>
                  <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
                    Year {selectedStudent.year_of_study} (Undergraduate)
                  </span>
                </div>
              </div>

              {selectedStudent.bio && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    About / Bio
                  </span>
                  <p className="text-slate-600 leading-relaxed bg-white border border-slate-100 p-3 rounded-xl">
                    {selectedStudent.bio}
                  </p>
                </div>
              )}

              {selectedStudent.interests && selectedStudent.interests.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Campus Focus & Skills
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStudent.interests.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200/60 text-blue-700 font-medium text-[11px]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Contact
                </span>
                <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedStudent.email}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 bg-[#113326] hover:bg-[#184433] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ORGANIZER PROFILE MODAL ================= */}
      {selectedOrganizer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-150">
            {/* Header banner */}
            <div className="bg-[#112b20] text-white p-5 relative">
              <button
                type="button"
                onClick={() => setSelectedOrganizer(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-[#1b4333] hover:bg-[#26533f] text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-2xl bg-[#e65c36] text-white font-bold text-xl flex items-center justify-center shadow-md">
                  <Building2 className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-lg leading-tight text-white">
                      {selectedOrganizer.organization_name}
                    </h3>
                    <CheckCircle2 className="w-4 h-4 text-[#d8fa57]" />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[#a6c1b3]">
                      Lead: {selectedOrganizer.full_name}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#1b4333] text-[#d8fa57] text-[10px] font-bold">
                      {selectedOrganizer.organization_type}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Body */}
            <div className="p-5 space-y-4 text-xs text-slate-700 max-h-[60vh] overflow-y-auto">
              {selectedOrganizer.description && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    About Organization
                  </span>
                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedOrganizer.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Official Email
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-700 text-xs font-semibold mt-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{selectedOrganizer.email}</span>
                  </div>
                </div>
                {selectedOrganizer.website && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Portal & Website
                    </span>
                    <a
                      href={selectedOrganizer.website}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-[#e65c36] hover:underline text-xs font-semibold mt-1"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span className="truncate">Visit Website</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Events hosted by this organizer */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Hosted Campus Events
                </span>
                <div className="space-y-2">
                  {allEvents
                    .filter(
                      (e) =>
                        e.organizer?.organization_name?.toLowerCase() ===
                          selectedOrganizer.organization_name.toLowerCase() ||
                        e.organizer?.full_name?.toLowerCase() ===
                          selectedOrganizer.full_name.toLowerCase()
                    )
                    .map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => {
                          setSelectedOrganizer(null);
                          handleOpenEvent(ev.id);
                        }}
                        className="p-2.5 rounded-xl border border-slate-200 hover:border-[#113326] hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-xs text-slate-900">{ev.title}</p>
                          <p className="text-[11px] text-slate-500">
                            {ev.venue?.name || 'Campus Venue'} • {ev.start_datetime ? new Date(ev.start_datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Upcoming'}
                          </p>
                        </div>
                        <span className="text-[11px] font-bold text-[#e65c36]">View →</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrganizer(null)}
                className="px-4 py-2 bg-[#112b20] hover:bg-[#1a3c2d] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
