import React, { useEffect, useRef } from 'react';
import { useTextExtractorStore } from '@/store/textExtractorStore';
import { Terminal, X, ChevronUp, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

interface ConsolePanelProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function ConsolePanel({ isCollapsed = false, onToggleCollapse }: ConsolePanelProps) {
  const { logs, clearLogs } = useTextExtractorStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current && !isCollapsed) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isCollapsed]);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getLogClass = (level: string): string => {
    switch (level) {
      case 'error':
        return 'te-log--error';
      case 'warning':
        return 'te-log--warning';
      case 'success':
        return 'te-log--success';
      default:
        return 'te-log--info';
    }
  };

  return (
    <div className={clsx('te-console', isCollapsed && 'te-console--collapsed')}>
      <div className="te-console-header">
        <div className="te-console-title">
          <Terminal size={14} className="te-icon-muted" />
          <span>CONSOLE</span>
        </div>
        <div className="te-console-actions">
          <button
            type="button"
            onClick={clearLogs}
            className="te-btn-clear"
            aria-label="Clear console"
          >
            <X size={12} />
            <span>CLEAR</span>
          </button>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="te-btn-collapse"
              aria-label={isCollapsed ? 'Expand console' : 'Collapse console'}
              aria-expanded={!isCollapsed}
            >
              {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className="te-console-content" ref={scrollRef}>
          {logs.map((log) => (
            <div
              key={log.id}
              className={clsx('te-log-entry', getLogClass(log.level))}
            >
              <span className="te-log-prefix">&gt;</span>
              <span className="te-log-time">[{formatTime(log.timestamp)}]</span>
              <span className="te-log-message">{log.message}</span>
            </div>
          ))}
          <div className="te-log-cursor">
            <span className="te-log-prefix">&gt;</span>
            <span className="te-cursor">_</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConsolePanel;
