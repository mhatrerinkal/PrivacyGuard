import { AuditSummary, FileFormat } from '../types/pii';

/**
 * Formats byte sizes into human-readable labels.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Triggers a 100% client-side file download via the Browser Blob API
 * and revokes the generated Object URL immediately after triggering.
 */
export function downloadBlobFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const objectUrl = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Revoke object URL on next tick to ensure browser download starts cleanly
  setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 100);
}

/**
 * Generates an export filename preserving the input format (.txt or .csv).
 */
export function getSanitizedFilename(
  originalFilename: string | null,
  format: FileFormat
): string {
  if (format === 'csv') {
    if (originalFilename) {
      const base = originalFilename.replace(/\.csv$/i, '');
      return `sanitized_${base}.csv`;
    }
    return 'sanitized_data.csv';
  }

  if (originalFilename) {
    const base = originalFilename.replace(/\.txt$/i, '');
    return `sanitized_${base}.txt`;
  }
  return 'sanitized_document.txt';
}

/**
 * Downloads a sanitized output file (.txt or .csv).
 */
export function downloadSanitizedFile(
  sanitizedContent: string,
  format: FileFormat,
  originalFilename: string | null
): string {
  const exportName = getSanitizedFilename(originalFilename, format);
  const mimeType = format === 'csv' ? 'text/csv' : 'text/plain';
  downloadBlobFile(sanitizedContent, exportName, mimeType);
  return exportName;
}

/**
 * Downloads a privacy-safe audit report (JSON) containing zero raw sensitive values.
 */
export function downloadAuditReport(summary: AuditSummary): string {
  const safeReport = {
    application: 'PrivacyGuard',
    processingMode: '100% Client-Side Browser Processing',
    generatedAt: new Date().toISOString(),
    auditSummary: {
      scanTimestamp: summary.scanTimestamp,
      filename: summary.filename ?? 'Pasted Text Input',
      fileFormat: summary.fileFormat,
      status: summary.status,
      selectedRedactionMode: summary.selectedMode,
      totalEntitiesDetected: summary.totalDetected,
      entitiesSanitized: summary.entitiesSanitized,
      charactersMasked: summary.charactersMasked,
      categoryCounts: summary.detectionCounts,
    },
    privacyNotice:
      'No raw PII values or original-to-pseudonym mappings are included in this audit report.',
  };

  const filename = `privacyguard_audit_report_${new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/[:T]/g, '-')}.json`;
  downloadBlobFile(JSON.stringify(safeReport, null, 2), filename, 'application/json');
  return filename;
}
