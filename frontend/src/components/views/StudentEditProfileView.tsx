import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  X,
  Upload,
  Crop,
  Plus,
  Trash2,
  Award,
  Globe,
  Mail,
  Phone,
  Building,
  GraduationCap,
  Sparkles,
  ExternalLink,
  BookOpen,
  Calendar,
  Save,
  Trophy,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useStudentProfileStore, StudentAchievement } from '../../store/useStudentProfileStore';
import { useAuthStore } from '../../store/useAuthStore';
import { ImageCropperModal } from '../ui/ImageCropperModal';

// Clean SVG Brand Icons
export const GithubSvg: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

export const LinkedinSvg: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76c-.97 0-1.75-.79-1.75-1.76s.78-1.75 1.75-1.75 1.75.78 1.75 1.75-.78 1.76-1.75 1.76m1.4 9.74v-8.37H5.06v8.37h2.8z" />
  </svg>
);

interface StudentEditProfileViewProps {
  onBack?: () => void;
}

export const StudentEditProfileView: React.FC<StudentEditProfileViewProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const { profile, updateProfile, addAchievement, removeAchievement, addInterest, removeInterest } =
    useStudentProfileStore();
  const { user, updateUser } = useAuthStore();

  // Working form state
  const [formData, setFormData] = useState({ ...profile });
  const [newInterestInput, setNewInterestInput] = useState('');

  // New Achievement state
  const [newAchTitle, setNewAchTitle] = useState('');
  const [newAchSubtitle, setNewAchSubtitle] = useState('');
  const [newAchDate, setNewAchDate] = useState('');

  // Image Upload & Crop state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [rawImageToCrop, setRawImageToCrop] = useState<string | null>(null);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/student/profile');
    }
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

  const handleCropComplete = (croppedDataUrl: string) => {
    setFormData((prev) => ({ ...prev, avatarUrl: croppedDataUrl }));
    toast.success('Profile photo updated & cropped!');
  };

  const handleReCropExisting = () => {
    if (!formData.avatarUrl) return;
    setRawImageToCrop(formData.avatarUrl);
    setIsCropperOpen(true);
  };

  // Add new achievement
  const handleCreateAchievement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAchTitle.trim() || !newAchSubtitle.trim()) {
      toast.error('Please provide both an achievement title and description');
      return;
    }

    const newAch: StudentAchievement = {
      id: `ach-${Date.now()}`,
      title: newAchTitle.trim(),
      subtitle: newAchSubtitle.trim(),
      date: newAchDate.trim() || '2024',
    };

    setFormData((prev) => ({
      ...prev,
      achievements: [newAch, ...prev.achievements],
    }));

    setNewAchTitle('');
    setNewAchSubtitle('');
    setNewAchDate('');
    toast.success(`Added achievement: "${newAch.title}"`);
  };

  // Remove achievement from local form state
  const handleDeleteAchievement = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      achievements: prev.achievements.filter((a) => a.id !== id),
    }));
    toast.success('Achievement removed');
  };

  // Add Interest Tag
  const handleAddInterestTag = () => {
    const val = newInterestInput.trim();
    if (!val) return;
    if (formData.interests.includes(val)) {
      toast.error('Interest already added');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      interests: [...prev.interests, val],
    }));
    setNewInterestInput('');
  };

  // Remove Interest Tag
  const handleRemoveInterestTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.filter((i) => i !== tag),
    }));
  };

  // Save full profile
  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Update Student Profile Store
    updateProfile({
      ...formData,
      deptShort: formData.department.substring(0, 4).toUpperCase(),
    });

    // 2. Synchronize with useAuthStore if present
    if (user) {
      updateUser({
        ...user,
        full_name: formData.name,
        email: formData.email,
        department: formData.department,
        institute_name: formData.university,
        bio: formData.bio,
      } as any);
    }

    toast.success('Profile saved successfully!');
    handleBack();
  };

  return (
    <div className="w-full font-sans text-left space-y-6 max-w-6xl mx-auto pb-20">
      {/* 1. Top Status Banner Strip */}
      <div className="bg-[#0e261d] text-white px-5 py-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono shadow-xs border border-[#1b3d2f]">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-[#d8fa57] hover:underline font-bold mr-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Profile</span>
          </button>
          <span className="text-[#8ea79a]">/</span>
          <span className="text-white font-bold tracking-wider uppercase">
            {formData.name} · EDIT STUDENT PROFILE
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[#a4efb3] font-medium text-[11px] hidden md:inline">
            ● Changes save to campus portfolio & AI discovery
          </span>
        </div>
      </div>

      {/* 2. Main Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-[#e5e2d6] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#19231e] tracking-tight">Edit Your Profile</h1>
          <p className="text-xs sm:text-sm text-[#5f6e65] mt-1">
            Update your identity, social links (GitHub, LinkedIn, Portfolio), and list your achievements.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleBack}
            className="px-4 py-2 rounded-xl border border-[#dcd9ce] text-xs font-bold text-[#4a574f] hover:bg-[#fbf9f4] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#e65c36] hover:bg-[#d8522d] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Profile</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* ================= SECTION 1: PHOTO & AVATAR CROPPER ================= */}
        <div className="bg-white rounded-2xl p-6 border border-[#e5e2d6] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-[#e65c36]" />
            <h2 className="text-base font-bold text-[#19231e]">Profile Photo</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar Preview */}
            <div className="relative w-28 h-28 rounded-full overflow-hidden bg-[#204e3b] text-[#d8fa57] ring-4 ring-[#f4f2ea] shadow-sm shrink-0 flex items-center justify-center">
              {formData.avatarUrl ? (
                <img
                  src={formData.avatarUrl}
                  alt={formData.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as any).src =
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80';
                  }}
                />
              ) : (
                <span className="text-2xl font-bold">AR</span>
              )}
            </div>

            {/* Upload & Crop Controls */}
            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div>
                <h3 className="font-bold text-sm text-[#19231e]">Display Avatar</h3>
                <p className="text-xs text-[#738278] mt-0.5">
                  Clear square or circular portrait photos work best. Upload your image to crop and center it.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#112b20] hover:bg-[#1b4333] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload New Photo</span>
                </button>

                {formData.avatarUrl && (
                  <button
                    type="button"
                    onClick={handleReCropExisting}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#f4f2ea] hover:bg-[#ece8dc] text-[#2c3b31] text-xs font-semibold rounded-xl border border-[#dcd9ce] transition-colors cursor-pointer"
                  >
                    <Crop className="w-3.5 h-3.5 text-[#e65c36]" />
                    <span>Edit Current</span>
                  </button>
                )}
              </div>

              <p className="text-[11px] text-[#8e9c93]">
                Accepted formats: PNG, JPG, WebP up to 10MB. Custom interactive cropper lets you zoom and pan.
              </p>
            </div>
          </div>
        </div>

        {/* ================= SECTION 2: ACADEMIC & BASIC DETAILS ================= */}
        <div className="bg-white rounded-2xl p-6 border border-[#e5e2d6] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="w-4 h-4 text-[#e65c36]" />
            <h2 className="text-base font-bold text-[#19231e]">Academic & Contact Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#19231e] mb-1 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Aarav Rao"
                className="w-full bg-[#fbf9f4] border border-[#dcd9ce] rounded-xl px-3.5 py-2.5 text-xs text-[#19231e] focus:outline-none focus:ring-2 focus:ring-[#112b20]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#19231e] mb-1 uppercase tracking-wider">
                Campus Email
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-[#8ea79a] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. aarav.rao@northwood.edu"
                  className="w-full bg-[#fbf9f4] border border-[#dcd9ce] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-[#19231e] focus:outline-none focus:ring-2 focus:ring-[#112b20]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#19231e] mb-1 uppercase tracking-wider">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-[#8ea79a] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +1 (555) 234-5678"
                  className="w-full bg-[#fbf9f4] border border-[#dcd9ce] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-[#19231e] focus:outline-none focus:ring-2 focus:ring-[#112b20]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#19231e] mb-1 uppercase tracking-wider">
                Department
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. Computer Science"
                className="w-full bg-[#fbf9f4] border border-[#dcd9ce] rounded-xl px-3.5 py-2.5 text-xs text-[#19231e] focus:outline-none focus:ring-2 focus:ring-[#112b20]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#19231e] mb-1 uppercase tracking-wider">
                Year of Study
              </label>
              <select
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full bg-[#fbf9f4] border border-[#dcd9ce] rounded-xl px-3.5 py-2.5 text-xs text-[#19231e] focus:outline-none focus:ring-2 focus:ring-[#112b20]"
              >
                <option value="Year 1">Year 1 (Freshman)</option>
                <option value="Year 2">Year 2 (Sophomore)</option>
                <option value="Year 3">Year 3 (Junior)</option>
                <option value="Year 4">Year 4 (Senior)</option>
                <option value="Postgraduate">Postgraduate / Masters</option>
                <option value="PhD Candidate">PhD Candidate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#19231e] mb-1 uppercase tracking-wider">
                University / Institute
              </label>
              <div className="relative">
                <Building className="w-3.5 h-3.5 text-[#8ea79a] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.university}
                  onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                  placeholder="e.g. Northwood University"
                  className="w-full bg-[#fbf9f4] border border-[#dcd9ce] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-[#19231e] focus:outline-none focus:ring-2 focus:ring-[#112b20]"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#19231e] mb-1 uppercase tracking-wider">
              Major / Specialization
            </label>
            <input
              type="text"
              value={formData.major}
              onChange={(e) => setFormData({ ...formData, major: e.target.value })}
              placeholder="e.g. Distributed Systems & Machine Learning"
              className="w-full bg-[#fbf9f4] border border-[#dcd9ce] rounded-xl px-3.5 py-2.5 text-xs text-[#19231e] focus:outline-none focus:ring-2 focus:ring-[#112b20]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-[#19231e] uppercase tracking-wider">
                Bio & Academic Interests
              </label>
              <span className="text-[11px] text-[#738278]">
                {formData.bio?.length || 0} / 300 characters
              </span>
            </div>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              maxLength={300}
              rows={3}
              placeholder="Tell campus organizers and peers about what you study and what projects you are looking for..."
              className="w-full bg-[#fbf9f4] border border-[#dcd9ce] rounded-xl p-3.5 text-xs text-[#19231e] focus:outline-none focus:ring-2 focus:ring-[#112b20] leading-relaxed"
            />
          </div>
        </div>

        {/* ================= SECTION 3: SOCIAL & PORTFOLIO LINKS ================= */}
        <div className="bg-white rounded-2xl p-6 border border-[#e5e2d6] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#e65c36]" />
              <h2 className="text-base font-bold text-[#19231e]">
                Social & Professional Profiles
              </h2>
            </div>
            <span className="text-xs text-[#738278] hidden sm:inline">
              Shown to organizers and hackathon teammates
            </span>
          </div>

          <p className="text-xs text-[#5f6e65]">
            Add your GitHub, LinkedIn, and personal portfolio links so recruiters, club leads, and event organizers can view your work.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* GitHub */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#19231e] flex items-center gap-1.5 uppercase tracking-wider">
                  <GithubSvg className="w-3.5 h-3.5 text-[#19231e]" />
                  <span>GitHub</span>
                </label>
                {formData.github && (
                  <a
                    href={formData.github.startsWith('http') ? formData.github : `https://${formData.github}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-[#e65c36] hover:underline flex items-center gap-0.5 font-bold"
                  >
                    <span>Test link</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={formData.github}
                  onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                  placeholder="https://github.com/aarav-rao"
                  className="w-full bg-[#fbf9f4] border border-[#dcd9ce] rounded-xl px-3 py-2.5 text-xs text-[#19231e] focus:outline-none focus:ring-2 focus:ring-[#112b20]"
                />
              </div>
            </div>

            {/* LinkedIn */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#19231e] flex items-center gap-1.5 uppercase tracking-wider">
                  <LinkedinSvg className="w-3.5 h-3.5 text-[#0077b5]" />
                  <span>LinkedIn</span>
                </label>
                {formData.linkedin && (
                  <a
                    href={formData.linkedin.startsWith('http') ? formData.linkedin : `https://${formData.linkedin}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-[#e65c36] hover:underline flex items-center gap-0.5 font-bold"
                  >
                    <span>Test link</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  placeholder="https://linkedin.com/in/aaravrao"
                  className="w-full bg-[#fbf9f4] border border-[#dcd9ce] rounded-xl px-3 py-2.5 text-xs text-[#19231e] focus:outline-none focus:ring-2 focus:ring-[#112b20]"
                />
              </div>
            </div>

            {/* Portfolio */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#19231e] flex items-center gap-1.5 uppercase tracking-wider">
                  <Globe className="w-3.5 h-3.5 text-[#19754f]" />
                  <span>Portfolio Website</span>
                </label>
                {formData.portfolio && (
                  <a
                    href={formData.portfolio.startsWith('http') ? formData.portfolio : `https://${formData.portfolio}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-[#e65c36] hover:underline flex items-center gap-0.5 font-bold"
                  >
                    <span>Test link</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={formData.portfolio}
                  onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                  placeholder="https://aaravrao.dev"
                  className="w-full bg-[#fbf9f4] border border-[#dcd9ce] rounded-xl px-3 py-2.5 text-xs text-[#19231e] focus:outline-none focus:ring-2 focus:ring-[#112b20]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ================= SECTION 4: ACHIEVEMENTS & HONORS (ADD ACHIEVEMENTS) ================= */}
        <div className="bg-white rounded-2xl p-6 border border-[#e5e2d6] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#e65c36]" />
              <h2 className="text-base font-bold text-[#19231e]">Achievements & Honors</h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#eaf6ed] text-[#1f6b45] text-xs font-bold">
              {formData.achievements.length} listed
            </span>
          </div>

          <p className="text-xs text-[#5f6e65]">
            Add hackathon wins, academic distinctions, competition placements, and event attendance streaks.
          </p>

          {/* Add New Achievement Card */}
          <div className="bg-[#fbf9f4] border border-[#ebe7db] rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#112b20]" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#19231e]">
                + Add New Achievement
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5">
                <label className="block text-[11px] font-bold text-[#4a574f] mb-1">
                  Title / Award Name
                </label>
                <input
                  type="text"
                  value={newAchTitle}
                  onChange={(e) => setNewAchTitle(e.target.value)}
                  placeholder="e.g. Smart India Hackathon Winner"
                  className="w-full bg-white border border-[#dcd9ce] rounded-xl px-3 py-2 text-xs text-[#19231e] focus:outline-none focus:ring-2 focus:ring-[#112b20]"
                />
              </div>

              <div className="sm:col-span-5">
                <label className="block text-[11px] font-bold text-[#4a574f] mb-1">
                  Subtitle / Detail / Team Rank
                </label>
                <input
                  type="text"
                  value={newAchSubtitle}
                  onChange={(e) => setNewAchSubtitle(e.target.value)}
                  placeholder="e.g. 1st Place out of 450 teams nationwide"
                  className="w-full bg-white border border-[#dcd9ce] rounded-xl px-3 py-2 text-xs text-[#19231e] focus:outline-none focus:ring-2 focus:ring-[#112b20]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-[#4a574f] mb-1">Date / Year</label>
                <input
                  type="text"
                  value={newAchDate}
                  onChange={(e) => setNewAchDate(e.target.value)}
                  placeholder="e.g. Oct 2024"
                  className="w-full bg-white border border-[#dcd9ce] rounded-xl px-3 py-2 text-xs text-[#19231e] focus:outline-none focus:ring-2 focus:ring-[#112b20]"
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
              <span className="text-[#738278] font-medium mr-1">Quick ideas:</span>
              {[
                { title: 'Best UI/UX Award', sub: 'Design Hackathon 2024' },
                { title: 'Open Source Contributor', sub: 'Merged 12 PRs in CampusIQ' },
                { title: 'Robotics Champion', sub: 'RoboWars Season 4 Finalist' },
                { title: 'Dean’s Honor Roll', sub: 'GPA 3.9/4.0 · Fall 2024' },
              ].map((preset) => (
                <button
                  key={preset.title}
                  type="button"
                  onClick={() => {
                    setNewAchTitle(preset.title);
                    setNewAchSubtitle(preset.sub);
                    setNewAchDate('2024');
                  }}
                  className="px-2 py-0.5 rounded-lg bg-[#efece1] hover:bg-[#e4e0d4] text-[#3c4a41] text-[11px] font-medium transition-colors cursor-pointer"
                >
                  + {preset.title}
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleCreateAchievement}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#112b20] hover:bg-[#1b4333] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Achievement</span>
              </button>
            </div>
          </div>

          {/* Current Achievements List */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#738278]">
              Current Achievements ({formData.achievements.length})
            </h4>

            {formData.achievements.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-[#dcd9ce] rounded-xl text-xs text-[#738278]">
                No achievements added yet. Use the form above to add your first accomplishment!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formData.achievements.map((ach) => (
                  <div
                    key={ach.id}
                    className="bg-white border border-[#eeebe2] hover:border-[#dedbd0] rounded-xl p-3.5 flex items-start justify-between gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#f0eee6] text-[#e65c36] flex items-center justify-center shrink-0 mt-0.5">
                        <Award className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-bold text-xs sm:text-sm text-[#19231e] truncate">
                          {ach.title}
                        </h5>
                        <p className="text-xs text-[#738278] truncate mt-0.5">{ach.subtitle}</p>
                        {ach.date && (
                          <span className="inline-block mt-1 text-[10px] font-mono text-[#8e9c93]">
                            {ach.date}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteAchievement(ach.id)}
                      className="text-[#a4b3aa] hover:text-[#e65c36] p-1 rounded-lg hover:bg-[#fbf9f4] transition-colors cursor-pointer shrink-0"
                      title="Delete achievement"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ================= SECTION 5: INTERESTS & TAGS ================= */}
        <div className="bg-white rounded-2xl p-6 border border-[#e5e2d6] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#e65c36]" />
            <h2 className="text-base font-bold text-[#19231e]">Interests & Skill Topics</h2>
          </div>

          <p className="text-xs text-[#5f6e65]">
            These tags power your AI Match Score and personalized event recommendations on the campus dashboard.
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {formData.interests.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4f2ea] text-[#2c3b31] text-xs font-semibold border border-[#e2ded2]"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveInterestTag(tag)}
                  className="hover:text-red-500 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 max-w-md pt-2">
            <input
              type="text"
              value={newInterestInput}
              onChange={(e) => setNewInterestInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddInterestTag();
                }
              }}
              placeholder="Add interest (e.g. Web3, Flutter, Robotics)"
              className="flex-1 bg-[#fbf9f4] border border-[#dcd9ce] rounded-xl px-3.5 py-2 text-xs text-[#19231e] focus:outline-none focus:ring-2 focus:ring-[#112b20]"
            />
            <button
              type="button"
              onClick={handleAddInterestTag}
              className="px-3.5 py-2 bg-[#112b20] hover:bg-[#1b4333] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              + Add
            </button>
          </div>
        </div>

        {/* ================= BOTTOM STICKY SAVE BAR ================= */}
        <div className="sticky bottom-4 z-40 bg-[#112b20] text-white p-4 rounded-2xl shadow-xl border border-[#1b3d2f] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-[#c4d6cb] text-center sm:text-left">
            <span>Ready to publish your student profile updates across CampusIQ?</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#c4d6cb] hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#e65c36] hover:bg-[#d8522d] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Changes & View Profile</span>
            </button>
          </div>
        </div>
      </form>

      {/* ================= IMAGE CROPPER MODAL ================= */}
      <ImageCropperModal
        isOpen={isCropperOpen}
        onClose={() => setIsCropperOpen(false)}
        imageSrc={rawImageToCrop}
        onCropComplete={handleCropComplete}
        cropShape="round"
        title="Crop Student Avatar"
      />
    </div>
  );
};
