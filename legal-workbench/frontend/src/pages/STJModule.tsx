import { useEffect, useState } from 'react';
import { useSTJStore } from '@/store/stjStore';
import { SearchForm } from '@/components/stj/SearchForm';
import { ResultsList } from '@/components/stj/ResultsList';
import { CaseDetail } from '@/components/stj/CaseDetail';
import { DownloadPanel } from '@/components/stj/DownloadPanel';
import { ExportButtons } from '@/components/stj/ExportButtons';
import { Scale, Database, Download, ChevronDown, ChevronUp } from 'lucide-react';

export default function STJModule() {
  const { stats, loadStats, total } = useSTJStore();
  const [showDownloadPanel, setShowDownloadPanel] = useState(false);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="h-14 border-b border-border-default bg-bg-panel-1 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Scale className="text-accent-violet" size={20} />
          <span className="text-accent-violet font-bold">STJ Dados Abertos</span>
        </div>
        <div className="flex items-center gap-4">
          {stats && (
            <div className="flex items-center gap-4 text-text-muted text-xs">
              <span className="flex items-center gap-1">
                <Database size={14} />
                {stats.total_acordaos.toLocaleString()} acórdãos
              </span>
              <span className="text-status-emerald">
                +{stats.ultimos_30_dias} nos últimos 30 dias
              </span>
            </div>
          )}
          <button
            onClick={() => setShowDownloadPanel(!showDownloadPanel)}
            className="flex items-center gap-1 px-3 py-1.5 bg-accent-indigo text-white text-sm font-medium rounded-lg hover:bg-accent-indigo-light transition-colors"
            aria-expanded={showDownloadPanel}
            aria-controls="download-panel"
          >
            <Download size={14} />
            <span>Download Massivo</span>
            {showDownloadPanel ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </header>

      {/* Download Panel (Collapsible) */}
      {showDownloadPanel && (
        <div id="download-panel" className="border-b border-border-default bg-bg-panel-2 p-4">
          <DownloadPanel />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Search */}
        <div className="w-1/2 border-r border-border-default flex flex-col">
          <div className="p-4 border-b border-border-default">
            <SearchForm />
          </div>
          {/* Export buttons above results */}
          {total > 0 && (
            <div className="px-4 py-2 border-b border-border-default flex items-center justify-between bg-bg-panel-1">
              <span className="text-text-muted text-sm">{total.toLocaleString()} resultados</span>
              <ExportButtons />
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-4">
            <ResultsList />
          </div>
        </div>

        {/* Right Panel - Detail */}
        <div className="w-1/2 bg-surface-elevated">
          <CaseDetail />
        </div>
      </div>
    </div>
  );
}
