import React from 'react';
import { useTextExtractorStore } from '@/store/textExtractorStore';
import { RotateCcw } from 'lucide-react';

const DEFAULT_MARGINS = {
  top: 15,
  bottom: 20,
  left: 10,
  right: 10,
};

export function MarginPreview() {
  const { margins, setMargins, status } = useTextExtractorStore();
  const isDisabled = status === 'processing';

  const handleMarginChange = (key: keyof typeof margins, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setMargins({ ...margins, [key]: numValue });
    }
  };

  const handleReset = () => {
    setMargins({ ...DEFAULT_MARGINS });
  };

  // Calculate percentages for visual preview (scale down for display)
  const scale = 0.3;
  const topPct = margins.top * scale;
  const bottomPct = margins.bottom * scale;
  const leftPct = margins.left * scale;
  const rightPct = margins.right * scale;

  return (
    <div className="te-margin-preview">
      <div className="te-subsection-header">
        <span className="te-command">&gt; MARGIN_CROP</span>
      </div>

      <div className="te-margin-container">
        <div className="te-margin-visual">
          {/* Gray overlay areas representing cropped regions */}
          <div
            className="te-margin-overlay te-margin-top"
            style={{ height: `${topPct}%` }}
          />
          <div
            className="te-margin-overlay te-margin-bottom"
            style={{ height: `${bottomPct}%` }}
          />
          <div
            className="te-margin-overlay te-margin-left"
            style={{
              width: `${leftPct}%`,
              top: `${topPct}%`,
              height: `${100 - topPct - bottomPct}%`,
            }}
          />
          <div
            className="te-margin-overlay te-margin-right"
            style={{
              width: `${rightPct}%`,
              top: `${topPct}%`,
              height: `${100 - topPct - bottomPct}%`,
            }}
          />

          {/* Extraction area (visible zone) */}
          <div
            className="te-extraction-area"
            style={{
              top: `${topPct}%`,
              left: `${leftPct}%`,
              right: `${rightPct}%`,
              bottom: `${bottomPct}%`,
            }}
          >
            <span className="te-extraction-label">EXTRACTION AREA</span>
            <span className="te-extraction-hint">(white = kept)</span>
          </div>
        </div>

        <div className="te-margin-controls">
          <div className="te-margin-input-group">
            <label className="te-margin-label">Top:</label>
            <input
              type="number"
              value={margins.top}
              onChange={(e) => handleMarginChange('top', e.target.value)}
              disabled={isDisabled}
              className="te-margin-input"
              min={0}
              max={100}
              aria-label="Top margin in pixels"
            />
            <span className="te-margin-unit">px</span>
          </div>

          <div className="te-margin-input-group">
            <label className="te-margin-label">Left:</label>
            <input
              type="number"
              value={margins.left}
              onChange={(e) => handleMarginChange('left', e.target.value)}
              disabled={isDisabled}
              className="te-margin-input"
              min={0}
              max={100}
              aria-label="Left margin in pixels"
            />
            <span className="te-margin-unit">px</span>
          </div>

          <div className="te-margin-input-group">
            <label className="te-margin-label">Right:</label>
            <input
              type="number"
              value={margins.right}
              onChange={(e) => handleMarginChange('right', e.target.value)}
              disabled={isDisabled}
              className="te-margin-input"
              min={0}
              max={100}
              aria-label="Right margin in pixels"
            />
            <span className="te-margin-unit">px</span>
          </div>

          <div className="te-margin-input-group">
            <label className="te-margin-label">Bottom:</label>
            <input
              type="number"
              value={margins.bottom}
              onChange={(e) => handleMarginChange('bottom', e.target.value)}
              disabled={isDisabled}
              className="te-margin-input"
              min={0}
              max={100}
              aria-label="Bottom margin in pixels"
            />
            <span className="te-margin-unit">px</span>
          </div>

          <button
            type="button"
            onClick={handleReset}
            disabled={isDisabled}
            className="te-btn-reset"
            aria-label="Reset margins to defaults"
          >
            <RotateCcw size={14} />
            <span>Reset to defaults</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default MarginPreview;
