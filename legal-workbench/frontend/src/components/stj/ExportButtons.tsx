import { useState, useCallback, memo } from 'react';
import { FileText, FileJson, Download, Loader2 } from 'lucide-react';
import { useSTJStore } from '@/store/stjStore';
import type { ExportFormat } from '@/services/stjApi';

/**
 * ExportButtons Component
 *
 * Small component providing CSV and JSON export buttons for STJ search results.
 * Uses current search parameters from the store to generate exports.
 *
 * @example
 * // Usage in parent component:
 * import { ExportButtons } from '@/components/stj/ExportButtons';
 *
 * function SearchResults() {
 *   return (
 *     <div>
 *       <h2>Resultados</h2>
 *       <ExportButtons />
 *     </div>
 *   );
 * }
 *
 * @example
 * // With disabled state when no results:
 * <ExportButtons disabled={results.length === 0} />
 */

interface ExportButtonsProps {
  /** Disable export buttons */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Show compact version (icon only) */
  compact?: boolean;
}

export const ExportButtons = memo(function ExportButtons({
  disabled = false,
  className = '',
  compact = false,
}: ExportButtonsProps) {
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { exportResults, total } = useSTJStore();

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (disabled || exportingFormat) return;

      setExportingFormat(format);
      setError(null);

      try {
        await exportResults(format);
      } catch (err) {
        setError(`Erro ao exportar ${format.toUpperCase()}`);
        // Clear error after 3 seconds
        setTimeout(() => setError(null), 3000);
      } finally {
        setExportingFormat(null);
      }
    },
    [disabled, exportingFormat, exportResults]
  );

  const isExporting = exportingFormat !== null;
  const isDisabled = disabled || total === 0;

  return (
    <div className={`flex items-center gap-2 ${className}`} role="group" aria-label="Exportar resultados">
      {/* CSV Button */}
      <button
        type="button"
        onClick={() => handleExport('csv')}
        disabled={isDisabled || isExporting}
        className={`
          inline-flex items-center gap-1.5
          ${compact ? 'px-2 py-1.5' : 'px-3 py-1.5'}
          bg-bg-panel-2 border border-border-default rounded
          text-text-secondary text-sm font-medium
          hover:bg-border-default hover:text-text-primary hover:border-accent-indigo/50
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-bg-panel-2 disabled:hover:text-text-secondary disabled:hover:border-border-default
          transition-colors
          focus:outline-none focus:ring-2 focus:ring-accent-indigo focus:ring-offset-1 focus:ring-offset-bg-main
        `}
        aria-describedby={error ? 'export-error' : undefined}
        title={compact ? 'Exportar CSV' : undefined}
      >
        {exportingFormat === 'csv' ? (
          <Loader2 className="animate-spin" size={14} />
        ) : (
          <FileText size={14} />
        )}
        {!compact && <span>CSV</span>}
      </button>

      {/* JSON Button */}
      <button
        type="button"
        onClick={() => handleExport('json')}
        disabled={isDisabled || isExporting}
        className={`
          inline-flex items-center gap-1.5
          ${compact ? 'px-2 py-1.5' : 'px-3 py-1.5'}
          bg-bg-panel-2 border border-border-default rounded
          text-text-secondary text-sm font-medium
          hover:bg-border-default hover:text-text-primary hover:border-accent-indigo/50
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-bg-panel-2 disabled:hover:text-text-secondary disabled:hover:border-border-default
          transition-colors
          focus:outline-none focus:ring-2 focus:ring-accent-indigo focus:ring-offset-1 focus:ring-offset-bg-main
        `}
        aria-describedby={error ? 'export-error' : undefined}
        title={compact ? 'Exportar JSON' : undefined}
      >
        {exportingFormat === 'json' ? (
          <Loader2 className="animate-spin" size={14} />
        ) : (
          <FileJson size={14} />
        )}
        {!compact && <span>JSON</span>}
      </button>

      {/* Error Message */}
      {error && (
        <span
          id="export-error"
          className="text-status-red text-xs ml-2"
          role="alert"
        >
          {error}
        </span>
      )}

      {/* Disabled hint */}
      {isDisabled && !isExporting && (
        <span className="text-text-muted text-xs ml-1" aria-hidden="true">
          (sem resultados)
        </span>
      )}
    </div>
  );
});

/**
 * ExportButtonsDropdown Component
 *
 * Alternative dropdown version of export buttons for more compact UIs.
 */
interface ExportButtonsDropdownProps {
  disabled?: boolean;
  className?: string;
}

export function ExportButtonsDropdown({
  disabled = false,
  className = '',
}: ExportButtonsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);

  const { exportResults, total } = useSTJStore();

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      setExportingFormat(format);
      setIsOpen(false);

      try {
        await exportResults(format);
      } catch (err) {
        console.error(`Export ${format} failed:`, err);
      } finally {
        setExportingFormat(null);
      }
    },
    [exportResults]
  );

  const isDisabled = disabled || total === 0;

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isDisabled || exportingFormat !== null}
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5
          bg-bg-panel-2 border border-border-default rounded
          text-text-secondary text-sm font-medium
          hover:bg-border-default hover:text-text-primary
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
          focus:outline-none focus:ring-2 focus:ring-accent-indigo
        `}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {exportingFormat ? (
          <Loader2 className="animate-spin" size={14} />
        ) : (
          <Download size={14} />
        )}
        <span>Exportar</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown Menu */}
          <div
            className="absolute right-0 mt-1 w-32 bg-bg-panel-1 border border-border-default rounded-lg shadow-lg z-20 py-1"
            role="menu"
          >
            <button
              type="button"
              onClick={() => handleExport('csv')}
              className="w-full flex items-center gap-2 px-3 py-2 text-text-secondary text-sm hover:bg-border-default hover:text-text-primary transition-colors"
              role="menuitem"
            >
              <FileText size={14} />
              CSV
            </button>
            <button
              type="button"
              onClick={() => handleExport('json')}
              className="w-full flex items-center gap-2 px-3 py-2 text-text-secondary text-sm hover:bg-border-default hover:text-text-primary transition-colors"
              role="menuitem"
            >
              <FileJson size={14} />
              JSON
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ExportButtons;
