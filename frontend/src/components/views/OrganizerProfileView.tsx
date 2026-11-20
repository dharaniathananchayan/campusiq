import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Mail,
  MapPin,
  Globe,
  Users,
  Ticket,
  Star,
  Check,
  X,
  Plus,
  Trash2,
  Edit3,
  Award,
  Zap,
  ArrowRight,
  Send,
  CheckCircle2,
  TrendingUp,
  Upload,
  Crop,
  Camera,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';
import { ImageCropperModal } from '../ui/ImageCropperModal';

interface OrganizerProfileViewProps {
  onBack?: () => void;
}

interface OrganizerEventItem {
  id: string;
  title: string;
  date: string;
  attendees: number;
  rating: number;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  avatarUrl?: string;
  initials: string;
}

export const OrganizerProfileView: React.FC<OrganizerProfileViewProps> = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInviteMemberModalOpen, setIsInviteMemberModalOpen] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');

  // Image Upload & Crop state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [rawImageToCrop, setRawImageToCrop] = useState<string | null>(null);

  // Initial organizer data based on Image 2
  const [profile, setProfile] = useState({
    organizationName: (user as any)?.organization_name || user?.full_name || 'CodeCell Society',
    clubType: 'Technology Club',
    university: (user as any)?.institute_name || 'Northwood University',
    logoUrl: '',
    about:
      "CodeCell Society is Northwood's premier tech & coding club. We organize hackathons, workshops, and industry connect events for CS, EE and Design students.",
    categories: ['Hackathon', 'Workshop', 'CTF', 'Networking', 'Robotics', 'Open Source'],
    email: user?.email || 'codecell@northwood.edu',
    website: 'codecell.northwood.edu',
    officeLocation: 'Innovation Block · Room 204',
    organizerCount: 4,
    activeEventsCount: 6,
    totalAttendees: '1,284',
    avgRating: '4.7/5',
    inviteAcceptRate: '68%',
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: 'm1',
      name: 'Meera Joshi',
      role: 'President',
      email: 'meera.joshi@northwood.edu',
      initials: 'MJ',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=128&q=80',
    },
    {
      id: 'm2',
      name: 'Dev Kothari',
      role: 'Tech Lead',
      email: 'dev.kothari@northwood.edu',
      initials: 'DK',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=80',
    },
    {
      id: 'm3',
      name: 'Ananya Menon',
      role: 'Design Lead',
      email: 'ananya.menon@northwood.edu',
      initials: 'AM',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80',
    },
    {
      id: 'm4',
      name: 'Rishi Verma',
      role: 'Logistics',
      email: 'rishi.verma@northwood.edu',
      initials: 'RV',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=128&q=80',
    },
  ]);

  // Edit form state
  const [formData, setFormData] = useState({ ...profile });

  const recentEvents: OrganizerEventItem[] = [
    {
      id: 'e1',
      title: 'HackNight: Build & Ship',
      date: 'Sep 20',
      attendees: 182,
      rating: 4.7,
    },
    {
      id: 'e2',
      title: 'CTF Bootcamp',
      date: 'Aug 15',
      attendees: 94,
      rating: 4.5,
    },
    {
      id: 'e3',
      title: 'RoboWars Season 4',
      date: 'Jul 10',
      attendees: 210,
      rating: 4.8,
    },
    {
      id: 'e4',
      title: 'Intro to Open Source',
      date: 'Jun 5',
      attendees: 67,
      rating: 4.3,
    },
  ];

  const handleOpenEdit = () => {
    setFormData({ ...profile });
    setIsEditModalOpen(true);
  };

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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please drop a valid image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setRawImageToCrop(reader.result as string);
      setIsCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    setFormData((prev) => ({ ...prev, logoUrl: croppedDataUrl }));
    toast.success('Organization emblem cropped & set!');
  };

  const handleReCropExisting = () => {
    if (!formData.logoUrl) return;
    setRawImageToCrop(formData.logoUrl);
    setIsCropperOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile({ ...formData });
    if (user) {
      updateUser({
        ...user,
        organization_name: formData.organizationName,
        email: formData.email,
        website: formData.website,
      } as any);
    }
    setIsEditModalOpen(false);
    toast.success('Organization profile updated successfully!');
  };

  const handleAddCategory = () => {
    if (!newCategoryInput.trim()) return;
    if (formData.categories.includes(newCategoryInput.trim())) {
      toast.error('Category already added');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      categories: [...prev.categories, newCategoryInput.trim()],
    }));
    setNewCategoryInput('');
  };

  const handleRemoveCategory = (cat: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c !== cat),
    }));
  };

  const handleAddTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim() || !newMemberRole.trim()) {
      toast.error('Please enter name, email and role');
      return;
    }
    const initials = newMemberName
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const newMember: TeamMember = {
      id: `m-${Date.now()}`,
      name: newMemberName.trim(),
      email: newMemberEmail.trim().toLowerCase(),
      role: newMemberRole.trim(),
      initials,
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80`,
    };

    setTeamMembers((prev) => [...prev, newMember]);
    setProfile((prev) => ({ ...prev, organizerCount: prev.organizerCount + 1 }));
    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberRole('');
    setIsInviteMemberModalOpen(false);
    toast.success(`Invited ${newMember.name} (${newMember.email}) to organizer team!`);
  };

  return (
    <div className="w-full font-sans text-left space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Top Status Banner Strip */}
      <div className="bg-[#0e261d] text-white px-5 py-2.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono shadow-xs border border-[#1b3d2f]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[#e65c36] font-bold">—</span>
          <span className="text-white font-bold tracking-wider uppercase">
            {profile.organizationName} · ORGANIZER PROFILE
          </span>
        </div>
        <div className="flex items-center gap-2 text-[#8fa99c] text-[11px] shrink-0">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>• Profile visible to all students</span>
        </div>
      </div>

      {/* 2. Main Multi-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT COLUMN ================= */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-5">
          {/* Card 1: Organizer Identity Card */}
          <div className="bg-white rounded-2xl p-6 border border-[#e5e2d6] shadow-[0_1px_3px_rgba(0,0,0,0.02)] text-center">
            {/* Logo Badge with optional custom cropped image or fallback letter */}
            <div className="relative w-20 h-20 rounded-2xl mx-auto mb-3.5 shadow-sm group">
              {profile.logoUrl ? (
                <img
                  src={profile.logoUrl}
                  alt={profile.organizationName}
                  className="w-full h-full object-cover rounded-2xl border border-[#dedbd4]"
                />
              ) : (
                <div className="w-full h-full rounded-2xl bg-[#e65c36] text-white font-extrabold text-3xl flex items-center justify-center">
                  {profile.organizationName.charAt(0).toUpperCase() || 'C'}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...profile });
                  setIsEditModalOpen(true);
                  setTimeout(() => fileInputRef.current?.click(), 100);
                }}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#112b20] hover:bg-[#e65c36] text-white rounded-full flex items-center justify-center border-2 border-white shadow-xs transition-colors cursor-pointer"
                title="Change & crop club emblem"
              >
                <Camera className="w-3.5 h-3.5 text-[#d8fa57]" />
              </button>
            </div>

            <h2 className="text-xl font-extrabold text-[#19231e] tracking-tight">{profile.organizationName}</h2>
            <p className="text-xs text-[#5f6e65] mt-0.5">
              {profile.clubType} · {profile.university}
            </p>

            {/* Badges: PRO and Verified */}
            <div className="flex items-center justify-center gap-2 mt-2.5 mb-5">
              <span className="px-2 py-0.5 rounded bg-[#112b20] text-[#d8fa57] text-[10px] font-bold font-mono uppercase tracking-wider">
                PRO
              </span>
              <span className="px-2 py-0.5 rounded bg-[#1f6b45] text-white text-[10px] font-bold">
                Verified
              </span>
            </div>

            {/* 3 Metrics Row with subtle dividers */}
            <div className="grid grid-cols-3 divide-x divide-[#eeebe2] py-3.5 border-y border-[#eeebe2] text-center">
              <div>
                <div className="text-xl font-extrabold text-[#19231e]">{profile.activeEventsCount}</div>
                <div className="text-[11px] text-[#738278] font-medium mt-0.5">Active</div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-[#19231e]">{profile.totalAttendees}</div>
                <div className="text-[11px] text-[#738278] font-medium mt-0.5">Attendees</div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-[#19231e]">{profile.avgRating.split('/')[0]}</div>
                <div className="text-[11px] text-[#738278] font-medium mt-0.5">Rating</div>
              </div>
            </div>

            {/* Orange Edit Profile Button */}
            <button
              onClick={handleOpenEdit}
              className="w-full mt-5 py-2.5 bg-[#e65c36] hover:bg-[#d8522d] text-white font-bold text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Edit Profile
            </button>
          </div>

          {/* Card 2: About Card */}
          <div className="bg-white rounded-2xl p-5 border border-[#e5e2d6] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <h3 className="font-bold text-sm text-[#19231e] mb-2">About</h3>
            <p className="text-xs text-[#526359] leading-relaxed">{profile.about}</p>
          </div>

          {/* Card 3: Event Categories Card */}
          <div className="bg-white rounded-2xl p-5 border border-[#e5e2d6] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <h3 className="font-bold text-sm text-[#19231e] mb-3">Event Categories</h3>
            <div className="flex flex-wrap gap-1.5">
              {profile.categories.map((cat) => (
                <span
                  key={cat}
                  className="px-2.5 py-1 rounded bg-[#f4f2ea] text-[#2c3b31] text-xs font-medium"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {/* Card 4: Contact Card */}
          <div className="bg-white rounded-2xl p-5 border border-[#e5e2d6] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <h3 className="font-bold text-sm text-[#19231e] mb-3.5">Contact</h3>
            <div className="space-y-3 text-xs text-[#4a574f]">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#8ea79a] shrink-0" />
                <span className="truncate">{profile.email}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-[#8ea79a] shrink-0" />
                <span className="truncate">{profile.website}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#8ea79a] shrink-0" />
                <span className="truncate">{profile.officeLocation}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-[#8ea79a] shrink-0" />
                <span className="truncate">{profile.organizerCount} organizers</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT / CENTER COLUMN ================= */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          {/* Row 1: 4 Top Stat Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#e5e2d6] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div className="text-[10px] font-mono font-bold tracking-wider text-[#738278] uppercase">
                TOTAL ATTENDEES
              </div>
              <div className="text-3xl font-extrabold text-[#19231e] mt-1.5">{profile.totalAttendees}</div>
              <div className="text-xs text-[#2b7247] font-semibold mt-1">+18% vs last term</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#e5e2d6] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div className="text-[10px] font-mono font-bold tracking-wider text-[#738278] uppercase">
                AVG RATING
              </div>
              <div className="text-3xl font-extrabold text-[#19231e] mt-1.5">{profile.avgRating}</div>
              <div className="text-xs text-[#738278] font-medium mt-1">312 reviews analysed</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#e5e2d6] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div className="text-[10px] font-mono font-bold tracking-wider text-[#738278] uppercase">
                ACTIVE EVENTS
              </div>
              <div className="text-3xl font-extrabold text-[#19231e] mt-1.5">
                {profile.activeEventsCount} live
              </div>
              <div className="text-xs text-[#c2410c] font-medium mt-1">2 drafts need review</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#e5e2d6] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div className="text-[10px] font-mono font-bold tracking-wider text-[#738278] uppercase">
                INVITE ACCEPTS
              </div>
              <div className="text-3xl font-extrabold text-[#19231e] mt-1.5">{profile.inviteAcceptRate}</div>
              <div className="text-xs text-[#e65c36] font-semibold mt-1">Top 10% on campus</div>
            </div>
          </div>

          {/* Row 2: Recent Events + Team Members */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Recent Events (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-[#e5e2d6] shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-[#19231e] mb-4">Recent Events</h3>
                <div className="divide-y divide-[#eeebe2]">
                  {recentEvents.map((ev) => (
                    <div key={ev.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#f4f2ea] text-[#6b7870] flex items-center justify-center shrink-0">
                          <Ticket className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs sm:text-sm text-[#19231e] truncate">{ev.title}</h4>
                          <p className="text-[11px] text-[#738278]">{ev.date}</p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2 text-xs">
                        <span className="text-[#4a574f] font-medium">{ev.attendees} attendees</span>
                        <div className="flex items-center gap-0.5 text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{ev.rating}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#eeebe2] mt-2">
                <button
                  onClick={() => navigate('/organizer/events')}
                  className="text-xs font-semibold text-[#e65c36] hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <span>View all events</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Team Members (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-[#e5e2d6] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base text-[#19231e]">Team Members</h3>
                <span className="text-xs font-semibold text-[#738278]">{teamMembers.length} active</span>
              </div>
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#fbf9f4] transition-colors">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-[#204e3b] text-[#d8fa57] font-bold text-xs flex items-center justify-center shrink-0">
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={member.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as any).style.display = 'none';
                          }}
                        />
                      ) : (
                        member.initials
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-bold text-xs sm:text-sm text-[#19231e] truncate">{member.name}</h4>
                        <span className="text-[10px] text-[#55695f] bg-[#f4f2ea] px-2 py-0.5 rounded-md font-medium shrink-0">
                          {member.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#738278] truncate mt-0.5">
                        <Mail className="w-3 h-3 text-[#94a39b] shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setIsInviteMemberModalOpen(true)}
                className="w-full mt-4 py-2 border border-dashed border-[#cfd7d2] hover:border-[#112b20] text-xs font-semibold text-[#4a574f] rounded-xl hover:bg-[#f8f7f3] transition-colors cursor-pointer"
              >
                + Invite team member
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= EDIT ORGANIZER PROFILE MODAL ================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl border border-[#dedbd4] shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#112b20] text-white px-6 py-4 flex items-center justify-between border-b border-[#1b3d2f]">
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-5 h-5 text-[#d8fa57]" />
                <h3 className="font-bold text-lg text-white">Edit Organizer Profile</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-[#1b3d2f] hover:bg-[#25523f] text-[#c4d6cb] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProfile} className="p-6 space-y-5 text-left max-h-[75vh] overflow-y-auto">
              {/* Row 1: Org Name & Club Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#19231e] mb-1 uppercase tracking-wider">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={formData.organizationName}
                    onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                    className="w-full bg-[#fbf9f4] border border-[#dcd9ce] rounded-xl px-3.5 py-2.5 text-xs text-[#19231e] focus:outline-none focus:ring-2 focus:ring-[#112b20]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#19231e] mb-1 uppercase tracking-wider">
                    Club / Committee Type
                  </label>
                  <input
                    type="text"
                    value={formData.clubType}
                    onChange={(e) => setFormData({ ...formData, clubType: e.target.value })}
                    className="w-full bg-[#fbf9f4] border border-[#dcd9ce] rounded-xl px-3.5 py-2.5 text-xs text-[#19231e] focus:outline-none focus:ring-2 focus:ring-[#112b20]"
                    placeholder="e.g. Technology Club"
                    required
                  />
                </div>
              </div>

              {/* Row 2: University & Office Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#19231e] mb-1 uppercase tracking-wider">
                    University / Institute
                  </label>
                  <input
                    type="text"
                    value={formData.university}
                    onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                    className="w-full bg-[#fbf9f4] border border-[#dcd9ce] rounded-xl px-3.5 py-2.5 text-xs text-[#19231e] focus:outline-none focus:ring-2 focus:ring-[#112b20]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#19231e] mb-1 uppercase tracking-wider">
                    Office / Lab Location
                  </label>
                  <input
                    type="text"
                    value={formData.officeLocation}
                    onChange={(e) => setFormData({ ...formData, officeLocation: e.target.value })}
                    className="w-full bg-[#fbf9f4] border border-[#dcd9ce] rounded-xl px-3.5 py-2.5 text-xs text-[#19231e] focus:outline-none focus:ring-2 focus:ring-[#112b20]"
                    placeholder="e.g. Innovation Block · Room 204"
                    required
                  />
                </div>
              </div>

              {/* Row 3: Email & Website */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#19231e] mb-1 uppercase tracking-wider">
                    Official Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#fbf9f4] border border-[#dcd9ce] rounded-xl px-3.5 py-2.5 text-xs text-[#19231e] focus:outline-none focus:ring-2 focus:ring-[#112b20]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#19231e] mb-1 uppercase tracking-wider">
                    Website or Portal URL
                  </label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full bg-[#fbf9f4] border border-[#dcd9ce] rounded-xl px-3.5 py-2.5 text-xs text-[#19231e] focus:outline-none focus:ring-2 focus:ring-[#112b20]"
                    placeholder="e.g. codecell.northwood.edu"
                    required
                  />
                </div>
              </div>

              {/* Row 4: Organization Emblem / Logo Upload & Crop */}
              <div>
                <label className="block text-xs font-bold text-[#19231e] mb-1.5 uppercase tracking-wider">
                  Organization Emblem / Logo
                </label>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="p-4 bg-[#fbf9f4] border-2 border-dashed border-[#dcd9ce] hover:border-[#112b20] rounded-2xl flex flex-col sm:flex-row items-center gap-4 transition-all"
                >
                  {/* Current Emblem Preview */}
                  <div className="w-18 h-18 rounded-2xl overflow-hidden shrink-0 shadow-sm flex items-center justify-center bg-[#e8e6dc]">
                    {formData.logoUrl ? (
                      <img
                        src={formData.logoUrl}
                        alt="Logo preview"
                        className="w-full h-full object-cover rounded-2xl border border-[#dedbd4]"
                      />
                    ) : (
                      <div className="w-full h-full rounded-2xl bg-[#e65c36] text-white font-extrabold text-2xl flex items-center justify-center">
                        {formData.organizationName.charAt(0).toUpperCase() || 'C'}
                      </div>
                    )}
                  </div>

                  {/* Actions & Instructions */}
                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 bg-[#112b20] hover:bg-[#1a4030] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#d8fa57]" />
                        <span>Upload Logo</span>
                      </button>

                      {formData.logoUrl && (
                        <button
                          type="button"
                          onClick={handleReCropExisting}
                          className="px-3.5 py-2 bg-white hover:bg-[#f4f2ea] text-[#19231e] border border-[#dcd9ce] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Crop className="w-3.5 h-3.5 text-[#e65c36]" />
                          <span>Edit Current</span>
                        </button>
                      )}

                      {formData.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, logoUrl: '' }))}
                          className="px-2.5 py-2 text-xs font-medium text-[#738278] hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          Use Letter Badge
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-[#738278]">
                      Drop emblem image here, or click to upload and crop (PNG, JPG, WebP)
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 5: About description */}
              <div>
                <label className="block text-xs font-bold text-[#19231e] mb-1 uppercase tracking-wider">
                  About the Organization
                </label>
                <textarea
                  rows={3}
                  value={formData.about}
                  onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                  className="w-full bg-[#fbf9f4] border border-[#dcd9ce] rounded-xl px-3.5 py-2.5 text-xs text-[#19231e] focus:outline-none focus:ring-2 focus:ring-[#112b20]"
                  required
                ></textarea>
              </div>

              {/* Row 5: Categories Editor */}
              <div>
                <label className="block text-xs font-bold text-[#19231e] mb-1 uppercase tracking-wider">
                  Event Categories
                </label>
                <div className="flex flex-wrap gap-2 mb-2 p-3 bg-[#fbf9f4] border border-[#dcd9ce] rounded-xl min-h-12">
                  {formData.categories.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white text-[#19231e] border border-[#d5d2c6] text-xs font-medium shadow-2xs"
                    >
                      {cat}
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(cat)}
                        className="text-[#999] hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCategory();
                      }
                    }}
                    placeholder="Add category (e.g. Gaming, Design, Career) and press Enter"
                    className="flex-1 bg-[#fbf9f4] border border-[#dcd9ce] rounded-xl px-3.5 py-2 text-xs text-[#19231e] focus:outline-none focus:ring-2 focus:ring-[#112b20]"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="px-3.5 py-2 bg-[#112b20] hover:bg-[#1a4030] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-[#dedbd4] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#dcd9ce] text-xs font-bold text-[#4a574f] hover:bg-[#fbf9f4] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#e65c36] hover:bg-[#d8522d] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= INVITE TEAM MEMBER MODAL ================= */}
      {isInviteMemberModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md border border-[#dedbd4] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#112b20] text-white px-6 py-4 flex items-center justify-between border-b border-[#1b3d2f]">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-[#d8fa57]" />
                <h3 className="font-bold text-base text-white">Invite Team Member</h3>
              </div>
              <button
                onClick={() => setIsInviteMemberModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-[#1b3d2f] hover:bg-[#25523f] text-[#c4d6cb] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTeamMember} className="p-6 space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-[#19231e] mb-1 uppercase tracking-wider">
                  Member Name
                </label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="e.g. Rohan Sen"
                  className="w-full bg-[#fbf9f4] border border-[#dcd9ce] rounded-xl px-3.5 py-2.5 text-xs text-[#19231e] focus:outline-none focus:ring-2 focus:ring-[#112b20]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#19231e] mb-1 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-[#8b9991] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="e.g. rohan.sen@northwood.edu"
                    className="w-full bg-[#fbf9f4] border border-[#dcd9ce] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-[#19231e] focus:outline-none focus:ring-2 focus:ring-[#112b20]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#19231e] mb-1 uppercase tracking-wider">
                  Role / Title
                </label>
                <input
                  type="text"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  placeholder="e.g. Workshop Coordinator"
                  className="w-full bg-[#fbf9f4] border border-[#dcd9ce] rounded-xl px-3.5 py-2.5 text-xs text-[#19231e] focus:outline-none focus:ring-2 focus:ring-[#112b20]"
                  required
                />
              </div>

              <div className="pt-3 border-t border-[#dedbd4] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsInviteMemberModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#dcd9ce] text-xs font-bold text-[#4a574f] hover:bg-[#fbf9f4] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#e65c36] hover:bg-[#d8522d] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ================= IMAGE CROPPER MODAL ================= */}
      <ImageCropperModal
        isOpen={isCropperOpen}
        onClose={() => setIsCropperOpen(false)}
        imageSrc={rawImageToCrop}
        onCropComplete={handleCropComplete}
        cropShape="rect"
        title="Crop Organization Emblem"
      />
    </div>
  );
};
