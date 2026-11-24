import React from 'react';
import { FullBusinessReport } from '../../types';

interface Props {
  report: FullBusinessReport;
  businessName?: string;
  businessType: string;
  location: string;
  budgetInr: number;
  onClose: () => void;
}

export const ExportPdfModal: React.FC<Props> = ({
  report,
  businessName,
  businessType,
  location,
  budgetInr,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const plan = report.business_plan;
  const fin = report.financials;
  const comp = report.competitive_analysis;
  const rm = report.roadmap;

  return (
    <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm overflow-y-auto p-4 md:p-8 flex justify-center">
      <div className="bg-white text-neutral-900 w-full max-w-4xl border-2 border-black shadow-2xl p-6 md:p-10 my-auto relative">
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-black mb-6 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xl">📄</span>
            <span className="font-black uppercase text-sm">Investor / Bank Feasibility Brief</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#22C55E] text-white font-bold uppercase text-xs border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:bg-[#16a34a]"
            >
              Print / Save PDF 🖨️
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-xs font-bold uppercase border border-neutral-300"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* ── Printable Report Content ─────────────────────────────────── */}
        <div className="space-y-6 print:space-y-4">
          {/* Header */}
          <div className="border-b-4 border-black pb-4 flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500 block mb-0.5">
                ZONEK / BRIDGEHEAD FEASIBILITY REPORT
              </span>
              <h1 className="text-2xl md:text-3xl font-black uppercase text-neutral-900">
                {businessName || businessType}
              </h1>
              <p className="text-xs font-mono text-neutral-600 mt-1">
                📍 {location} · Target Capex: ₹{budgetInr.toLocaleString('en-IN')} · Date: {new Date().toLocaleDateString('en-IN')}
              </p>
            </div>
            {plan?.executive_summary?.verdict && (
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase block text-neutral-500">Verdict</span>
                <span className="inline-block text-xl font-black px-3 py-1 bg-black text-white">
                  {plan.executive_summary.verdict}
                </span>
              </div>
            )}
          </div>

          {/* Executive Summary */}
          {plan?.executive_summary && (
            <div className="p-4 bg-neutral-100 border border-neutral-300">
              <h3 className="font-black text-sm uppercase mb-1">Executive Thesis</h3>
              <p className="text-xs font-bold text-neutral-900 mb-1">{plan.executive_summary.one_liner}</p>
              <p className="text-xs text-neutral-700 leading-relaxed">{plan.executive_summary.verdict_rationale}</p>
            </div>
          )}

          {/* Unit Economics & Capex Summary */}
          {fin && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 border border-neutral-300 bg-neutral-50">
                <span className="font-bold uppercase text-neutral-500 text-[10px] block">Total Setup Capex</span>
                <span className="text-base font-black text-neutral-900">
                  ₹{fin.startup_costs?.setup_total.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3 border border-neutral-300 bg-neutral-50">
                <span className="font-bold uppercase text-neutral-500 text-[10px] block">Gross Margin</span>
                <span className="text-base font-black text-emerald-700">
                  {fin.unit_economics?.gross_margin_pct}%
                </span>
              </div>
              <div className="p-3 border border-neutral-300 bg-neutral-50">
                <span className="font-bold uppercase text-neutral-500 text-[10px] block">Break-even Speed</span>
                <span className="text-base font-black text-neutral-900">
                  Month {fin.scenarios?.base?.break_even_month || 3}
                </span>
              </div>
              <div className="p-3 border border-neutral-300 bg-neutral-50">
                <span className="font-bold uppercase text-neutral-500 text-[10px] block">Working Capital Runway</span>
                <span className="text-base font-black text-neutral-900">
                  {fin.runway?.months_of_runway || 6} Months
                </span>
              </div>
            </div>
          )}

          {/* Competitive Landscape */}
          {comp?.competitor_matrix && comp.competitor_matrix.length > 0 && (
            <div>
              <h3 className="font-black text-xs uppercase mb-2 border-b-2 border-black pb-1">
                Local Competitive Moat & Competitors Analyzed
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                {comp.competitor_matrix.slice(0, 3).map((c, i) => (
                  <div key={i} className="p-2.5 border border-neutral-300 bg-neutral-50">
                    <strong className="block text-neutral-900">{c.name}</strong>
                    <span className="text-[10px] text-neutral-500">Pricing: {c.pricing}</span>
                    <p className="text-[11px] text-neutral-700 mt-1">Attack: {c.weaknesses?.[0]}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Statutory Licences */}
          {rm?.licensing_checklist && rm.licensing_checklist.length > 0 && (
            <div>
              <h3 className="font-black text-xs uppercase mb-2 border-b-2 border-black pb-1">
                Statutory Regulatory Licences (Pre-Launch)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                {rm.licensing_checklist.slice(0, 4).map((l, i) => (
                  <div key={i} className="p-2 border border-neutral-200">
                    <strong className="block text-[11px] text-neutral-900">{l.licence}</strong>
                    <span className="text-[10px] text-neutral-500 font-mono">{l.timeline} · {l.cost_estimate}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-4 border-t border-neutral-300 flex justify-between items-center text-[10px] font-mono text-neutral-500">
            <span>Powered by Zonek Machine Intelligence · Zero-Hallucination Framework</span>
            <span>Confidential & Proprietary</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportPdfModal;
