import React, { useState, useCallback, useRef, useEffect } from 'react';
import CCuiHeader from './CCuiHeader';
import CCuiIconRail from './CCuiIconRail';
import CCuiSidebar from './CCuiSidebar';
import CCuiStatusBar from './CCuiStatusBar';

/**
 * CCuiLayout - BASE-UI Pattern Layout
 *
 * Architecture:
 * - Icon Rail → Controls Sidebar content (NOT MainContent)
 * - MainContent → ALWAYS shows chat (passed as children)
 * - Sidebar → Dynamic content based on activeView
 *
 * This follows the Claude Desktop layout pattern.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Main content (usually ChatInterface)
 * @param {string} props.projectPath - Current project path for header
 * @param {string} props.currentModel - Current model name for header
 * @param {Array} props.sessions - Sessions list for sidebar history view
 * @param {Object} props.selectedSession - Currently selected session
 * @param {Function} props.onSessionSelect - Session selection callback
 * @param {Function} props.onNewSession - New session callback
 * @param {Function} props.onSettingsClick - Settings button callback
 * @param {boolean} props.isProcessing - Whether currently processing
 * @param {number} props.contextPercent - Context usage percentage (0-100)
 */
const CCuiLayout = ({
  children,
  projectPath = '~/project',
  currentModel = 'Claude Opus 4.5',
  sessions = [],
  selectedSession,
  onSessionSelect,
  onNewSession,
  onSettingsClick,
  isProcessing = false,
  contextPercent = 0,
}) => {
  // Sidebar view state - controlled by Icon Rail
  const [sidebarView, setSidebarView] = useState('chat');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef(null);

  // Handle sidebar resize
  const handleMouseDown = useCallback((e) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = e.clientX - 48; // 48px for icon rail
      if (newWidth >= 200 && newWidth <= 500) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div className="flex flex-col h-screen w-full bg-[#131211] text-[#e5e5e5] font-mono overflow-hidden">
      {/* Header */}
      <CCuiHeader
        projectPath={projectPath}
        currentModel={currentModel}
        onSettingsClick={onSettingsClick}
      />

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Icon Rail - Controls Sidebar View */}
        <CCuiIconRail
          activeView={sidebarView}
          onViewChange={setSidebarView}
          onSettingsClick={onSettingsClick}
          sidebarVisible={sidebarVisible}
          onSidebarToggle={() => setSidebarVisible(!sidebarVisible)}
        />

        {/* Dynamic Sidebar */}
        {sidebarVisible && (
          <div
            className="flex-shrink-0 relative"
            style={{ width: sidebarWidth }}
          >
            <CCuiSidebar
              activeView={sidebarView}
              sessions={sessions}
              selectedSession={selectedSession}
              onSessionSelect={onSessionSelect}
              onNewSession={onNewSession}
            />

            {/* Resize Handle */}
            <div
              ref={resizeRef}
              onMouseDown={handleMouseDown}
              className={`
                absolute top-0 right-0 w-1 h-full cursor-col-resize
                hover:bg-[#d97757]/50 transition-colors
                ${isResizing ? 'bg-[#d97757]' : 'bg-transparent'}
              `}
            />
          </div>
        )}

        {/* Main Content - ALWAYS shows children (ChatInterface) */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#131211]">
          {children}
        </div>
      </div>

      {/* Status Bar */}
      <CCuiStatusBar
        isProcessing={isProcessing}
        contextPercent={contextPercent}
      />
    </div>
  );
};

export default CCuiLayout;
