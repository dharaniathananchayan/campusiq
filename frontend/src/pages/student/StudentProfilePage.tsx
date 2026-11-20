import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { aiApi } from '../../api/ai';
import { useAuthStore } from '../../store/useAuthStore';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { User, Sparkles, RefreshCw, GraduationCap, Mail, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const StudentProfilePage: React.FC = () => {
  const { user } = useAuthStore();

  const { data: profile, refetch, isFetching } = useQuery({
    queryKey: ['interestProfile'],
    queryFn: () => aiApi.getInterestProfile(),
  });

  const handleRebuild = async () => {
    try {
      await aiApi.rebuildInterestProfile();
      toast.success('Interest profile updated from your engagement activity!');
      refetch();
    } catch {
      toast.error('Failed to rebuild profile');
    }
  };

  return (
    <PageLayout withSidebar>
      <div className="space-y-8 max-w-4xl text-left">
        {/* Header */}
        <div className="pb-6 border-b border-[#DFE0E2] space-y-2">
          <div className="flex items-center space-x-2 text-[10px] font-extrabold uppercase tracking-widest text-[#75AABB]">
            <span>ACADEMIC IDENTITY</span>
            <span>•</span>
            <span className="text-[#071013] font-bold">STUDENT DOSSIER</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#071013] flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#21B3D2]/10 text-[#21B3D2] flex items-center justify-center border border-[#21B3D2]/20 shrink-0">
              <User className="w-6 h-6 stroke-[2]" />
            </div>
            Student Profile & Preferences
          </h1>
          <p className="text-sm font-medium text-[#071013]/60 max-w-2xl leading-relaxed">
            Manage your university credentials, department affiliations, and view AI semantic topic weights.
          </p>
        </div>

        {/* Profile Info Card */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-[#071013] text-white font-black text-2xl flex items-center justify-center border-2 border-[#DFE0E2] shrink-0 shadow-sm">
              {user?.full_name?.slice(0, 2).toUpperCase() || 'ST'}
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-black tracking-tight text-[#071013]">{user?.full_name}</h2>
                <Badge variant="primary">{(user as any)?.department || 'Computer Science'}</Badge>
                <Badge variant="neutral">Year {(user as any)?.year_of_study || 1}</Badge>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[#071013]/70 pt-1">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#21B3D2]" />
                  <span>{user?.email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-[#21B3D2]" />
                  <span>Student ID: {(user as any)?.student_id || 'STU-2026-081'}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* AI Interest Profile */}
        <Card className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DFE0E2]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#21B3D2]/10 text-[#21B3D2] flex items-center justify-center border border-[#21B3D2]/20">
                  <Sparkles className="w-4 h-4 stroke-[2]" />
                </div>
                <h3 className="font-bold text-lg text-[#071013] tracking-tight">
                  AI-Learned Extracurricular Weights
                </h3>
              </div>
              <p className="text-xs font-medium text-[#071013]/60">
                Vector weights calculated dynamically from your event registrations, bookmarks, and evaluations.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRebuild}
              isLoading={isFetching}
              leftIcon={<RefreshCw className="w-3.5 h-3.5 text-[#21B3D2]" />}
            >
              Recompute Profile
            </Button>
          </div>

          {profile ? (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[#FAFAFB] border border-[#DFE0E2] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#A2ADBB] block">
                    Campus Engagement Index
                  </span>
                  <p className="text-xs text-[#071013]/60 mt-0.5">
                    Calculated from overall platform participation
                  </p>
                </div>
                <span className="text-2xl font-black text-[#21B3D2] tabular-nums">
                  {profile.engagement_score.toFixed(1)} <span className="text-xs font-bold text-[#A2ADBB]">PTS</span>
                </span>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#75AABB] mb-3">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Extracted Affinity Vectors</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(profile.keyword_interests || {}).length === 0 ? (
                    <p className="text-xs text-[#071013]/50">No topic affinities discovered yet.</p>
                  ) : (
                    Object.entries(profile.keyword_interests || {}).map(([kw, score]) => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAFAFB] border border-[#DFE0E2] text-xs text-[#071013] font-medium"
                      >
                        <span className="font-semibold text-[#071013]">{kw}</span>
                        <span className="text-[10px] font-bold text-[#21B3D2] tabular-nums">
                          {(score as number).toFixed(1)}
                        </span>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[#071013]/50">
              No interest profile computed yet. Attend events or rate sessions to generate insights.
            </div>
          )}
        </Card>
      </div>
    </PageLayout>
  );
};
