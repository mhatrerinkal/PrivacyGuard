import React from 'react';
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck,
  Fingerprint,
  Globe,
  IdCard,
  Mail,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { AuditSummary, RedactionMode, SanitizationStatus } from '../types/pii';

interface AuditDashboardProps {
  summary: AuditSummary;
  onDownloadAuditReport: () => void;
}

const MODE_LABELS: Record<RedactionMode, string> = {
  full_mask: 'Full Mask ([REDACTED])',
  partial_mask: 'Partial Mask (Context Preserved)',
  pseudonymize: 'Consistent Pseudonymization',
};

function getStatusBadgeClasses(status: SanitizationStatus): string {
  switch (status) {
    case 'Ready to Export':
      return 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
    case 'Sanitized':
      return 'border-blue-500/40 bg-blue-500/15 text-blue-700 dark:text-blue-300';
    case 'PII Detected':
      return 'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300';
    case 'No PII Found':
      return 'border-teal-500/40 bg-teal-500/15 text-teal-700 dark:text-teal-300';
    default:
      return 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
  }
}

export const AuditDashboard: React.FC<AuditDashboardProps> = ({
  summary,
  onDownloadAuditReport,
}) => {
  const statCards = [
    {
      label: 'Total PII Detected',
      value: summary.totalDetected,
      icon: Activity,
      accent: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/25',
    },
    {
      label: 'Emails',
      value: summary.detectionCounts.email,
      icon: Mail,
      accent: 'text-blue-500 bg-blue-500/10 border-blue-500/25',
    },
    {
      label: 'Phone Numbers',
      value: summary.detectionCounts.phone,
      icon: Phone,
      accent: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/25',
    },
    {
      label: 'IP Addresses',
      value: summary.detectionCounts.ip,
      icon: Globe,
      accent: 'text-purple-500 bg-purple-500/10 border-purple-500/25',
    },
    {
      label: 'PAN Numbers',
      value: summary.detectionCounts.pan,
      icon: IdCard,
      accent: 'text-orange-500 bg-orange-500/10 border-orange-500/25',
    },
    {
      label: 'Aadhaar Numbers',
      value: summary.detectionCounts.aadhaar,
      icon: Fingerprint,
      accent: 'text-red-500 bg-red-500/10 border-red-500/25',
    },
    {
      label: 'Credit Cards',
      value: summary.detectionCounts.credit_card,
      icon: CreditCard,
      accent: 'text-pink-500 bg-pink-500/10 border-pink-500/25',
    },
    {
      label: 'Sensitive Chars Masked',
      value: summary.charactersMasked,
      icon: ShieldCheck,
      accent: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/25',
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/85 p-5 sm:p-6 shadow-xl shadow-slate-950/5 dark:shadow-slate-950/40 transition-colors">
      {/* Header + Status Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            <span>Audit &amp; Analytics Dashboard</span>
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time sanitization metrics computed strictly in local memory
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Status:
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-bold ${getStatusBadgeClasses(
              summary.status
            )}`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{summary.status}</span>
          </span>
        </div>
      </div>

      {/* 8 Live Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 p-3.5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border ${card.accent}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
              </div>
              <div>
                <p className="font-mono text-xl font-extrabold text-slate-900 dark:text-white">
                  {card.value.toLocaleString()}
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
                  {card.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Privacy-Safe Audit Summary Panel */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Privacy-Safe Audit Summary
            </h3>
            <span className="rounded-md bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
              No Raw PII Logged
            </span>
          </div>

          <button
            type="button"
            onClick={onDownloadAuditReport}
            disabled={!summary.scanTimestamp}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/35 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20 disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
          >
            <FileCheck className="h-3.5 w-3.5" />
            <span>Download Audit Report (.json)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
            <span className="flex items-center gap-1 text-slate-400 mb-1">
              <Clock className="h-3 w-3" />
              Scan Timestamp
            </span>
            <p className="font-mono font-semibold text-slate-800 dark:text-slate-200 truncate">
              {summary.scanTimestamp
                ? new Date(summary.scanTimestamp).toLocaleString()
                : 'Not scanned yet'}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
            <span className="text-slate-400 block mb-1">Source Input</span>
            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
              {summary.filename ?? 'Pasted / Typed Text'}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
            <span className="text-slate-400 block mb-1">Redaction Mode</span>
            <p className="font-semibold text-indigo-600 dark:text-indigo-300 truncate">
              {MODE_LABELS[summary.selectedMode]}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
            <span className="text-slate-400 block mb-1">Entities Sanitized</span>
            <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {summary.entitiesSanitized} / {summary.totalDetected}
            </p>
          </div>

          <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
            <span className="text-slate-400 block mb-1">Detection Breakdown</span>
            <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate">
              E:{summary.detectionCounts.email} P:{summary.detectionCounts.phone} IP:
              {summary.detectionCounts.ip} PAN:{summary.detectionCounts.pan} A:
              {summary.detectionCounts.aadhaar} CC:{summary.detectionCounts.credit_card}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
