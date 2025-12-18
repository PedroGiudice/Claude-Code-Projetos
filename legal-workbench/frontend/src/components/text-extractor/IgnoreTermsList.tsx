import React, { useState, useCallback } from 'react';
import { useTextExtractorStore } from '@/store/textExtractorStore';
import { X, Plus, ChevronDown } from 'lucide-react';

export function IgnoreTermsList() {
  const { ignoreTerms, addIgnoreTerm, removeIgnoreTerm, loadPreset, status } =
    useTextExtractorStore();
  const [newTerm, setNewTerm] = useState('');
  const [showPresetMenu, setShowPresetMenu] = useState(false);

  const isDisabled = status === 'processing';

  const handleAddTerm = useCallback(() => {
    if (newTerm.trim()) {
      addIgnoreTerm(newTerm);
      setNewTerm('');
    }
  }, [newTerm, addIgnoreTerm]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTerm();
      }
    },
    [handleAddTerm]
  );

  const handlePresetSelect = (preset: 'lgpd' | 'court' | 'contract') => {
    loadPreset(preset);
    setShowPresetMenu(false);
  };

  return (
    <div className="te-ignore-terms">
      <div className="te-subsection-header">
        <span className="te-command">&gt; IGNORE_TERMS (LGPD/Headers)</span>
      </div>

      <div className="te-terms-container">
        <div className="te-terms-list" role="list" aria-label="Ignore terms list">
          {ignoreTerms.map((term, index) => (
            <div key={`${term}-${index}`} className="te-term-item" role="listitem">
              <span className="te-term-text">{term}</span>
              <button
                type="button"
                onClick={() => removeIgnoreTerm(term)}
                disabled={isDisabled}
                className="te-term-remove"
                aria-label={`Remove term: ${term}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="te-term-add">
          <input
            type="text"
            value={newTerm}
            onChange={(e) => setNewTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="+ Add term..."
            disabled={isDisabled}
            className="te-term-input"
            aria-label="Add new ignore term"
          />
          <button
            type="button"
            onClick={handleAddTerm}
            disabled={isDisabled || !newTerm.trim()}
            className="te-btn-add"
            aria-label="Add term"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="te-preset-dropdown">
          <button
            type="button"
            onClick={() => setShowPresetMenu(!showPresetMenu)}
            disabled={isDisabled}
            className="te-btn-preset"
            aria-expanded={showPresetMenu}
            aria-haspopup="listbox"
          >
            <span>Load preset:</span>
            <ChevronDown size={14} className={showPresetMenu ? 'te-rotate-180' : ''} />
          </button>

          {showPresetMenu && (
            <div className="te-preset-menu" role="listbox">
              <button
                type="button"
                onClick={() => handlePresetSelect('lgpd')}
                className="te-preset-option"
                role="option"
              >
                LGPD (Default)
              </button>
              <button
                type="button"
                onClick={() => handlePresetSelect('court')}
                className="te-preset-option"
                role="option"
              >
                Court Documents
              </button>
              <button
                type="button"
                onClick={() => handlePresetSelect('contract')}
                className="te-preset-option"
                role="option"
              >
                Contracts
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default IgnoreTermsList;
