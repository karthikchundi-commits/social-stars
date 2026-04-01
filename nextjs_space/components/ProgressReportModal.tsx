'use client';
// PC-14: Automated Clinical Progress Report — therapist-facing modal

import { useState } from 'react';
import { FileText, Loader2, TrendingUp, TrendingDown, Minus, X } from 'lucide-react';

interface Report {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string[];
  overallProgress: 'improving' | 'stable' | 'declining';
  progressNote: string;
}

interface Meta {
  childName: string;
  childAge: number;
  reportDate: string;
  therapistName: string;
  totalCompleted: number;
  recentCompleted: number;
}

interface Props {
  childId: string;
  childName: string;
}

export function ProgressReportModal({ childId, childName }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState('');

  const generate = async () => {
    setLoading(true);
    setError('');
    setReport(null);
    try {
      const res = await fetch('/api/therapist/progress-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to generate report'); return; }
      setReport(data.report);
      setMeta(data.meta);
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    if (!report) generate();
  };

  const ProgressIcon = report?.overallProgress === 'improving'
    ? TrendingUp
    : report?.overallProgress === 'declining'
    ? TrendingDown
    : Minus;

  const progressColor = report?.overallProgress === 'improving'
    ? 'text-green-600 bg-green-50'
    : report?.overallProgress === 'declining'
    ? 'text-red-600 bg-red-50'
    : 'text-yellow-600 bg-yellow-50';

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <FileText className="w-3.5 h-3.5" />
        Progress Report
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="font-bold text-gray-800">Clinical Progress Note</h2>
                {meta && <p className="text-xs text-gray-400">{childName} · {meta.reportDate}</p>}
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {loading && (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Loader2 className="w-7 h-7 animate-spin text-purple-500" />
                  <p className="text-sm text-gray-500">Generating clinical note…</p>
                </div>
              )}
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}

              {report && meta && (
                <>
                  {/* Progress badge */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${progressColor}`}>
                    <ProgressIcon className="w-4 h-4" />
                    {report.overallProgress.charAt(0).toUpperCase() + report.overallProgress.slice(1)}
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <div className="text-2xl font-black text-gray-800">{meta.recentCompleted}</div>
                      <div className="text-xs text-gray-500">Activities last 14 days</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <div className="text-2xl font-black text-gray-800">{meta.totalCompleted}</div>
                      <div className="text-xs text-gray-500">Total completed</div>
                    </div>
                  </div>

                  {/* SOAP note */}
                  {[
                    { label: 'S — Subjective', text: report.subjective },
                    { label: 'O — Objective', text: report.objective },
                    { label: 'A — Assessment', text: report.assessment },
                  ].map(({ label, text }) => (
                    <div key={label}>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</h4>
                      <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
                    </div>
                  ))}

                  <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">P — Plan</h4>
                    <ul className="space-y-1.5">
                      {report.plan.map((item, i) => (
                        <li key={i} className="flex gap-2 text-sm text-gray-700">
                          <span className="flex-shrink-0 w-5 h-5 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Plain-English note for parents */}
                  <div className="bg-blue-50 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Parent Summary</h4>
                    <p className="text-sm text-blue-800">{report.progressNote}</p>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={generate}
                      className="flex-1 text-sm py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600"
                    >
                      Regenerate
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="flex-1 text-sm py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-semibold"
                    >
                      Print / Save PDF
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
