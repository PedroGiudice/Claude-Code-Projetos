# Frontend Refactoring Plan - Claude Code UI

> **Target:** Modernizar o frontend para um design limpo e minimalista baseado na referência visual.
> **Executar com:** Use `superpowers:executing-plans` skill

---

## Visão Geral da Referência Visual

A UI de referência apresenta:
- **Icon Rail** (esquerda): Barra vertical estreita com ícones de navegação
- **Sidebar Colapsável**: Lista de chats agrupados por data
- **Área Principal**: Chat limpo com bom espaçamento
- **Input Moderno**: Área de entrada com botões "Actions" e "History"
- **Status Bar**: Mostra estado da conexão e uso de contexto
- **Model Selector**: Indicador do modelo atual (Claude 3.7 Sonnet)

---

## Problemas Atuais

| Arquivo | Tamanho | Problema |
|---------|---------|----------|
| `ChatInterface.jsx` | 224KB (~4000 linhas) | God component, precisa ser dividido |
| `Sidebar.jsx` | 67KB | Muito acoplado, lógica complexa |
| `Settings.jsx` | 96KB | Monolítico |
| `App.jsx` | 41KB | Muita lógica inline |

---

## FASE 1: Criar Layout Base com Icon Rail

### Task 1.1: Criar componente IconRail

**Files:**
- Create: `src/components/layout/IconRail.jsx`
- Create: `src/components/layout/IconRail.css` (ou usar Tailwind)

**Implementação:**
```jsx
// src/components/layout/IconRail.jsx
import { MessageSquare, FolderOpen, Search, Settings, Terminal, GitBranch } from 'lucide-react';

const navItems = [
  { id: 'chat', icon: MessageSquare, label: 'Chat' },
  { id: 'files', icon: FolderOpen, label: 'Files' },
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'terminal', icon: Terminal, label: 'Terminal' },
  { id: 'git', icon: GitBranch, label: 'Git' },
];

export default function IconRail({ activeTab, onTabChange, onSettingsClick }) {
  return (
    <div className="w-12 bg-zinc-950 border-r border-zinc-800 flex flex-col items-center py-3">
      {/* Navigation Icons */}
      <div className="flex flex-col gap-1">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`p-2.5 rounded-lg transition-colors ${
              activeTab === id
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
            }`}
            title={label}
          >
            <Icon size={20} />
          </button>
        ))}
      </div>

      {/* Settings at bottom */}
      <div className="mt-auto">
        <button
          onClick={onSettingsClick}
          className="p-2.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors"
          title="Settings"
        >
          <Settings size={20} />
        </button>
      </div>
    </div>
  );
}
```

**Expected:** Barra vertical com 12px de largura, ícones centralizados, settings no fundo

---

### Task 1.2: Criar novo layout wrapper

**Files:**
- Create: `src/components/layout/AppLayout.jsx`

**Implementação:**
```jsx
// src/components/layout/AppLayout.jsx
import IconRail from './IconRail';
import ChatSidebar from './ChatSidebar';

export default function AppLayout({
  children,
  activeTab,
  onTabChange,
  sidebarOpen,
  onToggleSidebar,
  selectedProject,
  sessions,
  onSelectSession,
  onNewChat
}) {
  return (
    <div className="h-screen flex bg-zinc-950">
      {/* Icon Rail - Always visible */}
      <IconRail
        activeTab={activeTab}
        onTabChange={onTabChange}
      />

      {/* Collapsible Sidebar */}
      {sidebarOpen && (
        <ChatSidebar
          selectedProject={selectedProject}
          sessions={sessions}
          onSelectSession={onSelectSession}
          onNewChat={onNewChat}
          onClose={() => onToggleSidebar(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
}
```

---

### Task 1.3: Criar ChatSidebar componente

**Files:**
- Create: `src/components/layout/ChatSidebar.jsx`

