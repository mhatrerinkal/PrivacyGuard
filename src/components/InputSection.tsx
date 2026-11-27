import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  ScanSearch,
  Sparkles,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react';
import { UploadedFileMeta } from '../types/pii';
import { formatFileSize } from '../utils/fileExport';

interface InputSectionProps {
  rawText: string;
  fileMeta: UploadedFileMeta | null;
  fileError: string | null;
  isDirtySinceScan: boolean;
  hasScanned: boolean;
  onTextChange: (nextText: string) => void;
  onFileUpload: (file: File) => void;
  onScan: () => void;
  onLoadSampleText: () => void;
  onLoadSampleCsv: () => void;
  onReset: () => void;
}

export const InputSection: React.FC<InputSectionProps> = ({
  rawText,
  fileMeta,
  fileError,
  isDirtySinceScan,
  hasScanned,
  onTextChange,
  onFileUpload,
  onScan,
  onLoadSampleText,
  onLoadSampleCsv,
  onReset,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const charCount = rawText.length;
  const wordCount = rawText.trim()
    ? rawText.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const displaySize = fileMeta
    ? formatFileSize(fileMeta.sizeBytes)
    : formatFileSize(new Blob([rawText]).size);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      onFileUpload(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileUpload(selectedFile);
    }
    // Reset input value so the same file can be re-uploaded after clearing
    e.target.value = '';
  };

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/85 p-5 sm:p-6 shadow-xl shadow-slate-950/5 dark:shadow-slate-950/40 transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-500" />
            <span>Sensitive Data Input</span>
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Paste raw text, edit directly, or upload a <code className="font-mono text-indigo-500 dark:text-indigo-300">.txt</code> or{' '}
            <code className="font-mono text-indigo-500 dark:text-indigo-300">.csv</code> file. Processing happens exclusively in memory.
          </p>
        </div>

        {/* One-Click Sample Loaders */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onLoadSampleText}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-3.5 py-2 text-xs sm:text-sm font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            <span>Load Sample Noisy Text</span>
          </button>

          <button
            type="button"
            onClick={onLoadSampleCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/35 bg-purple-500/10 px-3 py-2 text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 transition-colors"
            title="Load a multi-row sample CSV to test structured CSV sanitization"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Sample CSV</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop File Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        aria-label="Upload .txt or .csv file via drag and drop or file picker"
        className={`mb-4 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border-2 border-dashed p-4 cursor-pointer transition-all ${
          isDragging
            ? 'border-indigo-400 bg-indigo-500/10 scale-[1.005]'
            : 'border-slate-300 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-950/50 hover:border-indigo-500/50 hover:bg-slate-100/80 dark:hover:bg-slate-900'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-500 dark:text-indigo-300">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Drag &amp; drop a <span className="text-indigo-500 dark:text-indigo-400">.txt</span> or{' '}
              <span className="text-indigo-500 dark:text-indigo-400">.csv</span> file here, or click to browse
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Read locally via Browser FileReader API — zero server uploads
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200">
          Choose File
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.csv,text/plain,text/csv"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {/* File Error Banner */}
      {fileError && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs sm:text-sm text-red-700 dark:text-red-300"
        >
          <XCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
          <span>{fileError}</span>
        </div>
      )}

      {/* CSV Structure Warning Banner */}
      {fileMeta?.csvWarning && (
        <div
          role="status"
          className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs sm:text-sm text-amber-800 dark:text-amber-300"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
          <span>{fileMeta.csvWarning}</span>
        </div>
      )}

      {/* Textarea Editor */}
      <div className="relative">
        <label htmlFor="pii-input-editor" className="sr-only">
          Raw Sensitive Text Editor
        </label>
        <textarea
          id="pii-input-editor"
          value={rawText}
          onChange={(e) => onTextChange(e.target.value)}
          rows={10}
          spellCheck={false}
          placeholder="Paste sensitive logs, customer records, emails, phone numbers, PAN, Aadhaar, IPv4 addresses, or credit card numbers here..."
          className="pg-scrollbar w-full rounded-xl border border-slate-300 dark:border-slate-700/90 bg-slate-50 dark:bg-slate-950/90 p-4 font-mono text-xs sm:text-sm leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-colors"
        />
      </div>

      {/* Metadata & Action Bar */}
      <div className="mt-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Live File & Text Metrics */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-950/70 px-2.5 py-1.5 text-slate-700 dark:text-slate-300">
            <span className="text-slate-400">File:</span>
            <strong className="font-semibold">
              {fileMeta ? fileMeta.name : 'Direct Text Input'}
            </strong>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-950/70 px-2.5 py-1.5 text-slate-700 dark:text-slate-300">
            <span className="text-slate-400">Size:</span>
            <strong className="font-mono font-semibold">{displaySize}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-950/70 px-2.5 py-1.5 text-slate-700 dark:text-slate-300">
            <span className="text-slate-400">Characters:</span>
            <strong className="font-mono font-semibold">{charCount.toLocaleString()}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-950/70 px-2.5 py-1.5 text-slate-700 dark:text-slate-300">
            <span className="text-slate-400">Words:</span>
            <strong className="font-mono font-semibold">{wordCount.toLocaleString()}</strong>
          </span>
          {hasScanned && isDirtySinceScan && (
            <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 font-medium text-amber-700 dark:text-amber-300">
              Text modified — re-scan recommended
            </span>
          )}
        </div>

        {/* Scan & Clear Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onReset}
            disabled={!rawText && !fileMeta && !hasScanned}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 className="h-4 w-4 text-slate-400" />
            <span>Clear Input</span>
          </button>

          <button
            type="button"
            onClick={onScan}
            disabled={!rawText.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 disabled:opacity-45 disabled:cursor-not-allowed transition-all"
          >
            <ScanSearch className="h-4 w-4" />
            <span>Scan for PII</span>
          </button>
        </div>
      </div>
    </section>
  );
};
