import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { 
  Terminal, 
  Folder, 
  Settings, 
  ChevronRight, 
  ChevronDown,
  Command, 
  Copy, 
  Check, 
  Loader2,
  Sparkles,
  Activity,
  ArrowUp, 
  Trash2,
  Edit2,
  Plus,
  Clock,
  FileCode,
  FileJson,
  FileType,
  Image,
  Search,
  MoreVertical,
  Cpu,
  Files,
  GitGraph,
  Bug,
  FileText,
  MessageSquare,
  Wrench,
  ListChecks,
  X,
  Palette,
  Upload,
  Play,
  GitBranch,
  Box
} from 'lucide-react';

// Declaration for global Prism object from CDN
declare global {
  interface Window {
    Prism: any;
  }
}

// --- TYPES & INTERFACES ---

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

export interface HistoryItem {
  id: string;
  title: string;
  time: string;
  active: boolean;
}

export interface HistoryGroup {
  label: string;
  items: HistoryItem[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'thought' | 'bash';
  isStreaming?: boolean;
  label?: string; // For thought blocks
  duration?: string;
  meta?: any;
}

interface WidgetConfig {
  visible: boolean;
  color: string; // Tailwind text color class
}

interface StatusLineConfig {
  activeTools: WidgetConfig;
  currentTask: WidgetConfig;
  modelInfo: WidgetConfig;
  gitInfo: WidgetConfig;
}

// --- BACKEND SERVICE LAYER ---
// TODO: Implement these methods to connect to the Claude Code CLI wrapper.
export const BackendService = {
  /**
   * Fetch the current file system structure from the CLI context.
   */
  async getFileTree(): Promise<FileNode[]> {
    // Implementation: Fetch file tree from backend
    return [];
  },

  /**
   * Fetch conversation history.
   */
  async getHistory(): Promise<HistoryGroup[]> {
    // Implementation: Fetch history from storage/backend
    return [];
  },

  /**
   * Send a message to the CLI and subscribe to updates.
   * @param input User input string
   * @param onUpdate Callback to stream updates (text chunks, thought blocks, etc.)
   */
  async sendMessage(input: string, onUpdate: (partial: Partial<Message>) => void): Promise<void> {
    // Implementation: 
    // 1. Send input to CLI process
    // 2. Listen for stdout/events
    // 3. Call onUpdate({ content: newContent, ... }) as data arrives
  }
};

// --- HELPER COMPONENT: CODE BLOCK ---
const CodeBlock: React.FC<{ code: string; language?: string; isStreaming?: boolean }> = ({ code, language = 'javascript', isStreaming = false }) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (window.Prism && codeRef.current) {
      window.Prism.highlightElement(codeRef.current);
    }
  }, [code, language]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-2 rounded-md overflow-hidden border border-[#33312e] bg-[#1d1c1a] shadow-sm">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#252423] border-b border-[#33312e]">
        <div className="flex items-center space-x-2">
           <span className="text-[10px] text-[#9e9d99] font-mono lowercase">{language}</span>
        </div>
        <button 
          onClick={handleCopy}
          className="flex items-center space-x-1 text-[10px] text-[#9e9d99] hover:text-[#e3e1de] transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <div className="relative">
        <pre className="!m-0 !p-3 !bg-[#131211] !text-[11px] overflow-x-auto custom-scrollbar font-mono leading-relaxed">
          <code ref={codeRef} className={`language-${language} !bg-transparent !text-shadow-none`}>
            {code}
          </code>
          {isStreaming && (
             <span className="inline-block w-1.5 h-3 bg-[#d97757] align-middle ml-1 animate-pulse"></span>
          )}
        </pre>
      </div>
    </div>
  );
};

// --- HELPER: FILE ICON ---
const FileIcon: React.FC<{ name: string; className?: string }> = ({ name, className = "w-4 h-4" }) => {
    const ext = name.split('.').pop()?.toLowerCase();
    
    switch(ext) {
        case 'py': return <FileCode className={`${className} text-yellow-500`} />;
        case 'tsx':
        case 'ts':
        case 'js':
        case 'jsx': return <FileCode className={`${className} text-blue-400`} />;
        case 'css':
        case 'scss': return <FileType className={`${className} text-pink-400`} />;
        case 'html': return <FileType className={`${className} text-orange-400`} />;
        case 'json':
        case 'yaml':
        case 'yml': return <FileJson className={`${className} text-green-400`} />;
        case 'md':
        case 'txt': return <FileText className={`${className} text-[#9e9d99]`} />;
        case 'png':
        case 'jpg':
        case 'svg': return <Image className={`${className} text-purple-400`} />;
        default: return <FileText className={`${className} text-[#6b6a67]`} />;
    }
};

