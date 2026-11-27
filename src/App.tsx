import { useCallback, useEffect, useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { ActivityLogPanel } from './components/ActivityLogPanel';
import { AuditDashboard } from './components/AuditDashboard';
import { EntityClassificationPanel } from './components/EntityClassificationPanel';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { InputSection } from './components/InputSection';
import { RedactionControls } from './components/RedactionControls';
import { SideBySideDiff } from './components/SideBySideDiff';
import { CATEGORY_META, createEmptyCounts, PII_CATEGORIES } from './engine/categories';
import { detectPii } from './engine/detector';
import { createPseudonymSession, redactText } from './engine/redactor';
import { SAMPLE_CSV_TEXT, SAMPLE_NOISY_TEXT } from './engine/sampleData';
import {
  ActivityEventType,
  ActivityLogEntry,
  AuditSummary,
  FileFormat,
  RedactionMode,
  SanitizationStatus,
  ScanResult,
  UploadedFileMeta,
} from './types/pii';
import { parseCsv, sanitizeCsvStructure } from './utils/csvHandler';
import { downloadAuditReport, downloadSanitizedFile } from './utils/fileExport';

function formatReadableTime(date: Date = new Date()): string {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

let logCounter = 0;
function createLogEntry(
  eventType: ActivityEventType,
  message: string,
  status: ActivityLogEntry['status'] = 'info'
): ActivityLogEntry {
  logCounter += 1;
  return {
    id: `log-${Date.now()}-${logCounter}`,
    timestamp: formatReadableTime(),
    eventType,
    message,
    status,
  };
}

const MODE_DISPLAY_NAMES: Record<RedactionMode, string> = {
  full_mask: 'Full Mask',
  partial_mask: 'Partial Mask',
  pseudonymize: 'Consistent Pseudonymization',
};

export function App() {
  const [isDark, setIsDark] = useState(true);
  const [rawText, setRawText] = useState('');
  const [scannedText, setScannedText] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [redactionMode, setRedactionMode] = useState<RedactionMode>('pseudonymize');
  const [fileMeta, setFileMeta] = useState<UploadedFileMeta | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDirtySinceScan, setIsDirtySinceScan] = useState(false);
  const [hasExported, setHasExported] = useState(false);

  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>(() => [
    createLogEntry(
      'INIT',
      'Application initialized. 100% client-side local processing active.',
      'success'
    ),
  ]);

  // Apply dark/light class without storing preferences in localStorage/cookies
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  const appendLogs = useCallback((entries: ActivityLogEntry[]) => {
    setActivityLogs((prev) => [...entries, ...prev].slice(0, 150));
  }, []);

  const executeScan = useCallback(
    (targetText: string) => {
      if (!targetText.trim()) {
        setScanResult(null);
        setScannedText('');
        setIsDirtySinceScan(false);
        setHasExported(false);
        appendLogs([
          createLogEntry('ERROR', 'Scan skipped: input text is empty.', 'warning'),
        ]);
        return;
      }

      const startTime = performance.now();
      const result = detectPii(targetText);
      const elapsedMs = (performance.now() - startTime).toFixed(1);

      setScannedText(targetText);
      setScanResult(result);
      setIsDirtySinceScan(false);
      setHasExported(false);

      const newEntries: ActivityLogEntry[] = [
        createLogEntry(
          'SCAN_STARTED',
          `PII scan started across ${targetText.length.toLocaleString()} characters.`,
          'info'
        ),
      ];

      for (const category of PII_CATEGORIES) {
        const count = result.counts[category];
        if (count > 0) {
          const label = CATEGORY_META[category].shortLabel;
          newEntries.push(
            createLogEntry(
              'DETECTION',
              `${label} detected: ${count} ${count === 1 ? 'entity' : 'entities'} classified.`,
              'info'
            )
          );
        }
      }

      if (result.counts.credit_card > 0) {
        newEntries.push(
          createLogEntry(
            'VALIDATION',
            `Credit card validation passed using local Luhn checksum (${result.counts.credit_card} verified).`,
            'success'
          )
        );
      }

      newEntries.push(
        createLogEntry(
          'SANITIZED',
          `Sanitization completed in ${elapsedMs}ms (${result.totalEntities} total entities processed using ${MODE_DISPLAY_NAMES[redactionMode]}).`,
          result.totalEntities > 0 ? 'success' : 'info'
        )
      );

      appendLogs(newEntries.reverse());
    },
    [appendLogs, redactionMode]
  );

  // Pure memoized redaction derived from scannedText, scanResult, and selected redactionMode
  const redactionResult = useMemo(() => {
    if (!scanResult || !scannedText) {
      return {
        sanitizedText: '',
        charactersMasked: 0,
        entitiesSanitized: 0,
        mappings: [],
      };
    }
    const freshSession = createPseudonymSession();
    return redactText(scannedText, scanResult.entities, redactionMode, freshSession);
  }, [scannedText, scanResult, redactionMode]);

  const handleTextChange = (nextText: string) => {
    setRawText(nextText);
    setFileError(null);
    if (scanResult) {
      setIsDirtySinceScan(true);
    }
    if (!nextText) {
      setFileMeta(null);
      setScanResult(null);
      setScannedText('');
      setIsDirtySinceScan(false);
      setHasExported(false);
    }
  };

  const handleFileUpload = (file: File) => {
    setFileError(null);
    const lowerName = file.name.toLowerCase();
    const isTxt = lowerName.endsWith('.txt');
    const isCsv = lowerName.endsWith('.csv');

    if (!isTxt && !isCsv) {
      const msg = `Unsupported file format "${file.name}". Please upload only .txt or .csv files.`;
      setFileError(msg);
      appendLogs([createLogEntry('ERROR', msg, 'error')]);
      return;
    }

    const format: FileFormat = isCsv ? 'csv' : 'text';
    const reader = new FileReader();

    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      if (!content.trim()) {
        const emptyMsg = `Uploaded file "${file.name}" is empty.`;
        setFileError(emptyMsg);
        appendLogs([createLogEntry('ERROR', emptyMsg, 'warning')]);
        return;
      }

      let csvWarning: string | undefined;
      if (format === 'csv') {
        const parsed = parseCsv(content);
        csvWarning = parsed.warning;
      }

      setRawText(content);
      setFileMeta({
        name: file.name,
        sizeBytes: file.size,
        format,
        csvWarning,
      });

      appendLogs([
        createLogEntry(
          'FILE_UPLOADED',
          `Local file loaded: "${file.name}" (${format.toUpperCase()}, ${file.size.toLocaleString()} bytes).`,
          'success'
        ),
      ]);

      executeScan(content);
    };

    reader.onerror = () => {
      const readErr = `Failed to read local file "${file.name}".`;
      setFileError(readErr);
      appendLogs([createLogEntry('ERROR', readErr, 'error')]);
    };

    reader.readAsText(file);
  };

  const handleLoadSampleText = () => {
    setFileError(null);
    setFileMeta(null);
    setRawText(SAMPLE_NOISY_TEXT);
    appendLogs([
      createLogEntry(
        'SAMPLE_LOADED',
        'Sample noisy text loaded into local editor.',
        'info'
      ),
    ]);
    executeScan(SAMPLE_NOISY_TEXT);
  };

  const handleLoadSampleCsv = () => {
    setFileError(null);
    const parsed = parseCsv(SAMPLE_CSV_TEXT);
    setFileMeta({
      name: 'sample_customers.csv',
      sizeBytes: new Blob([SAMPLE_CSV_TEXT]).size,
      format: 'csv',
      csvWarning: parsed.warning,
    });
    setRawText(SAMPLE_CSV_TEXT);
    appendLogs([
      createLogEntry(
        'SAMPLE_LOADED',
        `Sample CSV dataset loaded (${parsed.rowCount} rows, ${parsed.columnCount} columns).`,
        'info'
      ),
    ]);
    executeScan(SAMPLE_CSV_TEXT);
  };

  const handleModeChange = (nextMode: RedactionMode) => {
    if (nextMode === redactionMode) return;
    setRedactionMode(nextMode);
    setHasExported(false);
    appendLogs([
      createLogEntry(
        'MODE_CHANGED',
        `Redaction mode changed to ${MODE_DISPLAY_NAMES[nextMode]}.`,
        'info'
      ),
    ]);
  };

  const handleReset = () => {
    setRawText('');
    setScannedText('');
    setScanResult(null);
    setFileMeta(null);
    setFileError(null);
    setIsDirtySinceScan(false);
    setHasExported(false);
    appendLogs([
      createLogEntry(
        'RESET',
        'Document cleared. Scan results and pseudonym session mappings reset.',
        'info'
      ),
    ]);
  };

  const handleDownloadSanitized = () => {
    if (!scanResult || !redactionResult.sanitizedText) return;

    const format: FileFormat = fileMeta?.format ?? 'text';
    const contentToExport =
      format === 'csv'
        ? sanitizeCsvStructure(redactionResult.sanitizedText)
        : redactionResult.sanitizedText;

    const downloadedName = downloadSanitizedFile(
      contentToExport,
      format,
      fileMeta?.name ?? null
    );
    setHasExported(true);

    appendLogs([
      createLogEntry(
        'DOWNLOADED',
        `Sanitized file downloaded locally as "${downloadedName}" (${format.toUpperCase()}).`,
        'success'
      ),
    ]);
  };

  const handleCopySuccess = () => {
    setHasExported(true);
    appendLogs([
      createLogEntry(
        'COPIED',
        `Sanitized output copied to clipboard (${MODE_DISPLAY_NAMES[redactionMode]}).`,
        'success'
      ),
    ]);
  };

  const activeFormat: FileFormat = fileMeta?.format ?? 'text';

  const sanitizationStatus: SanitizationStatus = useMemo(() => {
    if (!scanResult) return 'Not Scanned';
    if (isDirtySinceScan) return 'PII Detected';
    if (scanResult.totalEntities === 0) return 'No PII Found';
    if (hasExported) return 'Sanitized';
    return 'Ready to Export';
  }, [scanResult, isDirtySinceScan, hasExported]);

  const auditSummary: AuditSummary = useMemo(
    () => ({
      scanTimestamp: scanResult?.scannedAt ?? null,
      filename: fileMeta?.name ?? null,
      fileFormat: activeFormat,
      detectionCounts: scanResult?.counts ?? createEmptyCounts(),
      totalDetected: scanResult?.totalEntities ?? 0,
      selectedMode: redactionMode,
      entitiesSanitized: redactionResult.entitiesSanitized,
      charactersMasked: redactionResult.charactersMasked,
      status: sanitizationStatus,
    }),
    [
      scanResult,
      fileMeta,
      activeFormat,
      redactionMode,
      redactionResult.entitiesSanitized,
      redactionResult.charactersMasked,
      sanitizationStatus,
    ]
  );

  const handleDownloadAuditReport = () => {
    if (!auditSummary.scanTimestamp) return;
    const reportName = downloadAuditReport(auditSummary);
    appendLogs([
      createLogEntry(
        'DOWNLOADED',
        `Privacy-safe audit report exported as "${reportName}".`,
        'success'
      ),
    ]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Header isDark={isDark} onToggleTheme={() => setIsDark((prev) => !prev)} />

      <HeroSection />

      <main id="dashboard" className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-7">
        {/* 1. Input & File Upload */}
        <InputSection
          rawText={rawText}
          fileMeta={fileMeta}
          fileError={fileError}
          isDirtySinceScan={isDirtySinceScan}
          hasScanned={Boolean(scanResult)}
          onTextChange={handleTextChange}
          onFileUpload={handleFileUpload}
          onScan={() => executeScan(rawText)}
          onLoadSampleText={handleLoadSampleText}
          onLoadSampleCsv={handleLoadSampleCsv}
          onReset={handleReset}
        />

        {/* 2. Entity Classification Panel */}
        <EntityClassificationPanel
          counts={scanResult?.counts ?? createEmptyCounts()}
          totalEntities={scanResult?.totalEntities ?? 0}
          hasScanned={Boolean(scanResult)}
        />

        {/* 3. Three Redaction Modes + Authorized Local Mapping Preview */}
        <RedactionControls
          selectedMode={redactionMode}
          onModeChange={handleModeChange}
          mappings={redactionResult.mappings}
        />

        {/* 4. Live Side-by-Side Diff View + Export */}
        <SideBySideDiff
          rawText={scannedText || rawText}
          sanitizedText={redactionResult.sanitizedText}
          entities={!isDirtySinceScan && scanResult ? scanResult.entities : []}
          mode={redactionMode}
          mappings={redactionResult.mappings}
          fileFormat={activeFormat}
          filename={fileMeta?.name ?? null}
          hasScanned={Boolean(scanResult) && !isDirtySinceScan}
          onDownload={handleDownloadSanitized}
          onCopySuccess={handleCopySuccess}
          onReset={handleReset}
        />

        {/* 5. Audit & Analytics Dashboard */}
        <AuditDashboard
          summary={auditSummary}
          onDownloadAuditReport={handleDownloadAuditReport}
        />

        {/* 6. Sanitization Activity Log & System Rules */}
        <ActivityLogPanel
          logs={activityLogs}
          onClearLogs={() => setActivityLogs([])}
        />

        {/* 7. How It Works */}
        <HowItWorksSection />
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/90 py-6 mt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>PrivacyGuard — Detect. Protect. Sanitize.</span>
          </div>
          <p>
            100% Client-Side Processing – Your Data Never Leaves This Browser. Zero external APIs or storage.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
