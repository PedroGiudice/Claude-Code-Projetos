# Text Extractor - Frontend Vision v1.0

> **Status:** Ready for Implementation
> **Target:** `/text-extractor` route
> **Backend:** `api-text-extractor` (already running at `/api/text/api/v1/`)

---

## 1. Design Philosophy

### Concept: "Extraction Workbench"
Technical, developer-focused interface. User uploads chaotic PDF → gets clean, structured text.

### Visual Reference
Based on **Pipeline Render** aesthetic:
- Dark theme (near-black background)
- Dotted/grid background pattern
- Cyan/green accent colors
- Monospace typography for data
- Console/terminal aesthetic
- Boxed components with dashed borders

---

## 2. Theme Specification

```css
/* COLOR PALETTE - Pipeline Render Style */
:root {
  /* Backgrounds */
  --bg-primary: #0a0a0a;        /* Near black */
  --bg-secondary: #111111;      /* Slightly lighter */
  --bg-surface: #1a1a1a;        /* Card/panel background */
  --bg-elevated: #222222;       /* Hover states */

  /* Dotted background pattern */
  --bg-pattern: radial-gradient(circle, #333 1px, transparent 1px);
  --bg-pattern-size: 20px 20px;

  /* Accent Colors */
  --accent-primary: #00ff9d;    /* Cyan-green (START blocks) */
  --accent-secondary: #00d4ff;  /* Cyan (AGENT blocks) */
  --accent-warning: #ffaa00;    /* Orange */
  --accent-error: #ff4444;      /* Red */
  --accent-muted: #666666;      /* Dimmed text */

  /* Text */
  --text-primary: #ffffff;
  --text-secondary: #888888;
  --text-muted: #555555;

  /* Borders */
  --border-default: #333333;
  --border-accent: #00ff9d;
  --border-style: dashed;       /* Dashed borders like reference */

  /* Typography */
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  --font-sans: 'Inter', system-ui, sans-serif;
}

/* Background pattern */
.workbench-bg {
  background-color: var(--bg-primary);
  background-image: var(--bg-pattern);
  background-size: var(--bg-pattern-size);
}

/* Component boxes - Pipeline style */
.panel {
  background: var(--bg-surface);
  border: 1px dashed var(--border-default);
  border-radius: 4px;
}

.panel--active {
  border-color: var(--accent-primary);
  box-shadow: 0 0 20px rgba(0, 255, 157, 0.1);
}

/* Labels like [START], [AGENT] */
.panel-label {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--accent-primary);
}

/* Icons style: [ > ], [ @ ], [ $ ] */
.toolbox-icon {
  font-family: var(--font-mono);
  color: var(--accent-primary);
}
```

---

