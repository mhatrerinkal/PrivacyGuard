import React, { useState } from 'react';
import {
  CheckCircle2,
  Cpu,
  History,
  Info,
  ShieldAlert,
  Terminal,
  Trash2,
  XCircle,
} from 'lucide-react';
import { ActivityLogEntry } from '../types/pii';

interface ActivityLogPanelProps {
  logs: ActivityLogEntry[];
  onClearLogs: () => void;
}

const SYSTEM_RULES = [
  {
    name: 'Email Detection Rule',
    spec: 'RFC-style local@domain.tld RegExp excluding trailing punctuation (.,;!?).',
    strategy: 'Full: [REDACTED] | Partial: j***@domain | Pseudo: USER_01+',
  },
  {
    name: 'Phone Number Rule',
    spec: 'Indian (+91 / [6-9]xxxxxxxxx) & International (+1 / E.164), 10–15 digits, rejects repeating/short sequences.',
    strategy: 'Full: [REDACTED] | Partial: last 4 digits kept | Pseudo: PHONE_01+',
  },
  {
    name: 'IPv4 Validation Rule',
    spec: '4 dotted octets verified strictly within [0, 255] without invalid leading zeros (rejects 999.999.999.999).',
    strategy: 'Full: [REDACTED] | Partial: XXX.XXX.XXX.<last> | Pseudo: IP_01+',
  },
  {
    name: 'Indian PAN Rule',
    spec: 'Standard 10-character PAN pattern: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F).',
    strategy: 'Full: [REDACTED] | Partial: XXXXX1234F | Pseudo: PAN_01+',
  },
  {
    name: 'Aadhaar-Style Pattern Rule',
    spec: '12-digit identifier (space, hyphen, or unseparated), rejects all-same or 0-prefixed dummy strings; no official UIDAI claim.',
    strategy: 'Full: [REDACTED] | Partial: XXXX XXXX 9012 | Pseudo: AADHAAR_01+',
  },
  {
    name: 'Credit Card + Luhn Rule',
    spec: '13–19 digits passing custom Mod-10 Luhn checksum (rejects 1234567890123456 and all-identical digits).',
    strategy: 'Full: [REDACTED] | Partial: XXXX XXXX XXXX 0366 | Pseudo: CARD_01+',
  },
  {
    name: 'Overlap & Offset Safety',
    spec: 'Deterministic span priority resolution (Card > Aadhaar > Email > PAN > IP > Phone) applied right-to-left.',
    strategy: 'Preserves original whitespace, newlines, and CSV delimiters/quoting.',
  },
];

function StatusIcon({ status }: { status: ActivityLogEntry['status'] }) {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
    case 'warning':
      return <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500 shrink-0" />;
    default:
      return <Info className="h-4 w-4 text-blue-500 shrink-0" />;
  }
}

export const ActivityLogPanel: React.FC<ActivityLogPanelProps> = ({
  logs,
  onClearLogs,
}) => {
  const [activeTab, setActiveTab] = useState<'activity' | 'rules'>('activity');

  return (
    <section
      id="audit-log"
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/85 p-5 sm:p-6 shadow-xl shadow-slate-950/5 dark:shadow-slate-950/40 transition-colors"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="h-5 w-5 text-purple-500" />
            <span>Sanitization Activity Log</span>
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            In-memory chronological telemetry (zero sensitive values ever recorded)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-950 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('activity')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
                activeTab === 'activity'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Activity Log ({logs.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
                activeTab === 'rules'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Cpu className="h-3.5 w-3.5" />
              <span>Prompt &amp; System Log</span>
            </button>
          </div>

          {activeTab === 'activity' && (
            <button
              type="button"
              onClick={onClearLogs}
              disabled={logs.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Activity Log</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'activity' ? (
        <div className="pg-scrollbar max-h-72 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/90 divide-y divide-slate-200/70 dark:divide-slate-800/70">
          {logs.length === 0 ? (
            <p className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
              Activity log cleared. Subsequent scans, mode switches, and downloads will appear here in browser memory.
            </p>
          ) : (
            logs.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 px-4 py-2.5 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <StatusIcon status={entry.status} />
                  <span className="shrink-0 rounded bg-slate-200/80 dark:bg-slate-800 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300">
                    {entry.eventType}
                  </span>
                  <span className="text-slate-700 dark:text-slate-200 truncate">
                    {entry.message}
                  </span>
                </div>
                <span className="shrink-0 font-mono text-[11px] text-slate-400 dark:text-slate-500">
                  {entry.timestamp}
                </span>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/90 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-300">
              Deterministic Local Rules Engine Specification
            </span>
            <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              No External LLM / No Cloud Calls
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SYSTEM_RULES.map((rule) => (
              <div
                key={rule.name}
                className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3"
              >
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  {rule.name}
                </h3>
                <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {rule.spec}
                </p>
                <p className="mt-1.5 font-mono text-[10px] text-indigo-600 dark:text-indigo-300">
                  {rule.strategy}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
