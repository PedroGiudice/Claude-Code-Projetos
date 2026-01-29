# Text Extractor Local Cache & History Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrar cache local SQLite ao fluxo de extracao e implementar painel de historico funcional.

**Architecture:** O cache local (Tauri/SQLite) atua como primeira camada antes do backend. Ao submeter um PDF, calculamos SHA256 e verificamos cache local. Cache hit = resultado imediato. Cache miss = envia ao backend e salva resultado no cache local apos sucesso.

**Tech Stack:** Tauri (Rust), React 18, Zustand, TanStack Query, SQLite, TypeScript

---

## Analise de Impacto

### Arquivos a Modificar

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| `src/store/textExtractorStore.ts` | Modificar | Adicionar logica de cache no submitJob |
| `src/pages/TextExtractorModule.tsx` | Modificar | Conectar botao HISTORY ao painel |
| `src/types/textExtractor.ts` | Modificar | Adicionar tipos para historico |
| `src/components/text-extractor/HistoryPanel.tsx` | Criar | Novo componente para historico |
| `src/components/text-extractor/index.ts` | Modificar | Exportar HistoryPanel |
| `src-tauri/src/commands/cache.rs` | Modificar | Adicionar list_cache_entries |
| `src-tauri/src/lib.rs` | Modificar | Registrar novo comando |
| `src/hooks/useTauri.ts` | Modificar | Adicionar wrapper para list_cache_entries |
| `src/types/tauri.ts` | Modificar | Adicionar tipo HistoryEntry |

### Propagacao de Mudancas

```
cache.rs (Rust)
    |
    v
lib.rs (registrar comando)
    |
    v
types/tauri.ts (tipos TS)
    |
    v
hooks/useTauri.ts (wrapper)
    |
    v
store/textExtractorStore.ts (logica cache)
    |
    v
HistoryPanel.tsx (novo componente)
    |
    v
TextExtractorModule.tsx (integrar)
```

---

## Task 1: Adicionar Comando list_cache_entries no Rust

**Files:**
- Modify: `src-tauri/src/commands/cache.rs`
- Modify: `src-tauri/src/lib.rs`

**Step 1: Adicionar funcao list_cache_entries em cache.rs**

Adicionar apos a funcao `hash_file`:

```rust
#[tauri::command]
pub async fn list_cache_entries(app: tauri::AppHandle) -> Result<Vec<serde_json::Value>, AppError> {
    let db_path = get_db_path(&app);
    let conn = Connection::open(&db_path)?;

    let mut stmt = conn.prepare(
        "SELECT file_hash, file_path, cached_at FROM api_cache ORDER BY cached_at DESC LIMIT 50"
    )?;

    let entries = stmt.query_map([], |row| {
        Ok(serde_json::json!({
            "file_hash": row.get::<_, String>(0)?,
            "file_path": row.get::<_, String>(1)?,
            "cached_at": row.get::<_, i64>(2)?
        }))
    })?;

    let result: Vec<serde_json::Value> = entries.filter_map(|e| e.ok()).collect();
    Ok(result)
}
```

**Step 2: Registrar comando em lib.rs**

Modificar a linha do invoke_handler:

```rust
.invoke_handler(tauri::generate_handler![
    filesystem::list_process_folders,
    filesystem::list_pdfs_in_folder,
    cache::init_cache,
    cache::get_cached_result,
    cache::save_cached_result,
    cache::hash_file,
    cache::list_cache_entries,  // Adicionar esta linha
])
```

**Step 3: Verificar compilacao**

Run: `cd src-tauri && cargo check`
Expected: Compila sem erros

**Step 4: Commit**

