import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { DocumentViewer } from '@/components/document/DocumentViewer';
import { AnnotationList } from '@/components/document/AnnotationList';
import { ToastContainer } from '@/components/ui/Toast';

export function MainLayout() {
  return (
    <div className="flex flex-col h-screen bg-[#1e1e2e] text-[#e4e4e7]"> {/* Apply main background and primary text color */}
      {/* Header */}
      <Header />

      {/* Main content - 3 columns */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Upload and patterns */}
        <div className="w-[20%] bg-[#181825] border-r border-[#3f3f46] flex flex-col"> {/* Apply left sidebar background and right border, add flex-col to allow content to grow */}
          <Sidebar />
        </div>

        {/* Center - Document viewer */}
        <main className="w-[60%] overflow-hidden"> {/* Apply 60% width */}
          <DocumentViewer />
        </main>

        {/* Right sidebar - Annotations */}
        <aside className="w-[20%] bg-[#181825] border-l border-[#3f3f46] flex flex-col"> {/* Apply right sidebar background and left border, add flex-col */}
          <AnnotationList />
        </aside>
      </div>

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
}
