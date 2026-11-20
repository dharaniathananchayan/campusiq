import React from 'react';
import { PageLayout } from '../../components/layout/PageLayout';
import { RAGChatWindow } from '../../components/ai/RAGChatWindow';
import { Bot } from 'lucide-react';

export const StudentAIAssistantPage: React.FC = () => {
  return (
    <PageLayout withSidebar>
      <div className="space-y-6 text-left max-w-5xl mx-auto">
        <div className="pb-4 border-b border-slate-200/80 space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Natural Language Discovery</span>
            <span>•</span>
            <span className="text-blue-600">RAG Semantic Index</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Bot className="w-6 h-6 text-blue-600" />
            Campus AI Assistant
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Ask questions regarding workshop schedules, prerequisite courses, seat availability, or venue wayfinding in natural language.
          </p>
        </div>
        <RAGChatWindow />
      </div>
    </PageLayout>
  );
};