```bash
git add src-tauri/src/commands/cache.rs src-tauri/src/lib.rs
git commit -m "feat(tauri): add list_cache_entries command

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Adicionar Tipos TypeScript para Historico

**Files:**
- Modify: `src/types/tauri.ts`
- Modify: `src/types/textExtractor.ts`

**Step 1: Adicionar HistoryEntry em tauri.ts**

Adicionar apos CachedResult:

```typescript
// History entry for display
export interface HistoryEntry {
  file_hash: string;
  file_path: string;
  cached_at: number; // Unix timestamp
  file_name: string; // Derived from file_path
}
```

Adicionar em TauriCommands:

```typescript
list_cache_entries: () => Promise<HistoryEntry[]>;
```

**Step 2: Adicionar tipos de historico em textExtractor.ts**

Adicionar apos TextExtractorState:

```typescript
export interface HistoryState {
  entries: HistoryEntry[];
  isOpen: boolean;
  isLoading: boolean;
}
```

Adicionar ao TextExtractorState (apos logs):

```typescript
// History
history: HistoryEntry[];
historyOpen: boolean;
historyLoading: boolean;

// History Actions
setHistoryOpen: (open: boolean) => void;
loadHistory: () => Promise<void>;
loadFromHistory: (entry: HistoryEntry) => Promise<void>;
```

**Step 3: Verificar tipos**

Run: `cd src && npx tsc --noEmit`
Expected: Erro esperado (falta importar HistoryEntry em textExtractor.ts)

**Step 4: Corrigir import**

Adicionar no topo de textExtractor.ts:

```typescript
import type { HistoryEntry } from './tauri';

// Re-export para conveniencia
export type { HistoryEntry };
```

**Step 5: Commit**

```bash
git add src/types/tauri.ts src/types/textExtractor.ts
git commit -m "feat(types): add history entry types

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Adicionar Wrapper useTauri para list_cache_entries

**Files:**
- Modify: `src/hooks/useTauri.ts`
- Modify: `src/hooks/queries/useTauriQueries.ts`

**Step 1: Adicionar listCacheEntries em useTauri.ts**

Adicionar ao interface UseTauriReturn:

```typescript
listCacheEntries: () => Promise<HistoryEntry[]>;
```

Adicionar import no topo:

```typescript
import type { ProcessFolder, PdfFile, HistoryEntry } from '@/types/tauri';
```

Adicionar funcao no hook (apos hashFile):

```typescript
/**
 * List all cache entries for history display
 */
const listCacheEntries = async (): Promise<HistoryEntry[]> => {
  if (!isAvailable) return [];

  try {
    const entries = await invoke<Array<{
      file_hash: string;
      file_path: string;
      cached_at: number;
    }>>('list_cache_entries');

    // Add file_name derived from file_path
    return entries.map(e => ({
      ...e,
      file_name: e.file_path.split('/').pop() || e.file_path.split('\\').pop() || 'Unknown',
    }));
  } catch (error) {
    console.error('list_cache_entries error:', error);
    throw error;
  }
};
```

Adicionar ao return:

```typescript
return {
  isAvailable,
  selectFolder,
  listProcessFolders,
  listPdfsInFolder,
  initCache,
  getCachedResult,
  saveCachedResult,
  hashFile,
  listCacheEntries,  // Adicionar
};
```

**Step 2: Adicionar query key em useTauriQueries.ts**

Adicionar em tauriQueryKeys:

```typescript
historyEntries: () => [...tauriQueryKeys.all, 'history'] as const,
```

Adicionar hook:

```typescript
/**
 * Hook for listing cache history entries
 */
export function useHistoryEntries() {
  const { listCacheEntries, isAvailable } = useTauri();

  return useQuery<HistoryEntry[], Error>({
    queryKey: tauriQueryKeys.historyEntries(),
    queryFn: listCacheEntries,
    enabled: isAvailable,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}
```

Adicionar import:

```typescript
import type { ProcessFolder, PdfFile, HistoryEntry } from '@/types/tauri';
```

**Step 3: Verificar tipos**

Run: `bun run build`
Expected: Build passa

**Step 4: Commit**

```bash
git add src/hooks/useTauri.ts src/hooks/queries/useTauriQueries.ts
git commit -m "feat(hooks): add listCacheEntries wrapper and query

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Criar Componente HistoryPanel

**Files:**
- Create: `src/components/text-extractor/HistoryPanel.tsx`
- Modify: `src/components/text-extractor/index.ts`

**Step 1: Criar HistoryPanel.tsx**

```typescript
import React from 'react';
import { X, FileText, Clock, Loader2 } from 'lucide-react';
import type { HistoryEntry } from '@/types/textExtractor';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  entries: HistoryEntry[];
  isLoading: boolean;
  onSelect: (entry: HistoryEntry) => void;
}