**Implementação:**
```jsx
// src/components/layout/ChatSidebar.jsx
import { Plus, Pencil, MoreHorizontal, X } from 'lucide-react';
import { groupSessionsByDate } from '../../utils/dateUtils';

export default function ChatSidebar({
  selectedProject,
  sessions,
  selectedSessionId,
  onSelectSession,
  onNewChat,
  onClose
}) {
  const groupedSessions = groupSessionsByDate(sessions);

  return (
    <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      {/* Project Header */}
      <div className="p-3 border-b border-zinc-800 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <span className="text-sm text-zinc-400 truncate flex-1">
          {selectedProject?.displayName || '~/project'}
        </span>
      </div>

      {/* Chats Header */}
      <div className="px-3 py-2 flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
          Chats
        </span>
        <div className="flex gap-1">
          <button className="p-1 text-zinc-500 hover:text-zinc-300 rounded">
            <Pencil size={14} />
          </button>
          <button className="p-1 text-zinc-500 hover:text-zinc-300 rounded">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="px-3 pb-2">
        <button
          onClick={onNewChat}
          className="w-full py-2 px-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto px-2">
        {Object.entries(groupedSessions).map(([group, groupSessions]) => (
          <div key={group} className="mb-4">
            <div className="px-2 py-1 text-xs font-medium text-zinc-600 uppercase tracking-wider">
              {group}
            </div>
            {groupSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session)}
                className={`w-full text-left px-2 py-2 rounded-lg mb-0.5 transition-colors ${
                  selectedSessionId === session.id
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                }`}
              >
                <div className="text-sm truncate font-medium">
                  {session.title || 'New Chat'}
                </div>
                <div className="text-xs text-zinc-600">
                  {formatTime(session.lastModified)}
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
}
```

---

## FASE 2: Refatorar ChatInterface

### Task 2.1: Extrair MessageBubble componente

**Files:**
- Create: `src/components/chat/MessageBubble.jsx`
- Create: `src/components/chat/MessageContent.jsx`
- Create: `src/components/chat/ToolCall.jsx`

**Purpose:** Separar a renderização de mensagens do ChatInterface

**MessageBubble.jsx:**
```jsx
// src/components/chat/MessageBubble.jsx
import { Sparkles, User } from 'lucide-react';
import MessageContent from './MessageContent';

export default function MessageBubble({ message, isUser }) {
  return (
    <div className={`flex gap-3 py-4 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
          <Sparkles size={16} className="text-orange-500" />
        </div>
      )}

      <div className={`max-w-3xl ${isUser ? 'order-first' : ''}`}>
        <div className="text-xs text-zinc-500 mb-1 uppercase font-medium">
          {isUser ? 'You' : 'Claude'}
        </div>
        <MessageContent content={message.content} />
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
          <User size={16} className="text-zinc-300" />
        </div>
      )}
    </div>
  );
}
```

---

### Task 2.2: Extrair ChatInput componente

**Files:**
- Create: `src/components/chat/ChatInput.jsx`

**Implementação:**
```jsx
// src/components/chat/ChatInput.jsx
import { useState, useRef } from 'react';
import { Send, Sparkles, History, Command } from 'lucide-react';
import MicButton from '../MicButton';

export default function ChatInput({
  onSend,
  onActionsClick,
  onHistoryClick,
  isProcessing,
  placeholder = "Describe your task or enter a command..."
}) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim() && !isProcessing) {
      onSend(value.trim());
      setValue('');
    }
  };

  return (
    <div className="border-t border-zinc-800 bg-zinc-900 p-4">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="relative flex items-center">
          <div className="absolute left-3 text-orange-500">
            <Sparkles size={18} />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            disabled={isProcessing}
            className="w-full pl-10 pr-24 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition-colors"
          />

          <div className="absolute right-3 flex items-center gap-2">
            <MicButton onTranscription={(text) => setValue(prev => prev + text)} />
            <button
              type="submit"
              disabled={!value.trim() || isProcessing}
              className="p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={16} className="text-zinc-300" />
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-center gap-4 mt-3">
          <button
            type="button"
            onClick={onActionsClick}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <Command size={12} />
            Actions
          </button>
          <button
            type="button"
            onClick={onHistoryClick}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <History size={12} />
            History
          </button>
        </div>
      </form>
    </div>
  );
}
```

---

### Task 2.3: Extrair StatusBar componente

**Files:**
- Create: `src/components/layout/StatusBar.jsx`

**Implementação:**
```jsx
// src/components/layout/StatusBar.jsx
import { Circle } from 'lucide-react';