// --- HELPER: COLLAPSIBLE THINKING BLOCK ---
const ThinkingBlock: React.FC<{ content: string; isStreaming?: boolean; label?: string; duration?: string }> = ({ content, isStreaming, label = "Reasoning", duration }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="mb-2 group">
            <div 
                className="flex items-center gap-2 cursor-pointer select-none py-1"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="w-3.5 h-3.5 flex items-center justify-center">
                     {isStreaming ? (
                         <Loader2 className="w-3 h-3 text-[#d97757] animate-spin" />
                     ) : (
                         isOpen ? <ChevronDown className="w-3 h-3 text-[#9e9d99]" /> : <ChevronRight className="w-3 h-3 text-[#9e9d99]" />
                     )}
                </div>
                <span className={`text-[10px] font-mono font-medium tracking-tight ${isStreaming ? 'text-[#e3e1de]' : 'text-[#9e9d99]'}`}>
                    {label}
                </span>
                {duration && <span className="text-[10px] text-[#6b6a67] font-mono ml-auto">{duration}</span>}
            </div>
            
            {isOpen && (
                <div className="pl-5 pr-2 py-1">
                    <div className="text-[11px] text-[#b5b4b0] font-mono border-l border-[#33312e] pl-3 py-1 leading-relaxed">
                        {content}
                        {isStreaming && <span className="inline-block w-1.5 h-3 bg-[#d97757] ml-1 animate-pulse" />}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- HELPER: SIDEBAR ICON ---
const SidebarIcon: React.FC<{ icon: React.ElementType; active: boolean; onClick: () => void }> = ({ icon: Icon, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full p-3 flex justify-center transition-all duration-200 relative group ${active ? 'text-[#e3e1de]' : 'text-[#6b6a67] hover:text-[#9e9d99]'}`}
    >
        <Icon className="w-5 h-5" strokeWidth={1.5} />
        {active && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#d97757]"></div>}
    </button>
);

// --- HELPER: FILE TREE COMPONENT ---
interface FileTreeItemProps {
    node: FileNode;
    depth: number;
    onDelete?: (id: string) => void;
    onEdit?: (id: string, newName: string) => void;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ node, depth, onDelete, onEdit }) => {
  const [isOpen, setIsOpen] = useState(depth === 0);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);
  const paddingLeft = `${depth * 12 + 12}px`;

  const handleEditSubmit = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          if (onEdit) onEdit(node.id, editName);
          setIsEditing(false);
      }
  };

  if (node.type === 'folder') {
    return (
      <div>
        <div 
          className="flex items-center py-1 hover:bg-[#2d2c2a] cursor-pointer text-[#9e9d99] hover:text-[#e3e1de] transition-colors select-none text-[11px]"
          style={{ paddingLeft }}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <ChevronDown className="w-3 h-3 mr-1.5 text-[#6b6a67]" /> : <ChevronRight className="w-3 h-3 mr-1.5 text-[#6b6a67]" />}
          <Folder className="w-3.5 h-3.5 mr-1.5 text-[#d97757]" />
          <span className="truncate font-medium">{node.name}</span>
        </div>
        {isOpen && node.children?.map(child => (
          <FileTreeItem key={child.id} node={child} depth={depth + 1} onDelete={onDelete} onEdit={onEdit} />
        ))}
      </div>
    );
  }

  return (
    <div 
      className="flex items-center justify-between py-1 pr-2 hover:bg-[#2d2c2a] cursor-pointer text-[#9e9d99] hover:text-[#e3e1de] transition-colors select-none text-[11px] group"
      style={{ paddingLeft }}
    >
      <div className="flex items-center flex-1 min-w-0">
          <div className="mr-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
            <FileIcon name={node.name} className="w-3.5 h-3.5" />
          </div>
          {isEditing ? (
              <input 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={handleEditSubmit}
                  className="bg-[#2d2c2a] text-[#e3e1de] border border-[#4a4845] px-1 py-0.5 w-full focus:outline-none focus:border-[#d97757] rounded-sm font-mono text-[11px]"
                  autoFocus
                  onBlur={() => setIsEditing(false)}
              />
          ) : (
              <span className="truncate font-mono" onDoubleClick={() => setIsEditing(true)}>{node.name}</span>
          )}
      </div>
      <div className="hidden group-hover:flex items-center space-x-1 ml-2">
          <Edit2 className="w-3 h-3 text-[#6b6a67] hover:text-[#d97757]" onClick={() => setIsEditing(true)} />
          <Trash2 className="w-3 h-3 text-[#6b6a67] hover:text-red-500" onClick={() => onDelete && onDelete(node.id)} />
      </div>
    </div>
  );
};

// --- APP COMPONENT ---
const App: React.FC = () => {
  // Application State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarView, setSidebarView] = useState<'explorer' | 'history' | 'search' | 'git' | 'debug'>('history');
  
  // Sidebar State
  const [isDraggingOverSidebar, setIsDraggingOverSidebar] = useState(false);
  const [isSidebarRunning, setIsSidebarRunning] = useState(false);

  // History State
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [tempHistoryTitle, setTempHistoryTitle] = useState('');

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [statusLineConfig, setStatusLineConfig] = useState<StatusLineConfig>({
      activeTools: { visible: false, color: 'text-blue-400' },
      currentTask: { visible: false, color: 'text-yellow-400' },
      modelInfo: { visible: true, color: 'text-purple-400' },
      gitInfo: { visible: true, color: 'text-orange-400' }
  });

  // Data State (Populated via BackendService)
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [historyGroups, setHistoryGroups] = useState<HistoryGroup[]>([]);
  const [contextUsage, setContextUsage] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- INITIAL DATA LOAD ---
  useEffect(() => {
    const init = async () => {
        try {
            const files = await BackendService.getFileTree();
            setFileTree(files);
            
            const history = await BackendService.getHistory();
            setHistoryGroups(history);
        } catch (error) {
            console.error("Failed to load initial data from backend", error);
        }
    };
    init();
  }, []);

  // --- AUTO SCROLL ---
  useEffect(() => {
    if (messagesEndRef.current) {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 50);
    }
  }, [messages, isTyping]);

  // --- HANDLERS ---

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // 1. Optimistic Update (User Message)
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // 2. Prepare Placeholder for Assistant Response
    const assistantMsgId = (Date.now() + 1).toString();
    const assistantPlaceholder: Message = { 
        id: assistantMsgId, 
        role: 'assistant', 
        content: '', 
        type: 'text', 
        isStreaming: true 
    };
    setMessages(prev => [...prev, assistantPlaceholder]);

    // 3. Call Backend Service
    try {
        await BackendService.sendMessage(userMsg.content, (partial) => {
            setMessages(prev => prev.map(m => {
                if (m.id === assistantMsgId) {
                    return { ...m, ...partial };
                }
                return m;
            }));
        });
    } catch (e) {
        console.error("Error sending message", e);
        // Handle error state if needed
    } finally {
        setIsTyping(false);
        setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, isStreaming: false } : m));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      // Logic for drag & drop would go here, communicating with backend
  };

  // Sidebar Drag & Drop
  const handleSidebarDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingOverSidebar(true);
  };
  
  const handleSidebarDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingOverSidebar(false);
  };

  const handleSidebarDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingOverSidebar(false);
      const files: File[] = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
          // In a real app, this would upload the file to the backend
          console.log("Uploaded files:", files.map(f => f.name));
          
          // Simulating file addition for UI feedback
          const newFileNode: FileNode = {
              id: `upload-${Date.now()}`,
              name: files[0].name,
              type: 'file'
          };
          setFileTree(prev => [...prev, newFileNode]);
      }
  };

  // Sidebar Run
  const handleSidebarRun = () => {
      setIsSidebarRunning(true);
      // Simulate run command
      setTimeout(() => {
          setIsSidebarRunning(false);
      }, 2000);
  };

  // History Actions
  const handleHistoryDelete = (itemId: string) => {
      setHistoryGroups(prev => prev.map(group => ({
          ...group,
          items: group.items.filter(item => item.id !== itemId)
      })).filter(group => group.items.length > 0));
  };

  const handleHistoryStartEdit = (item: HistoryItem) => {
      setEditingHistoryId(item.id);
      setTempHistoryTitle(item.title);
  };

  const handleHistorySaveEdit = () => {
      if (editingHistoryId) {
          setHistoryGroups(prev => prev.map(group => ({
              ...group,
              items: group.items.map(item => 
                  item.id === editingHistoryId ? { ...item, title: tempHistoryTitle } : item
              )
          })));
          setEditingHistoryId(null);
      }
  };

  // --- RENDER TEXT WITH CODE BLOCKS ---
  const renderFormattedContent = (content: string, isStreaming: boolean) => {
      if (!content) return null;
      
      const parts = content.split(/(```[\s\S]*?```)/g);
      
      return parts.map((part, index) => {
          if (part.startsWith('```')) {
              // Extract language
              const match = part.match(/```(\w*)\n([\s\S]*?)```/);
              if (match) {
                  const lang = match[1] || 'text';
                  const code = match[2];
                  return <CodeBlock key={index} code={code} language={lang} />;
              }
          }
          // Normal Text
          return <div key={index} className="whitespace-pre-wrap mb-1 text-[#e3e1de] font-normal">{part}</div>;
      });
  };

  const ColorPicker: React.FC<{ 
      selected: string, 
      onSelect: (color: string) => void 
  }> = ({ selected, onSelect }) => {
      const colors = [
          { name: 'Blue', class: 'text-blue-500', bg: 'bg-blue-500' },
          { name: 'Green', class: 'text-green-500', bg: 'bg-green-500' },
          { name: 'Yellow', class: 'text-yellow-500', bg: 'bg-yellow-500' },
          { name: 'Purple', class: 'text-purple-400', bg: 'bg-purple-400' },
          { name: 'Red', class: 'text-red-500', bg: 'bg-red-500' },
          { name: 'Orange', class: 'text-orange-400', bg: 'bg-orange-400' },
      ];

      return (
          <div className="flex gap-2">
              {colors.map(c => (
                  <button
                      key={c.name}
                      onClick={() => onSelect(c.class)}
                      className={`w-4 h-4 rounded-full ${c.bg} ${selected === c.class ? 'ring-2 ring-white ring-offset-1 ring-offset-black' : 'opacity-40 hover:opacity-100'} transition-all`}
                      title={c.name}
                  />
              ))}
          </div>
      );
  };

  return (
    <div 
      className="flex flex-col h-screen w-full bg-[#232220] text-[#e3e1de] font-sans overflow-hidden selection:bg-[#d97757]/30"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      
      {/* --- SETTINGS MODAL --- */}
      {isSettingsOpen && (
          <div className="absolute inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <div className="w-[420px] bg-[#191817] border border-[#33312e] rounded-lg shadow-2xl overflow-hidden ring-1 ring-white/10">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#33312e] bg-[#252423]">
                      <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4 text-[#d97757]" />
                          <span className="text-sm font-bold text-[#e3e1de]">Configuration</span>
                      </div>
                      <button onClick={() => setIsSettingsOpen(false)} className="text-[#9e9d99] hover:text-[#e3e1de] transition-colors">
                          <X className="w-4 h-4" />
                      </button>
                  </div>
                  <div className="p-5 space-y-6">
                      
                      {/* Status Line Section */}
                      <div>
                          <h3 className="text-[11px] font-bold text-[#9e9d99] uppercase tracking-wider mb-4">Status Line Widgets</h3>
                          
                          <div className="space-y-5">
                             {/* Model Info Config */}
                             <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                          <div className={`p-1.5 rounded bg-[#2d2c2a] ${statusLineConfig.modelInfo.visible ? 'text-[#e3e1de]' : 'text-[#6b6a67]'}`}>
                                              <Sparkles className="w-4 h-4" />
                                          </div>
                                          <div>
                                              <div className="text-xs font-medium text-[#e3e1de]">Model Info</div>
                                              <div className="text-[10px] text-[#9e9d99]">Show active model</div>
                                          </div>
                                      </div>
                                      <label className="relative inline-flex items-center cursor-pointer">
                                          <input 
                                              type="checkbox" 
                                              className="sr-only peer"
                                              checked={statusLineConfig.modelInfo.visible}
                                              onChange={() => setStatusLineConfig(prev => ({
                                                  ...prev,
                                                  modelInfo: { ...prev.modelInfo, visible: !prev.modelInfo.visible }
                                              }))}
                                          />
                                          <div className="w-9 h-5 bg-[#33312e] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#d97757]"></div>
                                      </label>
                                  </div>
                                  {statusLineConfig.modelInfo.visible && (
                                      <div className="flex items-center justify-between pl-10">
                                          <span className="text-[10px] text-[#9e9d99]">Accent Color</span>
                                          <ColorPicker 
                                              selected={statusLineConfig.modelInfo.color} 
                                              onSelect={(color) => setStatusLineConfig(prev => ({
                                                  ...prev,
                                                  modelInfo: { ...prev.modelInfo, color }
                                              }))} 
                                      />
                                      </div>
                                  )}
                             </div>
                             
                             <div className="h-[1px] bg-[#33312e]" />

                             {/* Git Info Config */}
                             <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                          <div className={`p-1.5 rounded bg-[#2d2c2a] ${statusLineConfig.gitInfo.visible ? 'text-[#e3e1de]' : 'text-[#6b6a67]'}`}>
                                              <GitBranch className="w-4 h-4" />
                                          </div>
                                          <div>
                                              <div className="text-xs font-medium text-[#e3e1de]">Git Status</div>
                                              <div className="text-[10px] text-[#9e9d99]">Show branch info</div>
                                          </div>
                                      </div>
                                      <label className="relative inline-flex items-center cursor-pointer">
                                          <input 
                                              type="checkbox" 
                                              className="sr-only peer"
                                              checked={statusLineConfig.gitInfo.visible}
                                              onChange={() => setStatusLineConfig(prev => ({
                                                  ...prev,
                                                  gitInfo: { ...prev.gitInfo, visible: !prev.gitInfo.visible }
                                              }))}
                                          />
                                          <div className="w-9 h-5 bg-[#33312e] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#d97757]"></div>
                                      </label>
                                  </div>
                                  {statusLineConfig.gitInfo.visible && (
                                      <div className="flex items-center justify-between pl-10">
                                          <span className="text-[10px] text-[#9e9d99]">Accent Color</span>
                                          <ColorPicker 
                                              selected={statusLineConfig.gitInfo.color} 
                                              onSelect={(color) => setStatusLineConfig(prev => ({
                                                  ...prev,
                                                  gitInfo: { ...prev.gitInfo, color }
                                              }))} 
                                      />
                                      </div>
                                  )}
                             </div>

                             <div className="h-[1px] bg-[#33312e]" />
                          
                             {/* Active Tools Config */}
                             <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                      <div className={`p-1.5 rounded bg-[#2d2c2a] ${statusLineConfig.activeTools.visible ? 'text-[#e3e1de]' : 'text-[#6b6a67]'}`}>
                                          <Wrench className="w-4 h-4" />
                                      </div>
                                      <div>
                                          <div className="text-xs font-medium text-[#e3e1de]">Active Tools</div>
                                          <div className="text-[10px] text-[#9e9d99]">Show tool count</div>
                                      </div>
                                  </div>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                      <input 
                                          type="checkbox" 
                                          className="sr-only peer"
                                          checked={statusLineConfig.activeTools.visible}
                                          onChange={() => setStatusLineConfig(prev => ({
                                              ...prev,
                                              activeTools: { ...prev.activeTools, visible: !prev.activeTools.visible }
                                          }))}
                                      />
                                      <div className="w-9 h-5 bg-[#33312e] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#d97757]"></div>
                                  </label>
                              </div>
                              {statusLineConfig.activeTools.visible && (
                                  <div className="flex items-center justify-between pl-10">
                                      <span className="text-[10px] text-[#9e9d99]">Accent Color</span>
                                      <ColorPicker 
                                          selected={statusLineConfig.activeTools.color} 
                                          onSelect={(color) => setStatusLineConfig(prev => ({
                                              ...prev,
                                              activeTools: { ...prev.activeTools, color }
                                          }))} 
                                      />
                                  </div>
                              )}
                          </div>

                          <div className="h-[1px] bg-[#33312e]" />

                          {/* Current Task Config */}
                          <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                      <div className={`p-1.5 rounded bg-[#2d2c2a] ${statusLineConfig.currentTask.visible ? 'text-[#e3e1de]' : 'text-[#6b6a67]'}`}>
                                          <ListChecks className="w-4 h-4" />
                                      </div>
                                      <div>
                                          <div className="text-xs font-medium text-[#e3e1de]">Current Task</div>
                                          <div className="text-[10px] text-[#9e9d99]">Show running task</div>
                                      </div>
                                  </div>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                      <input 
                                          type="checkbox" 
                                          className="sr-only peer"
                                          checked={statusLineConfig.currentTask.visible}
                                          onChange={() => setStatusLineConfig(prev => ({
                                              ...prev,
                                              currentTask: { ...prev.currentTask, visible: !prev.currentTask.visible }
                                          }))}
                                      />
                                      <div className="w-9 h-5 bg-[#33312e] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#d97757]"></div>
                                  </label>
                              </div>
                              {statusLineConfig.currentTask.visible && (
                                  <div className="flex items-center justify-between pl-10">
                                      <span className="text-[10px] text-[#9e9d99]">Accent Color</span>
                                      <ColorPicker 
                                          selected={statusLineConfig.currentTask.color} 
                                          onSelect={(color) => setStatusLineConfig(prev => ({
                                              ...prev,
                                              currentTask: { ...prev.currentTask, color }
                                          }))} 
                                      />
                                  </div>
                              )}
                          </div>

                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- HEADER --- */}
      <header className="flex-none h-10 bg-[#191817] border-b border-[#33312e] flex items-center justify-between px-4 z-50 select-none">
        <div className="flex items-center gap-3">
           <div className="flex gap-2 group cursor-pointer">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 group-hover:bg-red-500 border border-red-500/50 transition-colors"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 group-hover:bg-yellow-500 border border-yellow-500/50 transition-colors"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 group-hover:bg-green-500 border border-green-500/50 transition-colors"></div>
           </div>
           <div className="h-4 w-[1px] bg-[#4a4845] mx-1"></div>
           <div className="flex items-center gap-2 text-xs font-medium text-[#9e9d99]">
              <Folder className="w-3 h-3" />
              <span>~/project-root</span>
           </div>
        </div>
        
        <div className="flex items-center gap-4 text-[10px] font-mono text-[#9e9d99]">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#252423] border border-[#33312e]">
                <Cpu className="w-3 h-3 text-[#d97757]" />
                <span className="text-[#9e9d99]">Claude Code Wrapper</span>
            </div>
            <div className="flex items-center gap-3">
                <Search className="w-3.5 h-3.5 hover:text-[#d97757] cursor-pointer transition-colors" />
                <Settings 
                    className="w-3.5 h-3.5 hover:text-[#d97757] cursor-pointer transition-colors" 
                    onClick={() => setIsSettingsOpen(true)}
                />
            </div>
        </div>
      </header>

      {/* --- MAIN LAYOUT --- */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ICON RAIL */}
        <aside className="w-12 bg-[#191817] border-r border-[#33312e] flex flex-col items-center py-2 z-50">
            <SidebarIcon icon={MessageSquare} active={sidebarView === 'history'} onClick={() => setSidebarView('history')} />
            <SidebarIcon icon={Files} active={sidebarView === 'explorer'} onClick={() => setSidebarView('explorer')} />
            <SidebarIcon icon={Search} active={sidebarView === 'search'} onClick={() => setSidebarView('search')} />
            <SidebarIcon icon={GitGraph} active={sidebarView === 'git'} onClick={() => setSidebarView('git')} />
            <SidebarIcon icon={Bug} active={sidebarView === 'debug'} onClick={() => setSidebarView('debug')} />
            <div className="mt-auto mb-2">
                 <SidebarIcon icon={Settings} active={isSettingsOpen} onClick={() => setIsSettingsOpen(true)} />
            </div>
        </aside>

        {/* SIDEBAR PANEL */}
        <aside className="w-60 bg-[#191817] border-r border-[#33312e] flex flex-col hidden md:flex z-40">
           <div className="h-9 border-b border-[#33312e] flex items-center justify-between px-3">
               <span className="text-[10px] uppercase font-bold tracking-wider text-[#6b6a67]">{sidebarView === 'history' ? 'Chats' : sidebarView}</span>
               <div className="flex gap-1">
                   {sidebarView === 'history' ? (
                       <Edit2 className="w-3.5 h-3.5 text-[#6b6a67] hover:text-[#e3e1de] cursor-pointer" />
                   ) : (
                       <Plus className="w-3.5 h-3.5 text-[#6b6a67] hover:text-[#e3e1de] cursor-pointer" />
                   )}
                   <MoreVertical className="w-3.5 h-3.5 text-[#6b6a67] hover:text-[#e3e1de] cursor-pointer" />
               </div>
           </div>
           
           <div className="flex-1 overflow-y-auto custom-scrollbar relative">
              {sidebarView === 'history' && (
                  <div className="flex flex-col py-2">
                      <div className="px-2 mb-3">
                         <button 
                            onClick={() => {
                                setMessages([]); 
                                setInput(''); 
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-[#252423] hover:bg-[#33312e] text-[#e3e1de] text-[11px] py-1.5 rounded border border-[#33312e] transition-colors group"
                         >
                            <Plus className="w-3.5 h-3.5 text-[#6b6a67] group-hover:text-[#d97757]" />
                            <span>New Chat</span>
                         </button>
                      </div>
                      {historyGroups.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                              <span className="text-[10px] text-[#6b6a67]">No recent history</span>
                          </div>
                      ) : (
                          historyGroups.map(group => (
                             <div key={group.label} className="mb-4">
                                <div className="px-3 mb-1.5 text-[10px] font-bold text-[#6b6a67] uppercase tracking-wider">{group.label}</div>
                                {group.items.map(item => (
                                   <div key={item.id} className={`group px-3 py-2 cursor-pointer border-l-2 transition-all relative ${item.active ? 'border-[#d97757] bg-[#252423]' : 'border-transparent hover:bg-[#252423]'}`}>
                                       {editingHistoryId === item.id ? (
                                           <input 
                                              value={tempHistoryTitle}
                                              onChange={(e) => setTempHistoryTitle(e.target.value)}
                                              onKeyDown={(e) => e.key === 'Enter' && handleHistorySaveEdit()}
                                              onBlur={handleHistorySaveEdit}
                                              autoFocus
                                              className="w-full bg-[#191817] border border-[#33312e] text-[11px] text-[#e3e1de] px-1 py-0.5 focus:outline-none focus:border-[#d97757]"
                                           />
                                       ) : (
                                           <>
                                               <div className={`text-[11px] truncate pr-4 ${item.active ? 'text-[#e3e1de] font-medium' : 'text-[#9e9d99]'}`}>{item.title}</div>
                                               <div className="text-[10px] text-[#6b6a67] mt-0.5">{item.time}</div>
                                               
                                               <div className="hidden group-hover:flex items-center absolute right-2 top-2 bg-[#252423] pl-1">
                                                   <Edit2 
                                                       className="w-3 h-3 text-[#9e9d99] hover:text-[#e3e1de] mr-2" 
                                                       onClick={(e) => { e.stopPropagation(); handleHistoryStartEdit(item); }}
                                                   />
                                                   <Trash2 
                                                       className="w-3 h-3 text-[#9e9d99] hover:text-red-500" 
                                                       onClick={(e) => { e.stopPropagation(); handleHistoryDelete(item.id); }}
                                                   />
                                               </div>
                                           </>
                                       )}
                                   </div>
                                ))}
                             </div>
                          ))
                      )}
                  </div>
              )}

              {sidebarView === 'explorer' && (
                  <div className="flex flex-col h-full">
                      {/* Drop Zone */}
                      <div 
                          className={`mx-2 mb-2 p-3 border-2 border-dashed rounded transition-colors flex flex-col items-center justify-center text-center cursor-pointer ${isDraggingOverSidebar ? 'border-[#d97757] bg-[#d97757]/10' : 'border-[#33312e] hover:border-[#4a4845] bg-[#252423]'}`}
                          onDragOver={handleSidebarDragOver}
                          onDragLeave={handleSidebarDragLeave}
                          onDrop={handleSidebarDrop}
                      >
                          <Upload className={`w-4 h-4 mb-1 ${isDraggingOverSidebar ? 'text-[#d97757]' : 'text-[#6b6a67]'}`} />
                          <span className="text-[9px] text-[#9e9d99]">Drop Agent Files (.py, .yaml)</span>
                      </div>

                      <div className="p-2 flex-1 overflow-y-auto">
                          {fileTree.length === 0 ? (
                             <div className="flex flex-col items-center justify-center pt-8 opacity-40">
                                 <Folder className="w-8 h-8 text-[#4a4845] mb-2" />
                                 <span className="text-[10px] text-[#6b6a67]">No files loaded</span>
                             </div>
                          ) : (
                              fileTree.map(node => (
                                  <FileTreeItem key={node.id} node={node} depth={0} />
                              ))
                          )}
                      </div>
                  </div>
              )}
              {sidebarView === 'search' && (
                  <div className="p-2 text-center text-[#6b6a67] text-xs">
                      <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p>No results found</p>
                  </div>
              )}
              {sidebarView === 'git' && (
                   <div className="p-2 text-center text-[#6b6a67] text-xs">
                      <GitGraph className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p>No changes detected</p>
                  </div>
              )}
              {sidebarView === 'debug' && (
                   <div className="p-4 flex flex-col items-center text-center">
                      <Bug className="w-12 h-12 text-[#33312e] mb-4" />
                      <h3 className="text-[#e3e1de] text-xs font-bold mb-2">Debug Console</h3>
                      <p className="text-[10px] text-[#9e9d99] mb-6">Start a new agent debugging session to analyze performance and execution steps.</p>
                      
                      <button 
                          onClick={handleSidebarRun}
                          disabled={isSidebarRunning}
                          className="flex items-center gap-2 bg-[#d97757] hover:bg-[#e08868] disabled:bg-[#d97757]/50 text-white text-[11px] font-bold py-2 px-6 rounded transition-all shadow-lg shadow-[#d97757]/20"
                      >
                          {isSidebarRunning ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                              <Play className="w-3.5 h-3.5 fill-current" />
                          )}
                          <span>{isSidebarRunning ? 'Running...' : 'Run Agent'}</span>
                      </button>
                  </div>
              )}
           </div>
        </aside>

        {/* CHAT INTERFACE */}
        <main className="flex-1 flex flex-col relative bg-[#232220]">
           
           {/* Messages Area */}
           <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 custom-scrollbar">
              <div className="max-w-3xl mx-auto space-y-6">
                 {messages.length === 0 && (
                     <div className="flex flex-col items-center justify-center h-full pt-20 opacity-30 select-none">
                         <div className="w-16 h-16 rounded-full bg-[#191817] flex items-center justify-center mb-4">
                             <Terminal className="w-8 h-8 text-[#d97757]" />
                         </div>
                         <h1 className="text-xl font-serif font-medium text-[#e3e1de] tracking-tight">Claude Code CLI</h1>
                         <p className="text-xs text-[#9e9d99] mt-2">Ready for input</p>
                     </div>
                 )}
                 {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-fade-in`}>
                       
                       {/* ASSISTANT */}
                       {msg.role === 'assistant' && (
                          <div className="w-full max-w-3xl pl-1">
                             
                             {/* Slim Assistant Header */}
                             <div className="flex items-center gap-2 mb-1">
                                <Sparkles className="w-3.5 h-3.5 text-[#d97757]" />
                                <span className="text-[10px] font-bold font-serif text-[#9e9d99] tracking-wide">CLAUDE</span>
                             </div>

                             {/* Thinking Component */}
                             {msg.type === 'thought' && msg.content && (
                                 <ThinkingBlock 
                                    content={msg.content} 
                                    isStreaming={msg.isStreaming} 
                                    label={msg.label} 
                                    duration={msg.duration}
                                 />
                             )}

                             {/* Text Content */}
                             {(msg.type === 'text' || msg.type === undefined) && (
                                 <div className="text-[13px] leading-relaxed text-[#e3e1de] font-normal">
                                     {renderFormattedContent(msg.content, !!msg.isStreaming)}
                                 </div>
                             )}
                          </div>
                       )}

                       {/* USER */}
                       {msg.role === 'user' && (
                          <div className="flex flex-col items-end">
                              <div className="bg-[#191817] border border-[#33312e] text-[#e3e1de] px-3 py-2 rounded-lg shadow-sm max-w-xl text-[13px]">
                                 {msg.content}
                              </div>
                          </div>
                       )}
                    </div>
                 ))}
                 <div ref={messagesEndRef} className="h-4" />
              </div>
           </div>

           {/* INPUT AREA - Terminal Style */}
           <div className="p-4 bg-gradient-to-t from-[#232220] via-[#232220] to-transparent z-30">
              <div className="max-w-3xl mx-auto">
                 <div className="relative flex items-start gap-2 p-2.5 bg-[#2d2c2a] border border-[#33312e] rounded-lg shadow-2xl focus-within:border-[#d97757]/50 focus-within:bg-[#191817] transition-all group">
                    <div className="mt-1.5 text-[#d97757] animate-pulse">
                        <Terminal className="w-3.5 h-3.5" />
                    </div>
                    <textarea
                       value={input}
                       onChange={(e) => setInput(e.target.value)}
                       onKeyDown={(e) => {
                           if (e.key === 'Enter' && !e.shiftKey) {
                               e.preventDefault();
                               handleSendMessage();
                           }
                       }}
                       placeholder="Describe your task or enter a command..."
                       className="w-full bg-transparent text-[#e3e1de] text-[13px] font-mono placeholder-[#6b6a67] focus:outline-none resize-none py-1 custom-scrollbar"
                       rows={1}
                       style={{ minHeight: '24px', maxHeight: '120px' }}
                       autoFocus
                    />
                    <div className="absolute right-2 bottom-2">
                        <button 
                            onClick={handleSendMessage}
                            disabled={!input.trim()}
                            className={`p-1 rounded transition-all ${input.trim() ? 'bg-[#d97757] text-white shadow-lg shadow-[#d97757]/20' : 'bg-[#191817] text-[#6b6a67]'}`}
                        >
                            <ArrowUp className="w-3 h-3" />
                        </button>
                    </div>
                 </div>
                 <div className="flex justify-center mt-2 gap-4 text-[10px] text-[#9e9d99] font-mono">
                     <span className="flex items-center gap-1 hover:text-[#e3e1de] cursor-pointer"><Command className="w-3 h-3" /> Actions</span>
                     <span className="flex items-center gap-1 hover:text-[#e3e1de] cursor-pointer"><ArrowUp className="w-3 h-3" /> History</span>
                 </div>
              </div>
           </div>

           {/* STATUS LINE */}
           <div className="h-7 bg-[#191817] border-t border-[#33312e] flex items-center justify-between px-3 select-none text-[10px] font-mono text-[#9e9d99]">
               <div className="flex items-center gap-4">
                   <div className="flex items-center gap-1.5 hover:text-[#e3e1de] cursor-pointer transition-colors">
                       <div className={`w-1.5 h-1.5 rounded-full ${isTyping ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
                       <span>{isTyping ? 'BUSY' : 'READY'}</span>
                   </div>
                   <div className="h-3 w-[1px] bg-[#4a4845]"></div>
                   <div className="flex items-center gap-1.5">
                       <Activity className="w-3 h-3 text-blue-500" />
                       <span>{contextUsage}% ctx</span>
                   </div>

                   {/* Model Info Widget */}
                   {statusLineConfig.modelInfo.visible && (
                      <>
                        <div className="h-3 w-[1px] bg-[#4a4845]"></div>
                        <div className="flex items-center gap-1.5 animate-fade-in hover:bg-[#252423] transition-colors rounded px-2 py-0.5 cursor-pointer">
                            <Sparkles className={`w-3 h-3 ${statusLineConfig.modelInfo.color}`} />
                            <span className="font-medium text-[#e3e1de]">Claude 3.7 Sonnet</span>
                        </div>
                      </>
                   )}

                   {/* Git Info Widget */}
                   {statusLineConfig.gitInfo.visible && (
                      <>
                        <div className="h-3 w-[1px] bg-[#4a4845]"></div>
                        <div className="flex items-center gap-1.5 animate-fade-in hover:bg-[#252423] transition-colors rounded px-2 py-0.5 cursor-pointer">
                            <GitBranch className={`w-3 h-3 ${statusLineConfig.gitInfo.color}`} />
                            <span className="font-medium text-[#e3e1de]">main</span>
                        </div>
                      </>
                   )}

                   {/* Active Tools Widget */}
                   {statusLineConfig.activeTools.visible && (
                      <>
                        <div className="h-3 w-[1px] bg-[#4a4845]"></div>
                        <div className="flex items-center gap-1.5 animate-fade-in hover:bg-[#252423] transition-colors rounded px-2 py-0.5 cursor-default">
                            <Wrench className={`w-3 h-3 ${statusLineConfig.activeTools.color}`} />
                            <span>0 tools</span>
                        </div>
                      </>
                   )}

                   {/* Current Task Widget */}
                   {statusLineConfig.currentTask.visible && (
                      <>
                        <div className="h-3 w-[1px] bg-[#4a4845]"></div>
                        <div className="flex items-center gap-1.5 animate-fade-in hover:bg-[#252423] transition-colors rounded px-2 py-0.5 cursor-default">
                            <ListChecks className={`w-3 h-3 ${statusLineConfig.currentTask.color}`} />
                            <span>Idle</span>
                        </div>
                      </>
                   )}
               </div>
               
               <div className="flex items-center gap-4">
                   <span>UTF-8</span>
                   <span>TypeScript</span>
                   <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> --:--:--</span>
               </div>
           </div>
        </main>
      </div>
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #33312e; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4a4845; }
      `}</style>
    </div>
  );
};

export default App;