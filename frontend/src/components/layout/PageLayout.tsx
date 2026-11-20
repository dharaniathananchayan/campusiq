import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

interface PageLayoutProps {
  children: React.ReactNode;
  withSidebar?: boolean;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ children, withSidebar = false }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
      <Navbar />
      <div className="flex-1 flex w-full max-w-7xl mx-auto">
        {withSidebar && <Sidebar />}
        <main className="flex-1 p-5 sm:p-7 lg:p-8 w-full overflow-x-hidden text-left">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};