export default function StatusBar({
  status = 'ready',
  contextUsage = 0,
  model = 'Claude 3.7 Sonnet'
}) {
  const statusColors = {
    ready: 'text-green-500',
    processing: 'text-yellow-500',
    error: 'text-red-500'
  };

  return (
    <div className="h-6 bg-zinc-950 border-t border-zinc-800 px-4 flex items-center justify-between text-xs">
      {/* Left: Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Circle
            size={8}
            className={`${statusColors[status]} fill-current`}
          />
          <span className="text-zinc-400 uppercase">
            {status}
          </span>
        </div>

        {contextUsage > 0 && (
          <div className="flex items-center gap-1.5 text-zinc-500">
            <span className="text-yellow-500">↑</span>
            <span>{contextUsage}% ctx</span>
          </div>
        )}
      </div>

      {/* Right: Model & extras */}
      <div className="flex items-center gap-4 text-zinc-500">
        <span>UTF-8</span>
        <span>TypeScript</span>
        <span>{new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })}</span>
      </div>
    </div>
  );
}
```

---

### Task 2.4: Criar ModelSelector componente

**Files:**
- Create: `src/components/chat/ModelSelector.jsx`

**Implementação:**
```jsx
// src/components/chat/ModelSelector.jsx
import { ChevronDown, Sparkles, Search, Settings } from 'lucide-react';
import { useState } from 'react';

const models = [
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', badge: 'Latest' },
  { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', badge: null },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', badge: null },
];

