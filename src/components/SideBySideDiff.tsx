import React, { useMemo, useRef, useState } from 'react';
import {
  Check,
  Columns2,
  Copy,
  Download,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { CATEGORY_META, PII_CATEGORIES } from '../engine/categories';
import {
  applyPartialMask,
  canonicalizeEntityKey,
} from '../engine/redactor';
import {
  DetectedEntity,
  FileFormat,
  PseudonymMappingEntry,
  RedactionMode,
} from '../types/pii';
import { getSanitizedFilename } from '../utils/fileExport';
import { HighlightedText } from './HighlightedText';

interface SideBySideDiffProps {
  rawText: string;
  sanitizedText: string;
  entities: DetectedEntity[];
  mode: RedactionMode;
  mappings: PseudonymMappingEntry[];
  fileFormat: FileFormat;
  filename: string | null;
  hasScanned: boolean;
  onDownload: () => void;
  onCopySuccess: () => void;
  onReset: () => void;
}

/**
 * Builds visual segments for the Right Panel so replacement tokens are highlighted
 * while preserving exact whitespace, line breaks, and CSV/text formatting.
 */
function buildSanitizedSegments(
  rawText: string,
  entities: DetectedEntity[],
  mode: RedactionMode,
  mappings: PseudonymMappingEntry[]
): Array<{ text: string; isReplacement: boolean; label?: string }> {
  if (!rawText || entities.length === 0) {
    return [{ text: rawText, isReplacement: false }];
  }

  const mapLookup = new Map<string, string>();
  for (const entry of mappings) {
    mapLookup.set(`${entry.category}::${entry.canonicalKey}`, entry.placeholder);
  }

  const sorted = [...entities].sort((a, b) => a.startIndex - b.startIndex);
  const segments: Array<{ text: string; isReplacement: boolean; label?: string }> = [];
  let cursor = 0;

  for (const entity of sorted) {
    if (entity.startIndex > cursor) {
      segments.push({
        text: rawText.slice(cursor, entity.startIndex),
        isReplacement: false,
      });
    }

    let replacement = '[REDACTED]';
    if (mode === 'partial_mask') {
      replacement = applyPartialMask(entity.value, entity.category);
    } else if (mode === 'pseudonymize') {
      const canonical = canonicalizeEntityKey(entity.value, entity.category);
      replacement =
        mapLookup.get(`${entity.category}::${canonical}`) ??
        `${CATEGORY_META[entity.category].pseudonymPrefix}_01`;
    }

    segments.push({
      text: replacement,
      isReplacement: true,
      label: CATEGORY_META[entity.category].shortLabel,
    });

    cursor = entity.endIndex;
  }

  if (cursor < rawText.length) {
    segments.push({
      text: rawText.slice(cursor),
      isReplacement: false,
    });
  }

  return segments;
}

export const SideBySideDiff: React.FC<SideBySideDiffProps> = ({
  rawText,
  sanitizedText,
  entities,
  mode,
  mappings,
  fileFormat,
  filename,
  hasScanned,
  onDownload,
  onCopySuccess,
  onReset,
}) => {
  const leftScrollRef = useRef<HTMLDivElement | null>(null);
  const rightScrollRef = useRef<HTMLDivElement | null>(null);
  const syncingSourceRef = useRef<'left' | 'right' | null>(null);
  const [copied, setCopied] = useState(false);

  const sanitizedSegments = useMemo(
    () => buildSanitizedSegments(rawText, entities, mode, mappings),
    [rawText, entities, mode, mappings]
  );

  const handleSyncScroll = (source: 'left' | 'right') => {
    if (syncingSourceRef.current && syncingSourceRef.current !== source) {
      return;
    }

    const fromEl = source === 'left' ? leftScrollRef.current : rightScrollRef.current;
    const toEl = source === 'left' ? rightScrollRef.current : leftScrollRef.current;

    if (!fromEl || !toEl) {
      return;
    }

    syncingSourceRef.current = source;
    toEl.scrollTop = fromEl.scrollTop;

    requestAnimationFrame(() => {
      syncingSourceRef.current = null;
    });
  };

  const handleCopy = async () => {
    if (!sanitizedText) return;
    try {
      await navigator.clipboard.writeText(sanitizedText);
      setCopied(true);
      onCopySuccess();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for restricted clipboard environments
      const textarea = document.createElement('textarea');
      textarea.value = sanitizedText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      onCopySuccess();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const exportFilename = getSanitizedFilename(filename, fileFormat);

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/85 p-5 sm:p-6 shadow-xl shadow-slate-950/5 dark:shadow-slate-950/40 transition-colors">
      {/* Header & Export Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Columns2 className="h-5 w-5 text-indigo-500" />
            <span>Live Side-by-Side Diff View</span>
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Synchronized inspection comparing highlighted PII on the left against sanitized output on the right
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!hasScanned || !sanitizedText}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy Sanitized Text</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onReset}
            disabled={!rawText && !hasScanned}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={onDownload}
            disabled={!hasScanned || !sanitizedText}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-45 disabled:cursor-not-allowed transition-all"
          >
            <Download className="h-4 w-4" />
            <span>Download Sanitized File ({fileFormat === 'csv' ? '.csv' : '.txt'})</span>
          </button>
        </div>
      </div>

      {/* Category Color Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 px-3.5 py-2.5 text-[11px]">
        <span className="font-semibold text-slate-500 dark:text-slate-400 mr-1">
          Highlight Legend:
        </span>
        {PII_CATEGORIES.map((category) => {
          const meta = CATEGORY_META[category];
          return (
            <span
              key={category}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-medium ${meta.badgeClass}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} />
              {meta.shortLabel}
            </span>
          );
        })}
      </div>

      {/* Dual Synchronized Panels with Vertical Divider */}
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1px_1fr]">
          {/* LEFT PANEL: ORIGINAL TEXT */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/90 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Original Text (Detected PII)
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {entities.length} highlighted
              </span>
            </div>

            <div
              ref={leftScrollRef}
              onScroll={() => handleSyncScroll('left')}
              className="pg-scrollbar h-80 sm:h-96 overflow-auto p-4 font-mono text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words"
            >
              <HighlightedText text={rawText} entities={entities} />
            </div>
          </div>

          {/* CLEAR VERTICAL DIVIDER */}
          <div
            className="hidden lg:block bg-gradient-to-b from-blue-500/30 via-indigo-500/40 to-purple-500/30"
            aria-hidden="true"
          />
          <div
            className="block lg:hidden h-px bg-slate-200 dark:bg-slate-800"
            aria-hidden="true"
          />

          {/* RIGHT PANEL: SANITIZED TEXT */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/90 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Sanitized Output
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 truncate max-w-[180px]">
                {exportFilename}
              </span>
            </div>

            <div
              ref={rightScrollRef}
              onScroll={() => handleSyncScroll('right')}
              className="pg-scrollbar h-80 sm:h-96 overflow-auto p-4 font-mono text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words"
            >
              {!rawText ? (
                <span className="text-slate-400 dark:text-slate-500 italic">
                  Sanitized output will appear here after scanning your input.
                </span>
              ) : !hasScanned ? (
                <span className="text-slate-400 dark:text-slate-500 italic">
                  Click &ldquo;Scan for PII&rdquo; to generate sanitized output.
                </span>
              ) : (
                sanitizedSegments.map((seg, index) =>
                  seg.isReplacement ? (
                    <span
                      key={`rep-${index}`}
                      title={`Sanitized ${seg.label ?? 'Entity'}`}
                      className="inline rounded bg-emerald-500/20 px-1 py-0.5 font-bold text-emerald-700 dark:text-emerald-300 border-b-2 border-emerald-400/70"
                    >
                      {seg.text}
                    </span>
                  ) : (
                    <React.Fragment key={`plain-${index}`}>{seg.text}</React.Fragment>
                  )
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
