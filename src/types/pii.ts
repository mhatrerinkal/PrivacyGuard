export type PiiCategory =
  | 'email'
  | 'phone'
  | 'ip'
  | 'pan'
  | 'aadhaar'
  | 'credit_card';

export type RedactionMode = 'full_mask' | 'partial_mask' | 'pseudonymize';

export type FileFormat = 'text' | 'csv';

export type SanitizationStatus =
  | 'Not Scanned'
  | 'PII Detected'
  | 'Sanitized'
  | 'Ready to Export'
  | 'No PII Found';

export interface DetectedEntity {
  /** Unique identifier for UI keys */
  id: string;
  /** Original matched substring */
  value: string;
  /** Classified PII category */
  category: PiiCategory;
  /** Inclusive 0-based start character index in the source text */
  startIndex: number;
  /** Exclusive 0-based end character index in the source text */
  endIndex: number;
  /** Human-readable validation outcome (e.g., "Luhn Check Passed", "Valid IPv4 Octets") */
  validationStatus: string;
}

export type CategoryCounts = Record<PiiCategory, number>;

export interface ScanResult {
  entities: DetectedEntity[];
  counts: CategoryCounts;
  totalEntities: number;
  scannedAt: string;
}

export interface PseudonymMappingEntry {
  category: PiiCategory;
  placeholder: string;
  /** Canonical normalized key (kept in memory only for authorized local preview) */
  canonicalKey: string;
  /** Display-safe masked preview or original value for local-only authorized review */
  originalValue: string;
  occurrences: number;
}

export interface RedactionResult {
  sanitizedText: string;
  charactersMasked: number;
  entitiesSanitized: number;
  mappings: PseudonymMappingEntry[];
}

export interface UploadedFileMeta {
  name: string;
  sizeBytes: number;
  format: FileFormat;
  csvWarning?: string;
}

export interface AuditSummary {
  scanTimestamp: string | null;
  filename: string | null;
  fileFormat: FileFormat;
  detectionCounts: CategoryCounts;
  totalDetected: number;
  selectedMode: RedactionMode;
  entitiesSanitized: number;
  charactersMasked: number;
  status: SanitizationStatus;
}

export type ActivityEventType =
  | 'INIT'
  | 'SAMPLE_LOADED'
  | 'FILE_UPLOADED'
  | 'SCAN_STARTED'
  | 'DETECTION'
  | 'VALIDATION'
  | 'MODE_CHANGED'
  | 'SANITIZED'
  | 'COPIED'
  | 'DOWNLOADED'
  | 'RESET'
  | 'ERROR';

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  eventType: ActivityEventType;
  message: string;
  status: 'info' | 'success' | 'warning' | 'error';
}

export interface CategoryMeta {
  key: PiiCategory;
  label: string;
  shortLabel: string;
  pseudonymPrefix: string;
  description: string;
  /** Tailwind color tokens for badges and highlights */
  badgeClass: string;
  highlightClass: string;
  borderClass: string;
  dotClass: string;
}
