import React, { useState, useEffect } from 'react';
import { X, Terminal, Check } from 'lucide-react';
import { getLogLevel, setLogLevel, type LogLevel } from '@/utils/lteLogger';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LogLevelOption {
  value: LogLevel;
  label: string;
  description: string;
}

const LOG_LEVEL_OPTIONS: LogLevelOption[] = [
  {
    value: 'minimal',
    label: 'Minimal',
    description: 'Only critical errors',
  },
  {
    value: 'warning',
    label: 'Warning Only',
    description: 'Warnings and errors',
  },
  {
    value: 'full',
    label: 'Full - Dev Logging',
    description: 'All logs: requests, responses, state changes',
  },
];

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [currentLogLevel, setCurrentLogLevel] = useState<LogLevel>('warning');

  useEffect(() => {
    if (isOpen) {
      setCurrentLogLevel(getLogLevel());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleLogLevelChange = (level: LogLevel) => {
    setCurrentLogLevel(level);
    setLogLevel(level);
  };

  if (!isOpen) return null;

  return (
    <div className="te-settings-overlay">
      {/* Backdrop */}
      <div className="te-settings-backdrop" onClick={onClose} aria-hidden="true" />

      {/* Modal */}
      <div
        className="te-settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        {/* Header */}
        <div className="te-settings-header">
          <h2 id="settings-title" className="te-settings-title">
            [SETTINGS]
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="te-settings-close"
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="te-settings-content">
          {/* Console Logging Section */}
          <section className="te-settings-section">
            <div className="te-settings-section-header">
              <Terminal size={16} className="te-settings-section-icon" />
              <span className="te-settings-section-title">&gt; CONSOLE_LOGGING</span>
            </div>
            <p className="te-settings-section-desc">
              Control the verbosity of console output for debugging purposes.
            </p>

            <div className="te-settings-options">
              {LOG_LEVEL_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`te-settings-option ${currentLogLevel === option.value ? 'te-settings-option--active' : ''}`}
                >
                  <input
                    type="radio"
                    name="logLevel"
                    value={option.value}
                    checked={currentLogLevel === option.value}
                    onChange={() => handleLogLevelChange(option.value)}
                    className="te-settings-radio-input"
                  />
                  <div className="te-settings-option-check">
                    {currentLogLevel === option.value && <Check size={14} />}
                  </div>
                  <div className="te-settings-option-content">
                    <span className="te-settings-option-label">{option.label}</span>
                    <span className="te-settings-option-desc">{option.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="te-settings-footer">
          <span className="te-settings-hint">Settings are saved automatically</span>
          <button type="button" onClick={onClose} className="te-settings-done">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
