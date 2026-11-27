import React from 'react';
import { CheckCircle2, Cpu, ShieldCheck, WifiOff } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section
      id="top"
      className="relative overflow-hidden border-b border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-[#0b1224] dark:to-slate-950"
    >
      <div className="cyber-grid-bg absolute inset-0 pointer-events-none opacity-80" />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        {/* Mandatory visible privacy indicator */}
        <div className="mb-6 flex justify-center lg:justify-start">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300 shadow-sm">
            <ShieldCheck className="h-4 w-4 shrink-0 text-blue-500 dark:text-blue-400" />
            <span>
              100% Client-Side Processing – Your Data Never Leaves This Browser.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          {/* Copy */}
          <div className="lg:col-span-8 text-center lg:text-left">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
              Intelligent client-side PII detection and data sanitization
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
              Your Sensitive Data Deserves{' '}
              <span className="bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
                Protection
              </span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto lg:mx-0 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Instantly detect, classify, and sanitize sensitive information
              without sending your data anywhere.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 px-3 py-1.5">
                <WifiOff className="h-4 w-4 text-emerald-500" />
                <span>Zero Network Transmission</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 px-3 py-1.5">
                <Cpu className="h-4 w-4 text-blue-500" />
                <span>In-Memory RegExp &amp; Luhn Engine</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 px-3 py-1.5">
                <CheckCircle2 className="h-4 w-4 text-purple-500" />
                <span>No Cookies or LocalStorage</span>
              </div>
            </div>
          </div>

          {/* Prominent Privacy Shield Illustration */}
          <div className="lg:col-span-4 flex justify-center">
            <div className="relative flex items-center justify-center">
              <div className="absolute h-52 w-52 rounded-full bg-gradient-to-tr from-blue-600/25 via-indigo-500/25 to-purple-600/25 blur-2xl" />
              <div className="relative rounded-2xl border border-slate-200/80 dark:border-indigo-500/25 bg-white/90 dark:bg-slate-900/80 p-6 shadow-2xl shadow-indigo-950/30 backdrop-blur">
                <svg
                  viewBox="0 0 180 180"
                  className="h-36 w-36 sm:h-40 sm:w-40"
                  role="img"
                  aria-label="PrivacyGuard Local Cybersecurity Shield Illustration"
                >
                  <defs>
                    <linearGradient id="pgShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="50%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                    <linearGradient id="pgShieldInner" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#1e293b" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                  </defs>
                  {/* Orbiting rings */}
                  <circle
                    cx="90"
                    cy="90"
                    r="78"
                    fill="none"
                    stroke="url(#pgShieldGrad)"
                    strokeWidth="1.2"
                    strokeDasharray="6 6"
                    opacity="0.45"
                  />
                  <circle
                    cx="90"
                    cy="90"
                    r="64"
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="1"
                    opacity="0.25"
                  />
                  {/* Shield body */}
                  <path
                    d="M90 22 L144 44 V88 C144 124 120 148 90 160 C60 148 36 124 36 88 V44 Z"
                    fill="url(#pgShieldInner)"
                    stroke="url(#pgShieldGrad)"
                    strokeWidth="3.5"
                    strokeLinejoin="round"
                  />
                  {/* Inner shield highlight */}
                  <path
                    d="M90 32 L134 50 V87 C134 117 114 137 90 148 C66 137 46 117 46 87 V50 Z"
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth="1"
                    opacity="0.35"
                  />
                  {/* Lock body */}
                  <rect
                    x="69"
                    y="84"
                    width="42"
                    height="33"
                    rx="7"
                    fill="url(#pgShieldGrad)"
                  />
                  {/* Lock shackle */}
                  <path
                    d="M77 84 V71 C77 63.8 82.8 58 90 58 C97.2 58 103 63.8 103 71 V84"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                  />
                  {/* Keyhole */}
                  <circle cx="90" cy="98" r="4" fill="#0f172a" />
                  <path d="M88.5 101 L91.5 101 L92.5 109 L87.5 109 Z" fill="#0f172a" />
                  {/* Corner telemetry dots */}
                  <circle cx="24" cy="48" r="3" fill="#38bdf8" opacity="0.8" />
                  <circle cx="156" cy="48" r="3" fill="#a855f7" opacity="0.8" />
                  <circle cx="90" cy="12" r="3" fill="#34d399" opacity="0.9" />
                </svg>
                <div className="mt-2 text-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                    Browser Sandbox Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
