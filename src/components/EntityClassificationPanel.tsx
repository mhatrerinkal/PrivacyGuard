import React from 'react';
import {
  CreditCard,
  Fingerprint,
  Globe,
  IdCard,
  Mail,
  Phone,
  ShieldAlert,
} from 'lucide-react';
import { CATEGORY_META, PII_CATEGORIES } from '../engine/categories';
import { CategoryCounts, PiiCategory } from '../types/pii';

interface EntityClassificationPanelProps {
  counts: CategoryCounts;
  totalEntities: number;
  hasScanned: boolean;
}

const CATEGORY_ICONS: Record<PiiCategory, React.FC<{ className?: string }>> = {
  email: Mail,
  phone: Phone,
  ip: Globe,
  pan: IdCard,
  aadhaar: Fingerprint,
  credit_card: CreditCard,
};

export const EntityClassificationPanel: React.FC<EntityClassificationPanelProps> = ({
  counts,
  totalEntities,
  hasScanned,
}) => {
  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/85 p-5 sm:p-6 shadow-xl shadow-slate-950/5 dark:shadow-slate-950/40 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-purple-500" />
            <span>Entity Classification</span>
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Color-coded breakdown of detected and validated sensitive entities
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Total Detected:
          </span>
          <span className="text-lg font-extrabold font-mono text-indigo-600 dark:text-indigo-300">
            {totalEntities}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {PII_CATEGORIES.map((category) => {
          const meta = CATEGORY_META[category];
          const Icon = CATEGORY_ICONS[category];
          const count = counts[category];

          return (
            <div
              key={category}
              className={`rounded-xl border p-4 transition-all ${
                count > 0
                  ? `${meta.borderClass} bg-slate-50/90 dark:bg-slate-950/70 shadow-sm`
                  : 'border-slate-200/80 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-950/40 opacity-80'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border ${meta.badgeClass}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${meta.dotClass}`} />
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {meta.shortLabel}
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                      {meta.description}
                    </p>
                  </div>
                </div>

                <span
                  className={`min-w-[2.25rem] text-center rounded-lg border px-2.5 py-1 font-mono text-sm font-bold ${
                    count > 0
                      ? meta.badgeClass
                      : 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {hasScanned ? count : 0}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