export default function ModelSelector({ currentModel, onModelChange }) {
  const [open, setOpen] = useState(false);
  const selected = models.find(m => m.id === currentModel) || models[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
      >
        <Sparkles size={14} className="text-orange-500" />
        <span className="text-sm text-zinc-300">{selected.name}</span>
        <ChevronDown size={14} className="text-zinc-500" />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-zinc-800 rounded-lg border border-zinc-700 shadow-xl z-50">
          <div className="p-2">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  onModelChange(model.id);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${
                  model.id === currentModel
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-400 hover:bg-zinc-700/50'
                }`}
              >
                <span>{model.name}</span>
                {model.badge && (
                  <span className="text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded">
                    {model.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## FASE 3: Reorganizar Estrutura de Pastas

### Task 3.1: Criar estrutura modular

**Execute:**
```bash
mkdir -p src/components/layout
mkdir -p src/components/chat
mkdir -p src/components/files
mkdir -p src/components/terminal
mkdir -p src/components/settings
mkdir -p src/components/common
```

**Nova estrutura:**
```
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.jsx       # Layout wrapper principal
│   │   ├── IconRail.jsx        # Barra de ícones vertical
│   │   ├── ChatSidebar.jsx     # Sidebar de chats
│   │   └── StatusBar.jsx       # Barra de status inferior
│   ├── chat/
│   │   ├── ChatView.jsx        # Container do chat (refatorado do ChatInterface)
│   │   ├── MessageBubble.jsx   # Bolha de mensagem individual
│   │   ├── MessageContent.jsx  # Renderização de conteúdo (markdown, code)
│   │   ├── ChatInput.jsx       # Input de mensagens
│   │   ├── ToolCall.jsx        # Visualização de tool calls
│   │   └── ModelSelector.jsx   # Seletor de modelo
│   ├── files/
│   │   ├── FileBrowser.jsx     # Browser de arquivos (extraído)
│   │   └── FileEditor.jsx      # Editor de arquivos
│   ├── terminal/
│   │   └── TerminalView.jsx    # Terminal (extraído do Shell.jsx)
│   ├── settings/
│   │   ├── SettingsModal.jsx   # Modal de settings (dividido)
│   │   ├── GeneralSettings.jsx
│   │   ├── ApiSettings.jsx
│   │   └── AppearanceSettings.jsx
│   └── common/
│       ├── Button.jsx
│       ├── Modal.jsx
│       ├── Dropdown.jsx
│       └── Tooltip.jsx
├── hooks/
├── contexts/
├── utils/
│   ├── api.js
│   ├── dateUtils.js           # NEW: Funções de data
│   └── sessionUtils.js        # NEW: Funções de sessão
└── styles/
    └── globals.css
```

---

## FASE 4: Implementar Temas e Design System

### Task 4.1: Criar tokens de design

**Files:**
- Update: `tailwind.config.js`

**Adicionar:**
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Background colors
        'bg-primary': '#09090b',    // zinc-950
        'bg-secondary': '#18181b',  // zinc-900
        'bg-tertiary': '#27272a',   // zinc-800

        // Text colors
        'text-primary': '#fafafa',   // zinc-50
        'text-secondary': '#a1a1aa', // zinc-400
        'text-tertiary': '#71717a',  // zinc-500

        // Accent
        'accent-primary': '#f97316', // orange-500
        'accent-secondary': '#ea580c', // orange-600

        // Borders
        'border-primary': '#27272a', // zinc-800
        'border-secondary': '#3f3f46', // zinc-700
      },
      spacing: {
        'icon-rail': '48px',
        'sidebar': '256px',
      }
    }
  }
}
```

---

## FASE 5: Dividir ChatInterface.jsx (224KB → ~10 arquivos menores)

### Task 5.1: Análise do ChatInterface

O arquivo atual tem ~4000 linhas. Precisa ser dividido em:

| Novo Arquivo | Responsabilidade | Linhas estimadas |
|-------------|------------------|------------------|
| `ChatView.jsx` | Container principal, state management | ~300 |
| `MessageList.jsx` | Renderização da lista de mensagens | ~150 |
| `MessageBubble.jsx` | Mensagem individual | ~100 |
| `MessageContent.jsx` | Renderização de conteúdo | ~200 |
| `ToolCallDisplay.jsx` | Tool calls e resultados | ~150 |
| `CodeBlock.jsx` | Blocos de código com syntax highlight | ~100 |
| `ImageAttachment.jsx` | Renderização de imagens | ~50 |
| `ThinkingIndicator.jsx` | Indicador de "thinking" | ~50 |
| `ChatInput.jsx` | Input e controles | ~200 |
| `useChatMessages.js` | Hook para gerenciar mensagens | ~150 |
| `useChatWebSocket.js` | Hook para WebSocket | ~100 |

---

## FASE 6: Testes e Validação

### Task 6.1: Checklist de validação

- [ ] Icon Rail renderiza corretamente
- [ ] Sidebar mostra sessões agrupadas por data
- [ ] Chat funciona com WebSocket
- [ ] Mensagens renderizam markdown e código
- [ ] Tool calls são exibidos corretamente
- [ ] Input aceita texto e voz
- [ ] Status bar mostra informações corretas
- [ ] Model selector funciona
- [ ] Responsive funciona em mobile
- [ ] Tema escuro aplicado consistentemente

---

## Ordem de Execução Recomendada

```
1. FASE 1 → Layout base (IconRail, AppLayout, ChatSidebar)
2. FASE 3 → Criar estrutura de pastas
3. FASE 2 → Extrair componentes do chat
4. FASE 4 → Design system
5. FASE 5 → Dividir ChatInterface
6. FASE 6 → Testes
```

---

## Notas Importantes

1. **Manter compatibilidade:** Não quebrar funcionalidade existente durante refatoração
2. **Incremental:** Fazer uma fase por vez, testar antes de prosseguir
3. **WebSocket:** O chat depende de WebSocket, manter conexão estável
4. **Mobile:** Manter responsividade
5. **Git:** Commitar após cada fase completada

---

## Estimativa de Esforço

| Fase | Esforço | Prioridade |
|------|---------|------------|
| FASE 1 | 2-3 horas | Alta |
| FASE 2 | 3-4 horas | Alta |
| FASE 3 | 1 hora | Média |
| FASE 4 | 1-2 horas | Média |
| FASE 5 | 4-6 horas | Alta |
| FASE 6 | 1-2 horas | Alta |

**Total estimado:** 12-18 horas de desenvolvimento

---

*Plano criado em: 2025-12-20*
*Baseado na referência visual fornecida*
