import React from 'react';
import { PageLayout } from '../../components/layout/PageLayout';
import { CoPilotChatWindow } from '../../components/ai/CoPilotChatWindow';
import { Sparkles } from 'lucide-react';

export const OrganizerAICopilotPage: React.FC = () => {
  return (
    <PageLayout withSidebar>
      <div className="space-y-6 text-left max-w-6xl mx-auto">
        <div className="pb-4 border-b border-slate-200/80 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>AI Event Orchestration</span>
            <span>•</span>
            <span className="text-purple-600">Smart Drafting</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-purple-600" />
            AI Event Co-Pilot Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Converse with AI to draft event titles, session curricula, department targets, and seat capacity limits in seconds.
          </p>
        </div>
        <CoPilotChatWindow />
      </div>
    </PageLayout>
  );
};
