import React from 'react';
import { Clock, Plus } from 'lucide-react';

/**
 * Helper function to group sessions by time
 * @param {Array} sessions - Array of session objects with timestamp
 * @returns {Object} Grouped sessions by time category
 */
const groupSessionsByTime = (sessions) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const groups = {
    today: [],
    yesterday: [],
    previous7Days: [],
    older: []
  };

  sessions.forEach(session => {
    const sessionDate = new Date(session.timestamp);

    if (sessionDate >= today) {
      groups.today.push(session);
    } else if (sessionDate >= yesterday) {
      groups.yesterday.push(session);
    } else if (sessionDate >= sevenDaysAgo) {
      groups.previous7Days.push(session);
    } else {
      groups.older.push(session);
    }
  });

  return groups;
};

/**
 * Format time for display
 * @param {Date|string|number} timestamp
 * @returns {string} Formatted time (HH:MM)
 */
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * SessionGroup - Renders a group of sessions
 */
const SessionGroup = ({ title, sessions, activeSessionId, onSessionSelect }) => {
  if (sessions.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="px-3 mb-1.5 text-xxs font-bold text-ccui-text-subtle uppercase tracking-wider">
        {title}
      </div>
      {sessions.map(session => {
        const isActive = session.id === activeSessionId;

        return (
          <div
            key={session.id}
            onClick={() => onSessionSelect(session.id)}
            className={`px-3 py-2 cursor-pointer border-l-2 transition-all ${
              isActive
                ? 'border-ccui-accent bg-ccui-bg-active'
                : 'border-transparent hover:bg-ccui-bg-hover'
            }`}
          >
            <div className={`text-xs truncate ${
              isActive
                ? 'text-ccui-text-primary font-medium'
                : 'text-ccui-text-secondary'
            }`}>
              {session.title || 'New Chat'}
            </div>
            <div className="text-xxs text-ccui-text-subtle mt-0.5 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {formatTime(session.timestamp)}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * CCuiSidebar - Chat-centric sidebar with temporal session grouping
 *
 * @param {Object} props
 * @param {Array} props.sessions - Array of session objects
 * @param {string} props.activeSessionId - Currently active session ID
 * @param {Function} props.onSessionSelect - Session select handler
 * @param {Function} props.onNewChat - New chat button click handler
 */
const CCuiSidebar = ({
  sessions = [],
  activeSessionId,
  onSessionSelect,
  onNewChat
}) => {
  const groupedSessions = groupSessionsByTime(sessions);

  return (
    <aside className="w-60 bg-ccui-bg-secondary border-r border-ccui-border-primary flex flex-col z-40">
      {/* Header */}
      <div className="h-9 border-b border-ccui-border-primary flex items-center justify-between px-3">
        <span className="text-xxs uppercase font-bold tracking-wider text-ccui-text-muted">
          Chats
        </span>
      </div>

      {/* New Chat Button */}
      <div className="p-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 bg-ccui-bg-hover hover:bg-ccui-border-secondary text-ccui-text-primary text-xs py-1.5 rounded border border-ccui-border-tertiary transition-colors group"
        >
          <Plus className="w-3.5 h-3.5 text-ccui-text-muted group-hover:text-ccui-accent" />
          <span>New Chat</span>
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto ccui-scrollbar py-2">
        <SessionGroup
          title="TODAY"
          sessions={groupedSessions.today}
          activeSessionId={activeSessionId}
          onSessionSelect={onSessionSelect}
        />
        <SessionGroup
          title="YESTERDAY"
          sessions={groupedSessions.yesterday}
          activeSessionId={activeSessionId}
          onSessionSelect={onSessionSelect}
        />
        <SessionGroup
          title="PREVIOUS 7 DAYS"
          sessions={groupedSessions.previous7Days}
          activeSessionId={activeSessionId}
          onSessionSelect={onSessionSelect}
        />
        <SessionGroup
          title="OLDER"
          sessions={groupedSessions.older}
          activeSessionId={activeSessionId}
          onSessionSelect={onSessionSelect}
        />

        {sessions.length === 0 && (
          <div className="px-3 py-8 text-center text-ccui-text-subtle text-xs">
            No chats yet. Start a new conversation!
          </div>
        )}
      </div>
    </aside>
  );
};

export default CCuiSidebar;
