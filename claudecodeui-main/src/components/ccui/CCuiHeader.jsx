import React from 'react';
import { Folder, Cpu, Search, Settings } from 'lucide-react';

/**
 * CCuiHeader - Minimal header with traffic lights, project path, and model selector
 *
 * @param {Object} props
 * @param {string} props.projectPath - Current project path
 * @param {string} props.currentModel - Current AI model name
 * @param {Function} props.onSettingsClick - Settings button click handler
 * @param {Function} props.onSearchClick - Search button click handler
 */
const CCuiHeader = ({
  projectPath = 'No Project',
  currentModel = 'claude-sonnet-4-5',
  onSettingsClick,
  onSearchClick
}) => {
  return (
    <header className="h-10 bg-ccui-bg-secondary border-b border-ccui-border-primary flex items-center justify-between px-4 z-50 select-none">
      {/* Left: Traffic Lights + Project Path */}
      <div className="flex items-center gap-3">
        {/* Traffic lights */}
        <div className="flex gap-2 group cursor-pointer">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 group-hover:bg-red-500 border border-red-500/50 transition-colors" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 group-hover:bg-yellow-500 border border-yellow-500/50 transition-colors" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 group-hover:bg-green-500 border border-green-500/50 transition-colors" />
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-ccui-border-secondary mx-1" />

        {/* Project path */}
        <div className="flex items-center gap-2 text-xs font-medium text-ccui-text-secondary">
          <Folder className="w-3 h-3" />
          <span>{projectPath}</span>
        </div>
      </div>

      {/* Right: Model Selector + Actions */}
      <div className="flex items-center gap-4 text-xxs font-mono text-ccui-text-subtle">
        {/* Model selector */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-ccui-bg-active border border-ccui-border-secondary cursor-pointer hover:border-ccui-accent/50 transition-colors">
          <Cpu className="w-3 h-3 text-ccui-accent" />
          <span className="text-ccui-text-secondary">{currentModel}</span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-3">
          <Search
            className="w-3.5 h-3.5 hover:text-ccui-accent cursor-pointer transition-colors"
            onClick={onSearchClick}
          />
          <Settings
            className="w-3.5 h-3.5 hover:text-ccui-accent cursor-pointer transition-colors"
            onClick={onSettingsClick}
          />
        </div>
      </div>
    </header>
  );
};

export default CCuiHeader;
