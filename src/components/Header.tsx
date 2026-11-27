import React from 'react';
import { Lock, Moon, Shield, Sun } from 'lucide-react';

interface HeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isDark, onToggleTheme }) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Brand */}
        <a href="#top" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <Shield className="h-5 w-5 text-white transition-transform group-hover:scale-105" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                PrivacyGuard
              </span>
              <span className="hidden sm:inline-flex rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-300 ring-1 ring-indigo-500/25">
                v1.0
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Detect. Protect. Sanitize.
            </p>
          </div>
        </a>

        {/* Navigation */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/70 p-1"
        >
          <a
            href="#dashboard"
            className="rounded-full px-4 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
          >
            Dashboard
          </a>
          <a
            href="#how-it-works"
            className="rounded-full px-4 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
          >
            How It Works
          </a>
          <a
            href="#audit-log"
            className="rounded-full px-4 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
          >
            Audit Log
          </a>
        </nav>

        {/* Status & Controls */}
        <div className="flex items-center gap-2.5">
          <div
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
            title="All detection, validation, and sanitization occurs offline in browser memory"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <Lock className="h-3.5 w-3.5" />
            <span>Local Processing Active</span>
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-indigo-500/40 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="flex md:hidden items-center justify-center gap-2 border-t border-slate-200/70 dark:border-slate-800/70 px-4 py-2 text-xs font-medium">
        <a
          href="#dashboard"
          className="rounded-lg px-3 py-1 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Dashboard
        </a>
        <a
          href="#how-it-works"
          className="rounded-lg px-3 py-1 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          How It Works
        </a>
        <a
          href="#audit-log"
          className="rounded-lg px-3 py-1 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Audit Log
        </a>
      </div>
    </header>
  );
};
