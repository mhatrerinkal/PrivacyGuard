import React from 'react';
import { Download, FileUp, Lock, ScanLine } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    title: 'Upload or Paste',
    description:
      'Add your raw text or upload .txt and .csv files using drag-and-drop or the local editor.',
    icon: FileUp,
    accent: 'from-blue-500 to-indigo-500',
  },
  {
    step: '02',
    title: 'Detect & Classify',
    description:
      'Identify sensitive information using local pattern matching, IPv4 octet checks, and Luhn validation.',
    icon: ScanLine,
    accent: 'from-indigo-500 to-purple-500',
  },
  {
    step: '03',
    title: 'Sanitize & Export',
    description:
      'Select Full Mask, Partial Mask, or Consistent Pseudonymization and download your protected document.',
    icon: Download,
    accent: 'from-purple-500 to-emerald-500',
  },
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section
      id="how-it-works"
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/85 p-5 sm:p-8 shadow-xl shadow-slate-950/5 dark:shadow-slate-950/40 transition-colors"
    >
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300">
          How PrivacyGuard Works
        </span>
        <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Three Steps to Zero-Exposure Sanitization
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {STEPS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.step}
              className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 p-6 transition-all hover:border-indigo-500/40"
            >
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${item.accent} text-white shadow-lg shadow-indigo-500/20`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="font-mono text-2xl font-black text-slate-200 dark:text-slate-800">
                  {item.step}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {item.title}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-300">
        <Lock className="h-4 w-4 shrink-0" />
        <span>
          Your privacy is our priority. All processing happens directly inside your browser.
        </span>
      </div>
    </section>
  );
};
