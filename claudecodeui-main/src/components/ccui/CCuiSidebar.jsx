import React from 'react';
import FileTree from '../FileTree';
import GitPanel from '../GitPanel';
import Shell from '../Shell';
import CCuiSearchView from './CCuiSearchView';
import CCuiConsoleView from './CCuiConsoleView';
import { Clock, Plus } from 'lucide-react';

/**
 * CCuiSidebar - Dynamic sidebar that changes content based on activeView
 *
 * BASE-UI Pattern: Icon Rail controls sidebar content, not main content
 *
 * @param {Object} props
 * @param {string} props.activeView - 'chat' | 'files' | 'search' | 'shell' | 'git' | 'console'
 * @param {Array} props.sessions - Session list for chat view
 * @param {Object} props.selectedSession - Currently selected session
 * @param {Function} props.onSessionSelect - Session selection handler
 * @param {Function} props.onNewSession - New session handler
 */
const CCuiSidebar = ({
  activeView = 'chat',
  sessions = [],
  selectedSession,
  onSessionSelect,
  onNewSession,
  projectPath = '',
}) => {

  // Group sessions by time
  const groupSessionsByTime = (sessions) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    };

    sessions.forEach(session => {
      const date = new Date(session.lastActivity || session.createdAt);
      if (date >= today) {
        groups.today.push(session);
      } else if (date >= yesterday) {
        groups.yesterday.push(session);
      } else if (date >= weekAgo) {
        groups.thisWeek.push(session);
      } else {
        groups.older.push(session);
      }
    });

    return groups;
  };

  const renderChatHistory = () => {
    const groupedSessions = groupSessionsByTime(sessions);

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#252423]">
          <h2 className="text-sm font-medium text-[#e5e5e5]">History</h2>
          {onNewSession && (
            <button
              onClick={onNewSession}
              className="p-1 rounded hover:bg-[#252423] text-[#d97757] transition-colors"
              title="New Session"
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="px-4 py-8 text-center text-[rgba(255,255,255,0.4)] text-sm">
              No sessions yet
            </div>
          ) : (
            <>
              {groupedSessions.today.length > 0 && (
                <div className="py-2">
                  <div className="px-4 py-1 text-xs text-[rgba(255,255,255,0.4)] uppercase tracking-wider">Today</div>
                  {groupedSessions.today.map(session => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      isSelected={selectedSession?.id === session.id}
                      onSelect={() => onSessionSelect?.(session)}
                    />
                  ))}
                </div>
              )}

              {groupedSessions.yesterday.length > 0 && (
                <div className="py-2">
                  <div className="px-4 py-1 text-xs text-[rgba(255,255,255,0.4)] uppercase tracking-wider">Yesterday</div>
                  {groupedSessions.yesterday.map(session => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      isSelected={selectedSession?.id === session.id}
                      onSelect={() => onSessionSelect?.(session)}
                    />
                  ))}
                </div>
              )}

              {groupedSessions.thisWeek.length > 0 && (
                <div className="py-2">
                  <div className="px-4 py-1 text-xs text-[rgba(255,255,255,0.4)] uppercase tracking-wider">This Week</div>
                  {groupedSessions.thisWeek.map(session => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      isSelected={selectedSession?.id === session.id}
                      onSelect={() => onSessionSelect?.(session)}
                    />
                  ))}
                </div>
              )}

              {groupedSessions.older.length > 0 && (
                <div className="py-2">
                  <div className="px-4 py-1 text-xs text-[rgba(255,255,255,0.4)] uppercase tracking-wider">Older</div>
                  {groupedSessions.older.map(session => (
                    <SessionItem
                      key={session.id}
                      session={session}
                      isSelected={selectedSession?.id === session.id}
                      onSelect={() => onSessionSelect?.(session)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeView) {
      case 'chat':
        return renderChatHistory();
      case 'files':
        return (
          <div className="h-full">
            <div className="px-4 py-3 border-b border-[#252423]">
              <h2 className="text-sm font-medium text-[#e5e5e5]">Files</h2>
            </div>
            <FileTree projectPath={projectPath} />
          </div>
        );
      case 'search':
        return <CCuiSearchView />;
      case 'shell':
        return (
          <div className="h-full flex flex-col">
            <div className="px-4 py-3 border-b border-[#252423]">
              <h2 className="text-sm font-medium text-[#e5e5e5]">Shell</h2>
            </div>
            <div className="flex-1">
              <Shell />
            </div>
          </div>
        );
      case 'git':
        return (
          <div className="h-full">
            <div className="px-4 py-3 border-b border-[#252423]">
              <h2 className="text-sm font-medium text-[#e5e5e5]">Git</h2>
            </div>
            <GitPanel projectPath={projectPath} />
          </div>
        );
      case 'console':
        return <CCuiConsoleView />;
      default:
        return renderChatHistory();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1d1c1a] border-r border-[#252423] text-[#e5e5e5]">
      {renderContent()}
    </div>
  );
};

// Session item component
const SessionItem = ({ session, isSelected, onSelect }) => {
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <button
      onClick={onSelect}
      className={`
        w-full px-4 py-2 text-left transition-colors
        ${isSelected
          ? 'bg-[#252423] text-[#e5e5e5]'
          : 'text-[rgba(255,255,255,0.6)] hover:bg-[#252423]/50'
        }
      `}
    >
      <div className="text-sm truncate">
        {session.summary || session.name || 'New Session'}
      </div>
      <div className="flex items-center gap-1 mt-1 text-xs text-[rgba(255,255,255,0.4)]">
        <Clock size={10} />
        <span>{formatTime(session.lastActivity || session.createdAt)}</span>
      </div>
    </button>
  );
};

export default CCuiSidebar;
