import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { aiApi } from '../../api/ai';
import { PageLayout } from '../../components/layout/PageLayout';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Sparkles, ArrowRight, CheckCircle2, Sliders } from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudentAIMatchesPage: React.FC = () => {
  const { data: matches = [], isLoading } = useQuery({
    queryKey: ['eventMatches'],
    queryFn: () => aiApi.getEventMatches(10),
  });

  return (
    <PageLayout withSidebar>
      <div className="space-y-8 text-left">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#DFE0E2]">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-[10px] font-extrabold uppercase tracking-widest text-[#75AABB]">
              <span>CURATED DISCOVERY</span>
              <span>•</span>
              <span className="text-[#071013] font-bold">RECOMMENDED FOR YOU</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#071013] flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#21B3D2]/10 text-[#21B3D2] flex items-center justify-center border border-[#21B3D2]/20 shrink-0">
                <Sparkles className="w-6 h-6 stroke-[2]" />
              </div>
              Events You Might Like
            </h1>
            <p className="text-sm font-medium text-[#071013]/60 max-w-2xl leading-relaxed">
              Curated campus activities matched with your interests and department.
            </p>
          </div>

          <Link to="/student/profile">
            <Button variant="outline" size="sm" leftIcon={<Sliders className="w-3.5 h-3.5" />}>
              Adjust Interests
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <LoadingSpinner text="Finding campus events for you..." />
        ) : matches.length === 0 ? (
          <Card className="py-16 text-center border-dashed border-[#DFE0E2] bg-white">
            <Sparkles className="w-8 h-8 text-[#A2ADBB] mx-auto mb-3 opacity-60" />
            <h3 className="text-sm font-bold text-[#071013]">No recommendations generated yet</h3>
            <p className="text-xs text-[#071013]/60 mt-1 max-w-sm mx-auto">
              Explore more campus events or submit feedback to help our system learn your extracurricular preferences.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {matches.map((item, idx) => {
              return (
                <Card
                  key={idx}
                  hoverable
                  className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.event.category && (
                        <Badge variant="neutral" size="sm">
                          {item.event.category.name}
                        </Badge>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-[#071013] tracking-tight">
                        {item.event.title}
                      </h3>
                      <p className="text-xs text-[#071013]/70 line-clamp-2 mt-1 leading-relaxed">
                        {item.event.short_description || item.event.description}
                      </p>
                    </div>

                    {/* Match Reasons */}
                    {item.match_reasons && item.match_reasons.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {item.match_reasons.map((r, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg bg-[#FAFAFB] border border-[#DFE0E2] text-[#071013]/80 font-medium"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 stroke-[2]" />
                            <span>{r}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 w-full md:w-auto">
                    <Link to={`/events/${item.event.id}`}>
                      <Button
                        variant="primary"
                        size="md"
                        className="w-full md:w-auto"
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                      >
                        View & Register
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageLayout>
  );
};