## 3. Layout Structure

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  HEADER (48px)                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ TEXT_EXTRACTOR   v1.0.0                    [HISTORY]  [SETTINGS]  [?]  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  TOOLBOX (180px)  │  MAIN WORKSPACE (flex)                                  │
│  ┌──────────────┐ │                                                         │
│  │ [ > ] Upload │ │  ┌─────────────────────────────────────────────────┐    │
│  │ [ @ ] Config │ │  │ [UPLOAD]                              #STEP-1  │    │
│  │ [ $ ] Output │ │  │ ─────────────────────────────────────────────  │    │
│  │ [ # ] Console│ │  │                                                │    │
│  │              │ │  │  > DROP_PDF_HERE                               │    │
│  │ ──────────── │ │  │  | // Drag or click to select                  │    │
│  │              │ │  │                                                │    │
│  │ PRESETS      │ │  └─────────────────────────────────────────────────┘    │
│  │ • LGPD Mode  │ │                                                         │
│  │ • Court Docs │ │                    ┌ ─ ─ ─ ─ ─ ─ ─ ┐                    │
│  │ • Contracts  │ │                          (arrow)                        │
│  │              │ │                    └ ─ ─ ─ ─ ─ ─ ─ ┘                    │
│  └──────────────┘ │                                                         │
│                   │  ┌─────────────────────────────────────────────────┐    │
│                   │  │ [CONFIG]                              #STEP-2  │    │
│                   │  │ ─────────────────────────────────────────────  │    │
│                   │  │                                                │    │
│                   │  │  > MARGIN_PREVIEW      > IGNORE_TERMS          │    │
│                   │  │  | Visual crop area    | LGPD filter list      │    │
│                   │  │                                                │    │
│                   │  └─────────────────────────────────────────────────┘    │
│                   │                                                         │
├───────────────────┴─────────────────────────────────────────────────────────┤
│  CONSOLE (140px, collapsible)                                    [CLEAR]    │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ > [10:31:12] Ready. Awaiting PDF upload...                              ││
│  │ > _                                                                     ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Component Specifications

### 4.1 Upload Panel

```
┌─────────────────────────────────────────────────────────────────┐
│ [UPLOAD]                                              #STEP-1  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│     ┌───────────────────────────────────────────────────┐       │
│     │                                                   │       │
│     │              ┌─────────────────┐                  │       │
│     │              │   [ > ] PDF     │                  │       │
│     │              │   ───────────   │                  │       │
│     │              │   📄 → 📝       │                  │       │
│     │              └─────────────────┘                  │       │
│     │                                                   │       │
│     │         > DROP_PDF_HERE                           │       │
│     │         | // Drag file or click to browse         │       │
│     │                                                   │       │
│     │         Supported: .pdf (max 50MB)                │       │
│     │                                                   │       │
│     └───────────────────────────────────────────────────┘       │
│                                                                 │
│     ☐ Use Gemini enhancement (slower, cleaner output)           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**States:**
- `idle` - Waiting for file
- `dragover` - File hovering (border glows cyan)
- `selected` - File chosen, shows preview

### 4.2 Config Panel

```
┌─────────────────────────────────────────────────────────────────┐
│ [CONFIG]                                              #STEP-2  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  > ENGINE_SELECT                                                │
│  │ ● Marker (recommended)    ○ PDFPlumber (fallback)            │
│  │ ☑ Auto-detect OCR                                            │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  > MARGIN_CROP                                                  │
│  │                                                              │
│  │  ┌─────────────────────────────────────────┐                 │
│  │  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  Top: [15] px   │
│  │  │ ░░┌───────────────────────────────┐░░░░ │                 │
│  │  │ ░░│                               │░░░░ │                 │
│  │  │ ░░│      EXTRACTION AREA          │░░░░ │  Left: [10] px  │
│  │  │ ░░│      (white = kept)           │░░░░ │  Right: [10] px │
│  │  │ ░░│                               │░░░░ │                 │
│  │  │ ░░└───────────────────────────────┘░░░░ │                 │
│  │  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  Bottom: [20] px│
│  │  └─────────────────────────────────────────┘                 │
│  │                                                              │
│  │  [ Reset to defaults ]                                       │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  > IGNORE_TERMS (LGPD/Headers)                                  │
│  │                                                              │
│  │  ┌─────────────────────────────────────────────────────┐     │
│  │  │ Página X de Y                                   [×] │     │
│  │  │ TRIBUNAL DE JUSTIÇA                             [×] │     │
│  │  │ Documento assinado digitalmente                 [×] │     │
│  │  │ Numeração única                                 [×] │     │
│  │  ├─────────────────────────────────────────────────────┤     │
│  │  │ + Add term...                                       │     │
│  │  └─────────────────────────────────────────────────────┘     │
│  │                                                              │
│  │  [ Load preset: LGPD ▾ ]                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Output Panel

```
┌─────────────────────────────────────────────────────────────────┐
│ [OUTPUT]                                              #STEP-3  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  > EXTRACTED_TEXT                     [COPY] [DOWNLOAD ▾] [⟳]  │
│  │ ────────────────────────────────────────────────────────    │
│  │                                                              │
│  │  CONTRATO DE LOCAÇÃO RESIDENCIAL                             │
│  │                                                              │
│  │  DAS PARTES                                                  │
│  │                                                              │
│  │  LOCADOR: João da Silva, brasileiro, casado,                 │
│  │  empresário, portador do RG nº 12.345.678-9 SSP/SP           │
│  │  e inscrito no CPF sob nº 123.456.789-00...                  │
│  │                                                              │
│  │  ════════════════════════════════════════════════════════    │
│  │                                                              │
│  │  DO OBJETO                                                   │
│  │  ...                                                         │
│  │                                                              │
│  └──────────────────────────────────────────────────────────    │
│                                                                 │
│  ┌───────────────────────┐  ┌─────────────────────────────────┐ │
│  │ > ENTITIES            │  │ > METADATA                      │ │
│  │ │                     │  │ │                               │ │
│  │ │ 👤 PESSOAS (2)      │  │ │ Pages: 32                     │ │
│  │ │ • João da Silva     │  │ │ Time: 2m 34s                  │ │
│  │ │ • Maria Oliveira    │  │ │ Engine: Marker + OCR          │ │
│  │ │                     │  │ │ Chars: 48,234                 │ │
│  │ │ 📄 CPF (2)          │  │ │ Filtered: 96 terms            │ │
│  │ │ • 123.456.789-00    │  │ │                               │ │
│  │ │ • 987.654.321-00    │  │ │ Job: abc-123-def              │ │
│  │ │                     │  │ │                               │ │
│  │ │ 📅 DATAS (3)        │  │ └───────────────────────────────│ │
│  │ │ 💰 VALORES (2)      │  │                                 │ │
│  │ └─────────────────────│  │                                 │ │
│  └───────────────────────┘  └─────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.4 Console Panel

```
┌─────────────────────────────────────────────────────────────────┐
│ CONSOLE                                              [× CLEAR] │
├─────────────────────────────────────────────────────────────────┤
│ > [10:31:12] System initialized. Ready.                         │
│ > [10:31:45] File selected: contrato.pdf (4.2 MB, 32 pages)     │
│ > [10:31:46] Pre-flight check: ✓ Valid PDF, ✓ Not encrypted     │
│ > [10:31:47] Detection: Scanned document (OCR required)         │
│ > [10:31:48] Job submitted: abc-123-def                         │
│ > [10:31:49] Engine: Marker + Tesseract OCR                     │
│ > [10:31:52] Processing page 1/32...                            │
│ > [10:31:55] Processing page 2/32...                            │
│ > [10:31:58] Processing page 3/32... ████████░░░░░░░░░░░░ 9%    │
│ > _                                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. State Machine

```
                    ┌─────────────────┐
                    │      IDLE       │
                    │  (initial)      │
                    └────────┬────────┘
                             │ file selected
                             ▼
                    ┌─────────────────┐
                    │    PREFLIGHT    │
                    │  (validating)   │
                    └────────┬────────┘
                             │ valid + user confirms
                             ▼
                    ┌─────────────────┐
                    │   CONFIGURING   │
                    │  (user adjusts) │
                    └────────┬────────┘
                             │ user clicks EXTRACT
                             ▼
                    ┌─────────────────┐
                    │   PROCESSING    │◄──────┐
                    │  (job running)  │       │ polling
                    └────────┬────────┘───────┘
                             │ job completed
                    ┌────────┴────────┐
                    ▼                 ▼
           ┌─────────────┐    ┌─────────────┐
           │   SUCCESS   │    │    ERROR    │
           │  (results)  │    │  (retry?)   │
           └─────────────┘    └─────────────┘
```

---

## 6. API Integration

### Backend Endpoints (already exist)

```typescript
// Base URL: /api/text/api/v1

// Submit extraction job
POST /extract
Body: FormData { file: File, engine?: string, use_gemini?: boolean, options?: JSON }
Response: { job_id, status: "queued", estimated_completion }

// Poll job status
GET /jobs/{job_id}
Response: { job_id, status, progress, error_message? }

// Get results
GET /jobs/{job_id}/result
Response: { job_id, text, pages_processed, execution_time_seconds, engine_used, metadata }

// Health check
GET /health
```

### Frontend API Client

```typescript
// services/textExtractorApi.ts

import axios from 'axios';

const api = axios.create({
  baseURL: '/api/text/api/v1',
});

export const textExtractorApi = {
  // Submit extraction job
  submitJob: async (file: File, options: ExtractOptions) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('engine', options.engine);
    formData.append('use_gemini', String(options.useGemini));
    formData.append('options', JSON.stringify({
      margins: options.margins,
      ignoreTerms: options.ignoreTerms,
    }));
    return api.post<JobSubmitResponse>('/extract', formData);
  },

  // Poll job status
  getJobStatus: async (jobId: string) => {
    return api.get<JobStatusResponse>(`/jobs/${jobId}`);
  },

  // Get extraction results
  getJobResult: async (jobId: string) => {
    return api.get<ExtractionResult>(`/jobs/${jobId}/result`);
  },
};
```

---

## 7. Store Structure (Zustand)

```typescript
// store/textExtractorStore.ts

interface TextExtractorState {
  // Upload
  file: File | null;
  fileInfo: FileInfo | null;

  // Config
  engine: 'marker' | 'pdfplumber';
  useGemini: boolean;
  margins: { top: number; bottom: number; left: number; right: number };
  ignoreTerms: string[];

  // Job
  jobId: string | null;
  status: 'idle' | 'preflight' | 'configuring' | 'processing' | 'success' | 'error';
  progress: number;

  // Results
  result: ExtractionResult | null;
  entities: ExtractedEntities | null;

  // Console
  logs: LogEntry[];

  // Actions
  setFile: (file: File) => void;
  updateConfig: (config: Partial<ConfigState>) => void;
  submitJob: () => Promise<void>;
  pollJob: () => Promise<void>;
  reset: () => void;
  addLog: (message: string, level?: LogLevel) => void;
}
```

---

## 8. File Structure

```
frontend/src/
├── pages/
│   └── TextExtractorModule.tsx      # Main page container
├── components/
│   └── text-extractor/
│       ├── UploadPanel.tsx          # File upload with preview
│       ├── ConfigPanel.tsx          # Margins + ignore terms
│       ├── OutputPanel.tsx          # Results display
│       ├── ConsolePanel.tsx         # Log output
│       ├── MarginPreview.tsx        # Visual margin editor
│       ├── IgnoreTermsList.tsx      # LGPD terms management
│       ├── EntitiesList.tsx         # Extracted entities (deduplicated)
│       └── ProgressOverlay.tsx      # Processing state
├── store/
│   └── textExtractorStore.ts        # Zustand store
├── services/
│   └── textExtractorApi.ts          # API client
├── hooks/
│   └── useTextExtractor.ts          # Custom hook for logic
├── types/
│   └── textExtractor.ts             # TypeScript interfaces
└── styles/
    └── text-extractor.css           # Pipeline Render theme
```

---

## 9. Implementation Notes

### Must Have (v1)
- [x] File upload with drag-drop
- [x] Margin crop preview (visual)
- [x] Ignore terms list (LGPD)
- [x] Job submission + polling
- [x] Result display with copy/download
- [x] Console log output
- [x] Dark theme (Pipeline Render style)

### Nice to Have (v2)
- [ ] Entity extraction (NER for CPF, dates, values)
- [ ] Preset configurations (LGPD mode, Court docs, etc.)
- [ ] Job history panel
- [ ] Side-by-side PDF preview

### Out of Scope
- Section detection (will use Gemini separately)
- Multi-file batch processing
- Real-time collaboration

---

## 10. Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State Management | Zustand | Consistency with other modules |
| Styling | CSS Modules + CSS Variables | Theme flexibility |
| Build Tool | Vite | Already in use |
| HTTP Client | Axios | Already in use |
| Polling | setInterval + cleanup | Simple, reliable |
| Icons | Lucide React | Lightweight, consistent |

---

## 11. Acceptance Criteria

1. **Upload Flow**
   - User can drag-drop or click to select PDF
   - File validation shows in console
   - Invalid files show clear error message

2. **Configuration**
   - Margin preview updates in real-time
   - Ignore terms can be added/removed
   - Presets can be loaded (LGPD default terms)

3. **Processing**
   - Console shows real-time progress
   - Progress percentage updates via polling
   - User can see estimated time remaining

4. **Results**
   - Text displays cleanly with preserved structure
   - Copy button copies to clipboard
   - Download offers .txt, .md, .json formats
   - Metadata shows pages, time, engine used

5. **Visual**
   - Dark theme matches Pipeline Render reference
   - Dotted background pattern
   - Dashed borders on panels
   - Cyan/green accent colors
   - Monospace font for technical elements

---

*Document Version: 1.0*
*Last Updated: 2025-12-18*
*Author: Technical Director*
