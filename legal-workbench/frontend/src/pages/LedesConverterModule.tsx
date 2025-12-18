import { useCallback } from 'react';
import { useLedesConverterStore } from '@/store/ledesConverterStore';
import { sanitizeFilename } from '@/services/ledesConverterApi';
import { DropZone } from '@/components/upload/DropZone';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { FileText, Download, RefreshCw, Upload, CheckCircle, AlertCircle, FileCheck } from 'lucide-react';

// Status label mapping
const STATUS_LABELS: Record<string, string> = {
  idle: 'Ready',
  validating: 'Validating file...',
  uploading: 'Uploading...',
  processing: 'Converting to LEDES...',
  success: 'Conversion complete',
  error: 'Conversion failed',
};

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-text-muted">
      <Upload size={48} className="mb-4 opacity-50" />
      <h2 className="text-lg font-medium mb-2">No Document Selected</h2>
      <p className="text-sm">Upload a DOCX invoice to convert to LEDES format</p>
    </div>
  );
}

function ProgressBar({ progress, status }: { progress: number; status: string }) {
  const isActive = status === 'uploading' || status === 'processing';
  const statusLabel = STATUS_LABELS[status] || status;

  return (
    <div className="space-y-2" role="status" aria-live="polite" aria-label="Conversion progress">
      <div className="flex justify-between text-xs text-text-muted">
        <span>{statusLabel}</span>
        <span>{progress}%</span>
      </div>
      <div className="w-full bg-bg-main rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${
            isActive ? 'bg-accent-violet animate-pulse' : 'bg-accent-violet'
          }`}
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${statusLabel}: ${progress}% complete`}
        />
      </div>
    </div>
  );
}

