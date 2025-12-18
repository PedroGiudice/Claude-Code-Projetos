import React from 'react';
import { useTextExtractorStore } from '@/store/textExtractorStore';
import { Loader2 } from 'lucide-react';

export function ProgressOverlay() {
  const { status, progress } = useTextExtractorStore();

  if (status !== 'processing') {
    return null;
  }

  return (
    <div className="te-overlay" role="dialog" aria-modal="true" aria-label="Processing">
      <div className="te-overlay-content">
        <Loader2 size={48} className="te-spin te-icon-accent" />
        <div className="te-overlay-text">
          <span className="te-command">&gt; PROCESSING...</span>
          <span className="te-progress-text">{progress}% complete</span>
        </div>
        <div className="te-progress-bar te-progress-bar--large">
          <div
            className="te-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="te-hint">Please wait while we extract text from your PDF</span>
      </div>
    </div>
  );
}

export default ProgressOverlay;
