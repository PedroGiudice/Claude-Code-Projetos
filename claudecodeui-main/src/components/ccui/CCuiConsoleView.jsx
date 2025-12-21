import React from 'react';
import { Trash2 } from 'lucide-react';
import useConsoleCapture from '../../hooks/useConsoleCapture';

const CCuiConsoleView = () => {
  const { logs, filter, setFilter, clearLogs, LOG_TYPES } = useConsoleCapture();

  const filters = [
    { id: 'all', label: 'All' },
    { id: LOG_TYPES.INFO, label: 'Info' },
    { id: LOG_TYPES.WARN, label: 'Warn' },
    { id: LOG_TYPES.ERROR, label: 'Error' },
    { id: LOG_TYPES.TOOL, label: 'Tools' },
  ];

  const getLogColor = (type) => {
    switch (type) {
      case LOG_TYPES.ERROR: return 'text-red-400';
      case LOG_TYPES.WARN: return 'text-yellow-400';
      case LOG_TYPES.TOOL: return 'text-ccui-accent';
      default: return 'text-ccui-text-secondary';
    }
  };

  const getLogBadge = (type) => {
    switch (type) {
      case LOG_TYPES.ERROR: return 'bg-red-500/20 text-red-400';
      case LOG_TYPES.WARN: return 'bg-yellow-500/20 text-yellow-400';
      case LOG_TYPES.TOOL: return 'bg-ccui-accent/20 text-ccui-accent';
      case LOG_TYPES.INFO: return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-ccui-bg-tertiary text-ccui-text-muted';
    }
  };

  return (
    <div className="h-full flex flex-col bg-ccui-bg-primary font-mono text-xs">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-ccui-border-primary bg-ccui-bg-secondary">
        {/* Filters */}
        <div className="flex gap-1">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                filter === f.id
                  ? 'bg-ccui-accent text-white'
                  : 'bg-ccui-bg-tertiary text-ccui-text-muted hover:bg-ccui-bg-hover'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Clear */}
        <button
          onClick={clearLogs}
          className="p-1 text-ccui-text-muted hover:text-ccui-text-primary transition-colors"
          title="Clear console"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Logs */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {logs.length === 0 ? (
          <div className="text-center text-ccui-text-muted py-8">
            No logs yet
          </div>
        ) : (
          logs.map(log => (
            <div
              key={log.id}
              className="flex items-start gap-2 py-1 px-2 hover:bg-ccui-bg-hover rounded"
            >
              <span className="text-ccui-text-muted shrink-0 w-20">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] uppercase ${getLogBadge(log.type)}`}>
                {log.type}
              </span>
              <span className={`flex-1 ${getLogColor(log.type)}`}>
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CCuiConsoleView;
