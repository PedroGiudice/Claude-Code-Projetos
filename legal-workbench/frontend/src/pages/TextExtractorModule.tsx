import React, { useState, useEffect } from 'react';
import { useTextExtractorStore } from '@/store/textExtractorStore';
import {
  UploadPanel,
  ConfigPanel,
  OutputPanel,
  ConsolePanel,
  SettingsModal,
  HistoryPanel,
} from '@/components/text-extractor';
import {
  Upload,
  Settings,
  FileOutput,
  Terminal,
  History,
  HelpCircle,
  FileText,
} from 'lucide-react';
import clsx from 'clsx';
import '@/styles/text-extractor.css';

type ActivePanel = 'upload' | 'config' | 'output' | 'console';

export default function TextExtractorModule() {
  const {
    status,
    history,
    historyOpen,
    historyLoading,
    setHistoryOpen,
    loadHistory,
    loadFromHistory,
  } = useTextExtractorStore();
  const [activePanel, setActivePanel] = useState<ActivePanel>('upload');
  const [consoleCollapsed, setConsoleCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Initialize console on mount
  useEffect(() => {
    // The store already initializes with a ready message
  }, []);

  // Auto-switch panels based on status
  useEffect(() => {
    switch (status) {
      case 'configuring':
      case 'preflight':
        setActivePanel('config');
        break;
      case 'processing':
        setActivePanel('output');
        setConsoleCollapsed(false);
        break;
      case 'success':
        setActivePanel('output');
        break;
      case 'error':
        setConsoleCollapsed(false);
        break;
    }
  }, [status]);

  const toolboxItems = [
    { id: 'upload' as const, icon: Upload, label: 'Upload', symbol: '>' },
    { id: 'config' as const, icon: Settings, label: 'Config', symbol: '@' },
    { id: 'output' as const, icon: FileOutput, label: 'Output', symbol: '$' },
    { id: 'console' as const, icon: Terminal, label: 'Console', symbol: '#' },
  ];

  const presetItems = [
    { id: 'lgpd', label: 'LGPD Mode' },
    { id: 'court', label: 'Court Docs' },
    { id: 'contract', label: 'Contracts' },
  ];

  const handlePresetClick = (preset: string) => {
    const store = useTextExtractorStore.getState();
    store.loadPreset(preset as 'lgpd' | 'court' | 'contract');
  };

  const handleOpenHistory = () => {
    loadHistory();
    setHistoryOpen(true);
  };

  return (
    <div className="te-module">
      {/* Header */}
      <header className="te-header">
        <div className="te-header-left">
          <FileText size={20} className="te-icon-accent" />
          <span className="te-title">TEXT_EXTRACTOR</span>
          <span className="te-version">v1.0.0</span>
        </div>
        <div className="te-header-right">
          <button
            type="button"
            className="te-header-btn"
            aria-label="View history"
            onClick={handleOpenHistory}
          >
            <History size={16} />
            <span>HISTORY</span>
          </button>
          <button
            type="button"
            className="te-header-btn"
            aria-label="Settings"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings size={16} />
            <span>SETTINGS</span>
          </button>
          <button type="button" className="te-header-btn" aria-label="Help">
            <HelpCircle size={16} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="te-content">
        {/* Toolbox Sidebar */}
        <aside className="te-toolbox">
          <nav className="te-toolbox-nav" aria-label="Module navigation">
            {toolboxItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'console') {
                    setConsoleCollapsed(!consoleCollapsed);
                  } else {
                    setActivePanel(item.id);
                  }
                }}
                className={clsx(
                  'te-toolbox-item',
                  activePanel === item.id && item.id !== 'console' && 'te-toolbox-item--active'
                )}
                aria-current={activePanel === item.id ? 'page' : undefined}
              >
                <span className="te-toolbox-symbol">[ {item.symbol} ]</span>
                <span className="te-toolbox-label">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="te-toolbox-divider" />

          <div className="te-presets">
            <span className="te-presets-title">PRESETS</span>
            {presetItems.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetClick(preset.id)}
                className="te-preset-item"
              >
                <span className="te-preset-bullet">*</span>
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Workspace */}
        <main className="te-workspace">
          <div className="te-panels">
            {/* Upload Panel - Always visible at top when active */}
            {activePanel === 'upload' && (
              <div className="te-panel-wrapper">
                <UploadPanel />
                <div className="te-arrow-connector">
                  <span className="te-arrow-line">|</span>
                  <span className="te-arrow-down">v</span>
                </div>
              </div>
            )}

            {/* Config Panel */}
            {activePanel === 'config' && (
              <div className="te-panel-wrapper">
                <UploadPanel />
                <div className="te-arrow-connector">
                  <span className="te-arrow-line">|</span>
                  <span className="te-arrow-down">v</span>
                </div>
                <ConfigPanel />
              </div>
            )}

            {/* Output Panel */}
            {activePanel === 'output' && (
              <div className="te-panel-wrapper te-panel-wrapper--output">
                <OutputPanel />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Console Panel - Fixed at bottom */}
      <ConsolePanel
        isCollapsed={consoleCollapsed}
        onToggleCollapse={() => setConsoleCollapsed(!consoleCollapsed)}
      />

      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* History Panel */}
      <HistoryPanel
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        entries={history}
        isLoading={historyLoading}
        onSelect={loadFromHistory}
      />
    </div>
  );
}
