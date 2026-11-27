import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  KeyRound,
  Layers,
  Lock,
  Shield,
  SlidersHorizontal,
} from 'lucide-react';
import { CATEGORY_META } from '../engine/categories';
import { PseudonymMappingEntry, RedactionMode } from '../types/pii';

interface RedactionControlsProps {
  selectedMode: RedactionMode;
  onModeChange: (mode: RedactionMode) => void;
  mappings: PseudonymMappingEntry[];
}

interface ModeOption {
  id: RedactionMode;
  title: string;
  badge: string;
  description: string;
  example: string;
  icon: React.FC<{ className?: string }>;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    id: 'full_mask',
    title: 'Mode 1: Full Mask',
    badge: '[REDACTED]',
    description:
      'Completely replaces every detected sensitive value with a uniform [REDACTED] token.',
    example: 'john@gmail.com → [REDACTED]',
    icon: Shield,
  },
  {
    id: 'partial_mask',
    title: 'Mode 2: Partial Mask',
    badge: 'Context Preserved',
    description:
      'Obscures sensitive characters while retaining domain or last 4 digits for verification.',
    example: '4532015112830366 → XXXX XXXX XXXX 0366',
    icon: Layers,
  },
  {
    id: 'pseudonymize',
    title: 'Mode 3: Consistent Pseudonymization',
    badge: 'Session Consistent',
    description:
      'Maps recurring values to deterministic category placeholders (USER_01, PHONE_01, CARD_01).',
    example: 'john.doe@gmail.com (×2) → USER_01',
    icon: KeyRound,
  },
];

export const RedactionControls: React.FC<RedactionControlsProps> = ({
  selectedMode,
  onModeChange,
  mappings,
}) => {
  const [showMappingPreview, setShowMappingPreview] = useState(false);

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/85 p-5 sm:p-6 shadow-xl shadow-slate-950/5 dark:shadow-slate-950/40 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-blue-500" />
            <span>Redaction Strategy</span>
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Switch redaction modes instantaneously without altering the original text
          </p>
        </div>
      </div>

      <div
        role="radiogroup"
        aria-label="Redaction Strategy Mode"
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        {MODE_OPTIONS.map((option) => {
          const isSelected = selectedMode === option.id;
          const Icon = option.icon;

          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onModeChange(option.id)}
              className={`text-left rounded-xl border p-4 transition-all ${
                isSelected
                  ? 'border-indigo-500 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 ring-2 ring-indigo-500/25 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 hover:border-indigo-500/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {option.title}
                  </span>
                </div>
                <span
                  className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                    isSelected
                      ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/35'
                      : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {option.badge}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                {option.description}
              </p>

              <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/90 px-2.5 py-1.5 font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate">
                {option.example}
              </div>
            </button>
          );
        })}
      </div>

      {/* Optional Authorized Local Mapping Preview for Consistent Pseudonymization */}
      {selectedMode === 'pseudonymize' && (
        <div className="mt-5 rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Lock className="h-4 w-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Authorized Local Mapping Preview (Session Memory Only)
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Never included in exported sanitized files or audit reports. Resets on document clear.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowMappingPreview((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
            >
              {showMappingPreview ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" />
                  <span>Hide Mapping</span>
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  <span>Show Mapping ({mappings.length})</span>
                </>
              )}
            </button>
          </div>

          {showMappingPreview && (
            <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
              {mappings.length === 0 ? (
                <p className="p-3 text-xs text-slate-500 dark:text-slate-400">
                  Scan text containing PII to inspect consistent session pseudonym mappings.
                </p>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Category</th>
                      <th className="px-3 py-2 font-semibold">Placeholder</th>
                      <th className="px-3 py-2 font-semibold">Original Value (Local Only)</th>
                      <th className="px-3 py-2 font-semibold text-right">Occurrences</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
                    {mappings.map((entry) => {
                      const meta = CATEGORY_META[entry.category];
                      return (
                        <tr key={`${entry.category}-${entry.placeholder}`}>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium ${meta.badgeClass}`}
                            >
                              {meta.shortLabel}
                            </span>
                          </td>
                          <td className="px-3 py-2 font-mono font-bold text-indigo-600 dark:text-indigo-300">
                            {entry.placeholder}
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300">
                            {entry.originalValue}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {entry.occurrences}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
