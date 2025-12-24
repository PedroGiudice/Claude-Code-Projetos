import React, { useState, useRef, useEffect } from 'react';
import { Cpu, Search, Settings, ChevronDown, FolderOpen } from 'lucide-react';
import { CCuiSpinnerLogo } from './CCuiSpinner';

/**
 * CCuiHeader - Minimal header with animated logo, project selector dropdown, and model selector
 *
 * @param {Object} props
 * @param {string} props.projectPath - Current project path (display)
 * @param {string} props.currentModel - Current AI model name
 * @param {Array} props.projects - List of available projects
 * @param {Object} props.selectedProject - Currently selected project
 * @param {Function} props.onProjectSelect - Project selection handler
 * @param {Function} props.onSettingsClick - Settings button click handler
 * @param {Function} props.onSearchClick - Search button click handler
 */
const CCuiHeader = ({
  projectPath = 'Select Project',
  currentModel = 'claude-sonnet-4-5',
  projects = [],
  selectedProject,
  onProjectSelect,
  onSettingsClick,
  onSearchClick
}) => {
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProjectDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProjectClick = (project) => {
    onProjectSelect?.(project);
    setShowProjectDropdown(false);
  };

  return (
    <header className="h-10 bg-ccui-bg-secondary border-b border-ccui-border-primary flex items-center justify-between px-4 z-50 select-none">
      {/* Left: Animated Logo + Project Selector */}
      <div className="flex items-center gap-3">
        {/* Animated Cyber Hex Logo */}
        <CCuiSpinnerLogo size={28} />

        {/* Divider */}
        <div className="h-4 w-px bg-ccui-border-secondary mx-1" />

        {/* Project Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            className="flex items-center gap-2 text-xs font-medium text-ccui-text-secondary hover:text-ccui-accent transition-colors px-2 py-1 rounded hover:bg-ccui-bg-active"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>{projectPath}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showProjectDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {showProjectDropdown && (
            <div className="absolute top-full left-0 mt-1 w-64 max-h-80 overflow-y-auto bg-ccui-bg-secondary border border-ccui-border-primary rounded-md shadow-lg z-50">
              {projects.length === 0 ? (
                <div className="px-3 py-2 text-xs text-ccui-text-subtle">
                  No projects found
                </div>
              ) : (
                projects.map((project) => (
                  <button
                    key={project.name}
                    onClick={() => handleProjectClick(project)}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-ccui-bg-active transition-colors flex items-center gap-2 ${
                      selectedProject?.name === project.name
                        ? 'bg-ccui-bg-active text-ccui-accent'
                        : 'text-ccui-text-secondary'
                    }`}
                  >
                    <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">
                        {project.displayName || project.name}
                      </div>
                      <div className="truncate text-[10px] text-ccui-text-subtle">
                        {project.sessions?.length || 0} sessions
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
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
