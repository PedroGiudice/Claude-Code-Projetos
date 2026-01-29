import React from 'react';
import { X, FileText, Clock, Loader2 } from 'lucide-react';
import type { HistoryEntry } from '@/types/textExtractor';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  entries: HistoryEntry[];
  isLoading: boolean;
  onSelect: (entry: HistoryEntry) => void;
}

export function HistoryPanel({
  isOpen,
  onClose,
  entries,
  isLoading,
  onSelect,
}: HistoryPanelProps) {
  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="te-history-overlay" onClick={onClose}>
      <div className="te-history-panel" onClick={(e) => e.stopPropagation()}>
        <div className="te-history-header">
          <span className="te-history-title">EXTRACTION HISTORY</span>
          <button
            type="button"
            onClick={onClose}
            className="te-history-close"
            aria-label="Close history"
          >
            <X size={16} />
          </button>
        </div>

        <div className="te-history-content">
          {isLoading ? (
            <div className="te-history-loading">
              <Loader2 className="te-spin" size={24} />
              <span>Loading history...</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="te-history-empty">
              <FileText size={32} className="te-history-empty-icon" />
              <span>No extractions in history</span>
              <span className="te-history-empty-hint">
                Extracted PDFs will appear here
              </span>
            </div>
          ) : (
            <ul className="te-history-list">
              {entries.map((entry) => (
                <li key={entry.file_hash}>
                  <button
                    type="button"
                    className="te-history-item"
                    onClick={() => onSelect(entry)}
                  >
                    <FileText size={16} className="te-history-item-icon" />
                    <div className="te-history-item-info">
                      <span className="te-history-item-name">{entry.file_name}</span>
                      <span className="te-history-item-date">
                        <Clock size={12} />
                        {formatDate(entry.cached_at)}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default HistoryPanel;
