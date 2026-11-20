import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Mail,
  MapPin,
  Laptop,
  Calendar,
  Ticket,
  Check,
  Plus,
  Award,
  Zap,
  ArrowRight,
  Send,
  CheckCircle2,
  Edit3,
  Trophy,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/useAuthStore';
import { useStudentProfileStore } from '../../store/useStudentProfileStore';

interface StudentProfileViewProps {
  onBack?: () => void;
}

interface RecentEventItem {
  id: string;
  title: string;
  club: string;
  date: string;
  category: string;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { profile } = useStudentProfileStore();

  const [invitedAccepted, setInvitedAccepted] = useState(false);

  const recentEvents: RecentEventItem[] = [
    {
      id: 'e1',
      title: 'HackNight: Build & Ship',
      club: 'CodeCell Society',
      date: 'Sep 20',
      category: 'Technology',
    },
    {
      id: 'e2',
      title: 'CTF Bootcamp: Zero to Hacker',
      club: 'CyberSec Club',
      date: 'Sep 21',
      category: 'Career',
    },
    {
      id: 'e3',
      title: 'Monsoon Portfolio Critique',
      club: 'Fine Arts Society',
      date: 'Sep 21',
      category: 'Arts',
    },
    {
      id: 'e4',
      title: 'Inter-Hostel Football: Semis',
      club: 'Sports Committee',
      date: 'Sep 20',
      category: 'Sports',
    },
    {
      id: 'e5',
      title: 'RoboWars Season 4',
      club: 'Robotics Club',
      date: 'Aug 15',
      category: 'Technology',
    },
  ];

  const handleGoToEditPage = () => {
    navigate('/student/profile/edit');
  };