export function HistoryPanel({
  isOpen,
  onClose,
  entries,
  isLoading,
  onSelect,
}: HistoryPanelProps) {
  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="te-history-overlay" onClick={onClose}>
      <div className="te-history-panel" onClick={(e) => e.stopPropagation()}>
        <div className="te-history-header">
          <span className="te-history-title">EXTRACTION HISTORY</span>
          <button
            type="button"
            onClick={onClose}
            className="te-history-close"
            aria-label="Close history"
          >
            <X size={16} />
          </button>
        </div>

        <div className="te-history-content">
          {isLoading ? (
            <div className="te-history-loading">
              <Loader2 className="te-spin" size={24} />
              <span>Loading history...</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="te-history-empty">
              <FileText size={32} className="te-history-empty-icon" />
              <span>No extractions in history</span>
              <span className="te-history-empty-hint">
                Extracted PDFs will appear here
              </span>
            </div>
          ) : (
            <ul className="te-history-list">
              {entries.map((entry) => (
                <li key={entry.file_hash}>
                  <button
                    type="button"
                    className="te-history-item"
                    onClick={() => onSelect(entry)}
                  >
                    <FileText size={16} className="te-history-item-icon" />
                    <div className="te-history-item-info">
                      <span className="te-history-item-name">{entry.file_name}</span>
                      <span className="te-history-item-date">
                        <Clock size={12} />
                        {formatDate(entry.cached_at)}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default HistoryPanel;
```

**Step 2: Exportar em index.ts**

Adicionar:

```typescript
export { HistoryPanel } from './HistoryPanel';
```

**Step 3: Adicionar estilos em text-extractor.css**

Adicionar ao final do arquivo:

```css
/* History Panel */
.te-history-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: flex-end;
  z-index: 100;
}

.te-history-panel {
  width: 360px;
  max-width: 90vw;
  height: 100%;
  background: var(--te-bg-secondary);
  border-left: 1px solid var(--te-border);
  display: flex;
  flex-direction: column;
}

.te-history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--te-border);
}

.te-history-title {
  font-family: var(--te-font-mono);
  font-size: 14px;
  color: var(--te-accent);
}

.te-history-close {
  background: transparent;
  border: none;
  color: var(--te-text-muted);
  cursor: pointer;
  padding: 4px;
}

.te-history-close:hover {
  color: var(--te-text);
}

.te-history-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.te-history-loading,
.te-history-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 12px;
  color: var(--te-text-muted);
}

.te-history-empty-icon {
  opacity: 0.5;
}

.te-history-empty-hint {
  font-size: 12px;
  opacity: 0.7;
}

.te-history-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.te-history-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  text-align: left;
  color: var(--te-text);
  transition: all 0.15s ease;
}

.te-history-item:hover {
  background: var(--te-bg-tertiary);
  border-color: var(--te-border);
}

.te-history-item-icon {
  color: var(--te-accent);
  flex-shrink: 0;
}

.te-history-item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.te-history-item-name {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.te-history-item-date {
  font-size: 11px;
  color: var(--te-text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
}
```

**Step 4: Verificar build**

Run: `bun run build`
Expected: Build passa

**Step 5: Commit**

```bash
git add src/components/text-extractor/HistoryPanel.tsx src/components/text-extractor/index.ts src/styles/text-extractor.css
git commit -m "feat(ui): add HistoryPanel component

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Integrar Cache no Store

**Files:**
- Modify: `src/store/textExtractorStore.ts`

**Step 1: Adicionar imports e estado de historico**

Adicionar imports:

```typescript
import { isTauri } from '@/lib/tauri';
import type { HistoryEntry } from '@/types/textExtractor';
```

Adicionar ao estado inicial (apos logs: []):

```typescript
// History
history: [] as HistoryEntry[],
historyOpen: false,
historyLoading: false,
```

**Step 2: Adicionar acoes de historico**

Adicionar apos clearLogs:

```typescript
setHistoryOpen: (open) => set({ historyOpen: open }),

loadHistory: async () => {
  if (!isTauri()) return;

  set({ historyLoading: true });
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const entries = await invoke<Array<{
      file_hash: string;
      file_path: string;
      cached_at: number;
    }>>('list_cache_entries');

    const history: HistoryEntry[] = entries.map(e => ({
      ...e,
      file_name: e.file_path.split('/').pop() || e.file_path.split('\\').pop() || 'Unknown',
    }));

    set({ history, historyLoading: false });
  } catch (error) {
    console.error('Failed to load history:', error);
    set({ historyLoading: false });
  }
},

loadFromHistory: async (entry) => {
  const { addLog } = get();

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const cachedJson = await invoke<string | null>('get_cached_result', {
      fileHash: entry.file_hash
    });

    if (cachedJson) {
      const result = JSON.parse(cachedJson);
      set({
        result,
        status: 'success',
        historyOpen: false,
        fileInfo: {
          name: entry.file_name,
          size: 0,
          type: 'application/pdf'
        }
      });
      addLog(`Loaded from cache: ${entry.file_name}`, 'success');
      addLog(`Cached at: ${new Date(entry.cached_at * 1000).toLocaleString('pt-BR')}`, 'info');
    } else {
      addLog('Cache entry not found', 'error');
    }
  } catch (error) {
    addLog('Failed to load from cache', 'error');
  }
},
```

**Step 3: Modificar submitJob para usar cache**

Substituir o submitJob completo:

```typescript
submitJob: async () => {
  const { file, engine, gpuMode, useGemini, margins, ignoreTerms, addLog } = get();

  if (!file) {
    addLog('Error: No file selected', 'error');
    return;
  }

  set({ status: 'processing', progress: 0 });
  addLog(`Starting extraction...`, 'info');

  // Check local cache first (Tauri only)
  if (isTauri()) {
    try {
      addLog('Checking local cache...', 'info');
      const { invoke } = await import('@tauri-apps/api/core');

      // Calculate hash from file content
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const fileHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Check cache
      const cachedJson = await invoke<string | null>('get_cached_result', { fileHash });

      if (cachedJson) {
        const result = JSON.parse(cachedJson);
        set({ result, status: 'success', progress: 100 });
        addLog('Cache hit! Loaded from local storage.', 'success');
        addLog(`Original extraction: ${result.pages_processed} pages in ${result.execution_time_seconds.toFixed(1)}s`, 'info');
        return;
      }

      addLog('Cache miss. Sending to backend...', 'info');
    } catch (cacheError) {
      addLog('Cache check skipped (error)', 'warning');
      console.error('Cache error:', cacheError);
    }
  }

  addLog(`Engine: ${engine}${useGemini ? ' + Gemini' : ''} | GPU: ${gpuMode}`, 'info');

  try {
    const response = await textExtractorApi.submitJob(file, {
      engine,
      gpuMode,
      useGemini,
      margins,
      ignoreTerms,
    });

    set({ jobId: response.job_id });
    addLog(`Job submitted: ${response.job_id}`, 'success');

    // Start polling
    get().pollJob();
  } catch (error: any) {
    const errorMsg = error.response?.data?.detail || error.message || 'Unknown error';
    set({ status: 'error' });
    addLog(`Submission failed: ${errorMsg}`, 'error');
  }
},
```

**Step 4: Modificar pollJob para salvar no cache**

Adicionar apos set({ result, status: 'success' }) no bloco 'completed':

```typescript
// Save to local cache (Tauri only)
if (isTauri() && file) {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const fileHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    await invoke('save_cached_result', {
      fileHash,
      filePath: file.name,
      apiResponse: JSON.stringify(result),
      backendUrl: window.location.origin,
    });
    addLog('Result cached locally', 'info');
  } catch (cacheError) {
    console.error('Failed to cache result:', cacheError);
  }
}
```

**Step 5: Atualizar tipo do estado**

Adicionar ao TextExtractorState em types/textExtractor.ts as novas acoes:

```typescript
// History
history: HistoryEntry[];
historyOpen: boolean;
historyLoading: boolean;

// History Actions
setHistoryOpen: (open: boolean) => void;
loadHistory: () => Promise<void>;
loadFromHistory: (entry: HistoryEntry) => Promise<void>;
```

**Step 6: Verificar build**

Run: `bun run build`
Expected: Build passa

**Step 7: Commit**

```bash
git add src/store/textExtractorStore.ts src/types/textExtractor.ts
git commit -m "feat(store): integrate local cache in extraction flow

- Check cache before sending to backend
- Save results to cache after extraction
- Add history state and actions

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Conectar HistoryPanel ao Modulo

**Files:**
- Modify: `src/pages/TextExtractorModule.tsx`

**Step 1: Importar HistoryPanel**

Adicionar ao import de componentes:

```typescript
import {
  UploadPanel,
  ConfigPanel,
  OutputPanel,
  ConsolePanel,
  SettingsModal,
  HistoryPanel,
} from '@/components/text-extractor';
```

**Step 2: Adicionar estado do store**

Modificar a desestruturacao do store:

```typescript
const {
  status,
  history,
  historyOpen,
  historyLoading,
  setHistoryOpen,
  loadHistory,
  loadFromHistory,
} = useTextExtractorStore();
```

**Step 3: Adicionar handler para abrir historico**

Adicionar funcao:

```typescript
const handleOpenHistory = () => {
  loadHistory();
  setHistoryOpen(true);
};
```

**Step 4: Conectar botao HISTORY**

Substituir o botao HISTORY (linhas 83-86):

```typescript
<button
  type="button"
  className="te-header-btn"
  aria-label="View history"
  onClick={handleOpenHistory}
>
  <History size={16} />
  <span>HISTORY</span>
</button>
```

**Step 5: Adicionar HistoryPanel ao render**

Adicionar antes do fechamento da div.te-module:

```typescript
{/* History Panel */}
<HistoryPanel
  isOpen={historyOpen}
  onClose={() => setHistoryOpen(false)}
  entries={history}
  isLoading={historyLoading}
  onSelect={loadFromHistory}
/>
```

**Step 6: Verificar build**

Run: `bun run build`
Expected: Build passa

**Step 7: Testar funcionamento**

Run: `bun run dev`
Abrir http://localhost:5173/text-extractor
1. Clicar em HISTORY - deve abrir painel lateral
2. Painel deve mostrar "No extractions in history" se vazio
3. Fechar clicando no X ou fora do painel

**Step 8: Commit**

```bash
git add src/pages/TextExtractorModule.tsx
git commit -m "feat(ui): connect HistoryPanel to TextExtractorModule

- Add onClick handler to HISTORY button
- Load and display extraction history
- Allow loading cached results from history

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Testes e Validacao Final

**Step 1: Build completo**

Run: `bun run build`
Expected: Build passa sem erros

**Step 2: Lint**

Run: `bun run lint`
Expected: Sem novos erros (warnings pre-existentes OK)

**Step 3: Build Tauri**

Run: `cd src-tauri && cargo build`
Expected: Compila sem erros

**Step 4: Teste E2E Manual**

1. Iniciar app Tauri: `bun run tauri dev`
2. Navegar para Text Extractor
3. Fazer upload de PDF e extrair
4. Verificar log "Result cached locally"
5. Resetar e fazer upload do MESMO PDF
6. Verificar log "Cache hit! Loaded from local storage."
7. Clicar HISTORY e verificar entrada
8. Clicar na entrada para recarregar resultado

**Step 5: Commit final**

```bash
git add -A
git commit -m "feat(text-extractor): complete local cache and history implementation

- Rust: list_cache_entries command
- Types: HistoryEntry interface
- Hooks: listCacheEntries wrapper
- UI: HistoryPanel component with slide-in animation
- Store: cache check before backend, save after success
- Integration: HISTORY button now functional

Closes #XXX

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Resumo de Complexidade

| Aspecto | Avaliacao |
|---------|-----------|
| Linhas de codigo novas | ~250 |
| Arquivos modificados | 9 |
| Arquivos criados | 1 |
| Risco de regressao | Baixo (aditivo) |
| Tempo estimado | 2-3 horas |
| Dependencias externas | Nenhuma |

A infraestrutura ja estava 80% pronta. O trabalho principal e a integracao e UI.
