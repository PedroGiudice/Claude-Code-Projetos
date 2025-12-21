import { useState, useEffect, useCallback } from 'react';

// Log types
const LOG_TYPES = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  TOOL: 'tool',
  DEBUG: 'debug'
};

const useConsoleCapture = () => {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');

  // Add log entry
  const addLog = useCallback((type, message, meta = {}) => {
    setLogs(prev => [...prev, {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      type,
      message,
      meta
    }]);
  }, []);

  // Intercept console methods
  useEffect(() => {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args) => {
      addLog(LOG_TYPES.INFO, args.map(String).join(' '));
      originalLog.apply(console, args);
    };

    console.warn = (...args) => {
      addLog(LOG_TYPES.WARN, args.map(String).join(' '));
      originalWarn.apply(console, args);
    };

    console.error = (...args) => {
      addLog(LOG_TYPES.ERROR, args.map(String).join(' '));
      originalError.apply(console, args);
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, [addLog]);

  // Filter logs
  const filteredLogs = logs.filter(log =>
    filter === 'all' || log.type === filter
  );

  // Clear logs
  const clearLogs = useCallback(() => setLogs([]), []);

  return {
    logs: filteredLogs,
    allLogs: logs,
    filter,
    setFilter,
    addLog,
    clearLogs,
    LOG_TYPES
  };
};

export default useConsoleCapture;