  return (
    <div className="w-full font-sans text-left space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Top Status Banner Strip */}
      <div className="bg-[#0e261d] text-white px-5 py-2.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono shadow-xs border border-[#1b3d2f]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[#e65c36] font-bold">—</span>
          <span className="text-white font-bold tracking-wider uppercase">
            {profile.name} · {profile.deptShort} {profile.year} · AI PROFILE · LIVE
          </span>
        </div>
        <div className="flex items-center gap-4 text-[#8ea79a]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse"></span>
            Profile is public to organizers
          </span>
          <button
            onClick={handleGoToEditPage}
            className="text-[#d8fa57] hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile Page</span>
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT COLUMN ================= */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
          {/* Card 1: Student Identity Card */}
          <div className="bg-white rounded-2xl p-6 border border-[#e5e2d6] shadow-[0_1px_3px_rgba(0,0,0,0.02)] text-center">
            {/* Circular Portrait Photo */}
            <div className="relative w-22 h-22 rounded-full mx-auto mb-3 overflow-hidden ring-4 ring-[#f4f2ea] shadow-sm">
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as any).src =
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80';
                }}
              />
            </div>

            <h2 className="text-xl font-extrabold text-[#19231e] tracking-tight">{profile.name}</h2>
            <p className="text-xs text-[#5f6e65] mt-0.5">
              {profile.department} · {profile.year} · {profile.university}
            </p>

            {/* Department / Year Badges */}
            <div className="flex items-center justify-center gap-2 mt-2.5 mb-5">
              <span className="px-2.5 py-0.5 rounded bg-[#f0eee6] text-[#4a574f] text-xs font-semibold">
                {profile.deptShort}
              </span>
              <span className="px-2.5 py-0.5 rounded bg-[#f0eee6] text-[#4a574f] text-xs font-semibold">
                {profile.year}
              </span>
            </div>

            {/* 3 Metrics Row with subtle dividers */}
            <div className="grid grid-cols-3 divide-x divide-[#eeebe2] py-3.5 border-y border-[#eeebe2] text-center">
              <div>
                <div className="text-xl font-extrabold text-[#19231e]">{profile.eventsCount}</div>
                <div className="text-[11px] text-[#738278] font-medium mt-0.5">Events</div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-[#19231e]">{profile.avgMatch}</div>
                <div className="text-[11px] text-[#738278] font-medium mt-0.5">Avg Match</div>
              </div>
              <div>
                <div className="text-xl font-extrabold text-[#19231e]">{profile.savedCount}</div>
                <div className="text-[11px] text-[#738278] font-medium mt-0.5">Saved</div>
              </div>
            </div>

            {/* Orange Edit Profile Button (navigates to dedicated edit page) */}
            <button
              onClick={handleGoToEditPage}
              className="w-full mt-5 py-2.5 bg-[#e65c36] hover:bg-[#d8522d] text-white font-bold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          </div>

          {/* Card 2: Your AI Profile Card */}
          <div className="bg-[#122b20] text-white rounded-2xl p-5 border border-[#1d3f30] shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                <Sparkles className="w-4 h-4 text-[#d8fa57]" />
                <span>Your AI Profile</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#1e4a36] text-[#a4efb3] text-[10px] font-bold uppercase tracking-wider">
                Live
              </span>
            </div>

            <div className="text-4xl font-extrabold text-white mt-3.5 font-mono tracking-tight">
              {profile.aiScore}
            </div>
            <div className="text-xs text-[#8ea79a] mt-0.5">avg. match this week</div>

            <p className="text-xs text-[#7f978a] mt-2.5 mb-3.5 leading-relaxed">
              Built from {profile.eventsCount} registrations, {profile.bookmarksCount} bookmarks & 46 searches.
            </p>

            {/* AI Topics / Filter Tags */}
            <div className="flex flex-wrap gap-1.5">
              {profile.interests.slice(0, 5).map((interest) => (
                <span
                  key={interest}
                  className="px-2.5 py-1 rounded bg-[#193a2b] border border-[#27533f] text-white text-xs font-medium"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>

          {/* Card 3: Contact & Info Card */}
          <div className="bg-white rounded-2xl p-5 border border-[#e5e2d6] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <h3 className="font-bold text-sm text-[#19231e] mb-3.5">Contact & Info</h3>
            <div className="space-y-3 text-xs text-[#4a574f]">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#8ea79a] shrink-0" />
                <span className="truncate">{profile.email}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#8ea79a] shrink-0" />
                <span className="truncate">{profile.university}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Laptop className="w-4 h-4 text-[#8ea79a] shrink-0" />
                <span className="truncate">{profile.major}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-[#8ea79a] shrink-0" />
                <span className="truncate">{profile.joinedDate}</span>
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
                EVENTS ATTENDED
              </div>
              <div className="text-3xl font-extrabold text-[#19231e] mt-1.5">{profile.eventsCount}</div>
              <div className="text-xs text-[#2b7247] font-semibold mt-1">+6 this semester</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#e5e2d6] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div className="text-[10px] font-mono font-bold tracking-wider text-[#738278] uppercase">
                AVG MATCH SCORE
              </div>
              <div className="text-3xl font-extrabold text-[#19231e] mt-1.5">{profile.avgMatch}</div>
              <div className="text-xs text-[#e65c36] font-semibold mt-1">Top 15% on campus</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#e5e2d6] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div className="text-[10px] font-mono font-bold tracking-wider text-[#738278] uppercase">
                INVITES ACCEPTED
              </div>
              <div className="text-3xl font-extrabold text-[#19231e] mt-1.5">
                {profile.invitesAcceptedRate}%
              </div>
              <div className="text-xs text-[#738278] font-medium mt-1">12 of 17 invites</div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#e5e2d6] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div className="text-[10px] font-mono font-bold tracking-wider text-[#738278] uppercase">
                BOOKMARKS
              </div>
              <div className="text-3xl font-extrabold text-[#19231e] mt-1.5">{profile.bookmarksCount}</div>
              <div className="text-xs text-[#738278] font-medium mt-1">12 events this week</div>
            </div>
          </div>

          {/* Row 2: Recent Events (7 cols) + Interests / Direct Invites (5 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Recent Events (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-[#e5e2d6] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <h3 className="font-bold text-base text-[#19231e] mb-4">Recent Events</h3>
              <div className="space-y-3">
                {recentEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-[#fbf9f4] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#f0eee6] text-[#4a574f] flex items-center justify-center shrink-0">
                        <Ticket className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-[#19231e] truncate">
                          {evt.title}
                        </h4>
                        <p className="text-[11px] text-[#738278] truncate mt-0.5">
                          {evt.club} · {evt.date}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-[#738278]">{evt.category}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#112b20]"></span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-[#eeebe2] mt-4">
                <button
                  onClick={() => navigate('/student/registrations')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#e65c36] hover:underline cursor-pointer"
                >
                  <span>View all {profile.eventsCount} events</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right stack: Interests + Direct Invites (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Interests Card */}
              <div className="bg-white rounded-2xl p-5 border border-[#e5e2d6] shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-[#19231e]">Interests</h3>
                  <button
                    onClick={handleGoToEditPage}
                    className="text-xs font-semibold text-[#e65c36] hover:underline cursor-pointer"
                  >
                    Manage
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {profile.interests.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded bg-[#f4f2ea] text-[#2c3b31] text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="pt-2">
                  <div className="text-[11px] font-bold text-[#738278] uppercase tracking-wider mb-2.5">
                    Interest strength
                  </div>
                  <div className="space-y-2.5 text-xs">
                    {profile.strengths.map((str) => (
                      <div key={str.name} className="flex items-center gap-3">
                        <span className="w-22 text-[#4a574f] font-medium shrink-0">{str.name}</span>
                        <div className="flex-1 bg-[#ece9de] rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[#112b20] h-full rounded-full transition-all duration-500"
                            style={{ width: `${str.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-right text-[11px] font-mono font-bold text-[#19231e] w-8">
                          {str.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Direct Invites Card */}
              <div className="bg-white rounded-2xl p-5 border border-[#e5e2d6] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <h3 className="font-bold text-base text-[#19231e] mb-3">Direct Invites</h3>

                <div className="bg-[#fbf9f4] border border-[#ebe7db] rounded-xl p-3.5">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#fae7e0] text-[#e65c36] flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs text-[#19231e] truncate">
                        CTF Bootcamp: Zero to Hacker
                      </h4>
                      <p className="text-[11px] text-[#6b7870] truncate mt-0.5">
                        CyberSec Club · 98% match for you
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 pl-10.5">
                    {invitedAccepted ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Accepted & Added to Schedule
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setInvitedAccepted(true);
                            toast.success('Accepted invitation! Added to schedule.');
                          }}
                          className="px-4 py-1.5 bg-[#112b20] hover:bg-[#1b4333] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => toast('Declined invite.')}
                          className="px-4 py-1.5 bg-[#e9e7df] hover:bg-[#dedad0] text-[#3b4740] text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Decline
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-2 text-xs text-[#738278]">
                  <div className="w-5 h-5 rounded-full bg-[#1b4333] text-[#d8fa57] text-[10px] font-bold flex items-center justify-center">
                    SK
                  </div>
                  <span>2 more invites waiting in inbox</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Achievements Section */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e5e2d6] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#e65c36]" />
                <h3 className="font-bold text-base text-[#19231e]">Achievements & Distinctions</h3>
              </div>
              <button
                onClick={handleGoToEditPage}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f4f2ea] hover:bg-[#ece8dc] text-[#19231e] text-xs font-bold rounded-xl border border-[#dedbd0] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-[#e65c36]" />
                <span>Add Achievement</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {profile.achievements.map((item) => (
                <div
                  key={item.id || item.title}
                  className="bg-[#fbf9f4] border border-[#eeebe2] rounded-xl p-4 text-center transition-all hover:border-[#dedbd0] hover:shadow-xs group"
                >
                  <div className="w-9 h-9 rounded-full bg-[#f0eee6] group-hover:bg-[#fae7e0] text-[#e65c36] flex items-center justify-center mx-auto mb-2.5 transition-colors">
                    <Award className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-sm text-[#19231e] line-clamp-1">{item.title}</h4>
                  <p className="text-xs text-[#738278] mt-1 line-clamp-2">{item.subtitle}</p>
                  {item.date && (
                    <span className="inline-block mt-2 text-[10px] font-mono text-[#8e9c93]">
                      {item.date}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
