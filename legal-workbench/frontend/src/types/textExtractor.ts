// Text Extractor Types

export type ExtractionEngine = 'marker' | 'pdfplumber';
export type ExtractionStatus = 'idle' | 'preflight' | 'configuring' | 'processing' | 'success' | 'error';
export type LogLevel = 'info' | 'warning' | 'error' | 'success';

export interface FileInfo {
  name: string;
  size: number;
  pages?: number;
  type: string;
}

export interface Margins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface ExtractOptions {
  engine: ExtractionEngine;
  useGemini: boolean;
  margins: Margins;
  ignoreTerms: string[];
}

export interface JobSubmitResponse {
  job_id: string;
  status: string;
  estimated_completion?: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: string;
  progress: number;
  error_message?: string;
}

export interface ExtractedEntity {
  type: 'pessoa' | 'cpf' | 'cnpj' | 'data' | 'valor' | 'email' | 'telefone';
  value: string;
  count: number;
}

export interface ExtractionMetadata {
  pages_processed: number;
  execution_time_seconds: number;
  engine_used: string;
  total_chars: number;
  filtered_terms: number;
  ocr_detected?: boolean;
}

export interface ExtractionResult {
  job_id: string;
  text: string;
  metadata: ExtractionMetadata;
  entities?: ExtractedEntity[];
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  level: LogLevel;
}

export interface TextExtractorState {
  // Upload
  file: File | null;
  fileInfo: FileInfo | null;

  // Config
  engine: ExtractionEngine;
  useGemini: boolean;
  margins: Margins;
  ignoreTerms: string[];

  // Job
  jobId: string | null;
  status: ExtractionStatus;
  progress: number;

  // Results
  result: ExtractionResult | null;

  // Console
  logs: LogEntry[];

  // Actions
  setFile: (file: File | null) => void;
  setEngine: (engine: ExtractionEngine) => void;
  setUseGemini: (useGemini: boolean) => void;
  setMargins: (margins: Margins) => void;
  setIgnoreTerms: (terms: string[]) => void;
  addIgnoreTerm: (term: string) => void;
  removeIgnoreTerm: (term: string) => void;
  loadPreset: (preset: 'lgpd' | 'court' | 'contract') => void;
  submitJob: () => Promise<void>;
  pollJob: () => Promise<void>;
  reset: () => void;
  addLog: (message: string, level?: LogLevel) => void;
  clearLogs: () => void;
}