function ExtractedDataPreview({ data }: { data: NonNullable<ReturnType<typeof useLedesConverterStore.getState>['extractedData']> }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wide">
        Extracted Data
      </h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-text-muted">Invoice #</span>
          <span className="text-text-primary font-mono">{data.invoice_number || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Date</span>
          <span className="text-text-primary font-mono">{data.invoice_date || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Client ID</span>
          <span className="text-text-primary font-mono">{data.client_id || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Matter ID</span>
          <span className="text-text-primary font-mono">{data.matter_id || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Total</span>
          <span className="text-text-primary font-mono font-semibold">
            ${data.invoice_total?.toFixed(2) || '0.00'}
          </span>
        </div>
        {data.line_items && data.line_items.length > 0 && (
          <div className="pt-2 border-t border-border-default">
            <span className="text-text-muted">Line Items: {data.line_items.length}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LedesConverterModule() {
  const {
    file,
    status,
    uploadProgress,
    ledesContent,
    extractedData,
    error,
    setFile,
    convertFile,
    downloadResult,
    reset,
  } = useLedesConverterStore();

  // Memoized callbacks
  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
  }, [setFile]);

  const handleConvert = useCallback(() => {
    convertFile();
  }, [convertFile]);

  const handleDownload = useCallback(() => {
    downloadResult();
  }, [downloadResult]);

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  // Derived values (no need to memoize trivial operations)
  const sanitizedFilename = file ? sanitizeFilename(file.name) : '';
  const isConverting = status === 'uploading' || status === 'processing' || status === 'validating';
  const hasResult = status === 'success' && ledesContent;

  return (
    <div className="flex flex-col h-full bg-bg-main text-text-primary">
      {/* Header */}
      <header className="h-12 border-b border-border-default bg-bg-panel-1 flex items-center px-4">
        <FileText className="text-accent-violet mr-2" size={20} />
        <h1 className="text-lg font-bold text-accent-violet">LEDES Converter</h1>
        <div className="ml-auto text-text-muted text-xs flex items-center gap-2">
          {status === 'success' && (
            <span className="flex items-center text-green-500">
              <CheckCircle size={14} className="mr-1" />
              Ready to download
            </span>
          )}
          {status === 'error' && (
            <span className="flex items-center text-red-500">
              <AlertCircle size={14} className="mr-1" />
              Error
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Upload & Controls */}
        <aside className="w-72 border-r border-border-default flex flex-col bg-bg-panel-1">
          {/* Upload Section */}
          <div className="p-4 border-b border-border-default">
            <h2 className="text-sm font-semibold text-text-muted mb-3 uppercase tracking-wide">
              Upload DOCX
            </h2>
            <DropZone
              onFileSelect={handleFileSelect}
              accept=".docx"
              disabled={isConverting}
            />
            {file && (
              <div className="mt-3 p-2 bg-bg-main rounded border border-border-default">
                <div className="flex items-center gap-2">
                  <FileCheck size={16} className="text-accent-violet flex-shrink-0" />
                  <span
                    className="text-sm text-text-primary truncate"
                    title={file.name}
                    aria-label={`Selected file: ${sanitizedFilename}`}
                  >
                    {sanitizedFilename}
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            )}
          </div>

          {/* Actions Section */}
          <div className="p-4 border-b border-border-default space-y-3">
            <h2 className="text-sm font-semibold text-text-muted mb-3 uppercase tracking-wide">
              Actions
            </h2>
            <Button
              onClick={handleConvert}
              disabled={!file || isConverting}
              className="w-full"
            >
              {isConverting ? (
                <span className="flex items-center justify-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  {STATUS_LABELS[status]}
                </span>
              ) : (
                'Convert to LEDES'
              )}
            </Button>
            <Button
              onClick={handleReset}
              variant="secondary"
              disabled={isConverting}
              className="w-full"
            >
              <RefreshCw size={16} className="mr-2" />
              Reset
            </Button>
          </div>

          {/* Progress Section */}
          {(isConverting || hasResult) && (
            <div className="p-4 border-b border-border-default">
              <ProgressBar progress={uploadProgress} status={status} />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-4 border-b border-border-default">
              <div
                className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400"
                role="alert"
                aria-live="assertive"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              </div>
            </div>
          )}

          {/* Extracted Data Preview */}
          {extractedData && (
            <div className="p-4 flex-1 overflow-y-auto">
              <ExtractedDataPreview data={extractedData} />
            </div>
          )}
        </aside>

        {/* Center - Result Viewer */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {hasResult ? (
            <div className="flex-1 flex flex-col p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide">
                  LEDES Output
                </h2>
                <Button
                  onClick={handleDownload}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Download size={16} className="mr-2" />
                  Download LEDES
                </Button>
              </div>
              <div className="flex-1 overflow-hidden rounded border border-border-default bg-bg-panel-1">
                <textarea
                  readOnly
                  aria-label="LEDES conversion result"
                  aria-describedby="ledes-result-description"
                  className="w-full h-full p-4 text-sm font-mono bg-transparent text-text-primary resize-none focus:outline-none"
                  value={ledesContent}
                />
                <span id="ledes-result-description" className="sr-only">
                  Converted LEDES format text. Use the download button to save.
                </span>
              </div>
            </div>
          ) : (
            <EmptyState />
          )}
        </main>

        {/* Right Sidebar - Info */}
        <aside className="w-64 border-l border-border-default bg-bg-panel-1">
          <div className="p-4 border-b border-border-default">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wide">
              About LEDES
            </h2>
          </div>
          <div className="p-4 text-sm text-text-muted space-y-4">
            <p>
              LEDES (Legal Electronic Data Exchange Standard) is a standardized format
              for legal billing data exchange.
            </p>
            <div>
              <h3 className="text-text-primary font-medium mb-2">Supported Format</h3>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>LEDES 1998B</li>
                <li>Pipe-delimited (|)</li>
                <li>UTF-8 encoding</li>
              </ul>
            </div>
            <div>
              <h3 className="text-text-primary font-medium mb-2">Input Requirements</h3>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>DOCX format only</li>
                <li>Maximum 10MB file size</li>
                <li>Invoice with structured data</li>
              </ul>
            </div>
            <div className="pt-2 border-t border-border-default">
              <p className="text-xs">
                The converter extracts invoice data from DOCX documents and generates
                LEDES 1998B compliant output.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
