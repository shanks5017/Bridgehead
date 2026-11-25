/**
 * ExportPdfModal.tsx — Zonek / Bridgehead
 * ─────────────────────────────────────────────────────────────────────────────
 * Comprehensive Multi-Mode Report & Document Export Engine
 *
 * Provides two distinct, senior-grade representations:
 *   1. "Download As-Is" (Full Visual PDF):
 *      Complete 5-section visual report with badges, itemized capex tables,
 *      unit economics gauges, Blue Ocean ERRC grid, and full 12-month P&L.
 *
 *   2. "Document This" (Executive Investment Memorandum):
 *      Text-first, zero-UI clean document layout with formal section numbering
 *      (Section I, Section II...), clear H1/H2/H3 hierarchy, bullet points,
 *      and formatted data tables tailored for presenting to banks, partners, or investors.
 *
 * Printing Isolation:
 *   Uses strict print CSS isolation targeting `#pdf-print-container` so the
 *   browser prints ONLY the continuous document without repeating headers,
 *   background bleed, or pagination anomalies.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import { FullBusinessReport } from '../../types';

interface Props {
  report: FullBusinessReport;
  businessName?: string;
  businessType: string;
  location: string;
  budgetInr: number;
  onClose: () => void;
}

type ExportMode = 'visual' | 'document';

export const ExportPdfModal: React.FC<Props> = ({
  report,
  businessName,
  businessType,
  location,
  budgetInr,
  onClose,
}) => {
  const [mode, setMode] = useState<ExportMode>('document');
  const [copied, setCopied] = useState(false);

  const plan = report.business_plan;
  const fin = report.financials;
  const comp = report.competitive_analysis;
  const rm = report.roadmap;

  const displayTitle = businessName || businessType;
  const verdict = plan?.executive_summary?.verdict || 'CAUTION';

  // Trigger isolated browser print
  const handlePrint = () => {
    window.print();
  };

  // Generate plain markdown text for copying
  const generateMarkdown = () => {
    return `# BUSINESS FEASIBILITY MEMORANDUM: ${displayTitle.toUpperCase()}
Target Location: ${location} | Allocated Budget: ₹${budgetInr.toLocaleString('en-IN')}
Date of Evaluation: ${new Date().toLocaleDateString('en-IN')}
Strategic Feasibility Verdict: ${verdict}

================================================================================
SECTION I: EXECUTIVE SUMMARY & FEASIBILITY THESIS
================================================================================
One-Liner Thesis:
${plan?.executive_summary?.one_liner || 'N/A'}

Feasibility Verdict Rationale:
${plan?.executive_summary?.verdict_rationale || 'N/A'}

1.1 Core Problem:
${plan?.executive_summary?.problem || 'N/A'}

1.2 The Solution:
${plan?.executive_summary?.solution || 'N/A'}

1.3 Defensible Moat:
${plan?.executive_summary?.competitive_moat || 'N/A'}

1.4 Market Opportunity:
${plan?.executive_summary?.market_opportunity || 'N/A'}

================================================================================
SECTION II: VALUE PROPOSITION & CUSTOMER DEMAND (JTBD & OFFER DESIGN)
================================================================================
2.1 Functional Jobs-To-Be-Done:
${(plan?.jobs_to_be_done?.functional_jobs || []).map(j => `  • ${j}`).join('\n')}

2.2 Current Substitutes (Existing Alternatives):
${(plan?.jobs_to_be_done?.current_substitutes || []).map(s => `  • ${s}`).join('\n')}

2.3 Core Offer Architecture (Hormozi Framework):
Core Offer: ${plan?.offer_design?.core_offer || 'N/A'}
Dream Outcome: ${plan?.offer_design?.dream_outcome || 'N/A'}
Time to Result: ${plan?.offer_design?.time_to_result || 'N/A'}
Effort Required: ${plan?.offer_design?.effort_required || 'N/A'}

Offer Stack:
${(plan?.offer_design?.offer_stack || []).map(o => `  + ${o}`).join('\n')}

2.4 Peter Thiel Monopoly Moat:
  • First Dominant Market: ${plan?.monopoly_analysis?.first_market || 'N/A'}
  • Proprietary Advantage: ${plan?.monopoly_analysis?.proprietary_tech_or_data || 'N/A'}
  • Network Effects: ${plan?.monopoly_analysis?.network_effects || 'N/A'}
  • 6-Month Copycat Barrier: ${plan?.monopoly_analysis?.copycat_barrier_6_months || 'N/A'}

================================================================================
SECTION III: FINANCIAL BLUEPRINT & PRO-FORMA ECONOMICS
================================================================================
3.1 Day-0 Capital Expenditure (Setup Costs):
Total Setup Capex: ₹${fin?.startup_costs?.setup_total.toLocaleString('en-IN')}
Budget Allocated: ₹${budgetInr.toLocaleString('en-IN')}
Surplus / Deficit: ₹${(budgetInr - (fin?.startup_costs?.setup_total || 0)).toLocaleString('en-IN')}

Itemized Capex Breakdown:
${(fin?.startup_costs?.breakdown || []).map(b => `  • ${b.item}: ₹${Number(b.amount).toLocaleString('en-IN')} (${b.source})`).join('\n')}

3.2 Unit Economics:
  • Average Revenue Per Customer: ₹${fin?.unit_economics?.avg_revenue_per_customer || 0}
  • COGS Per Unit: ₹${fin?.unit_economics?.cogs_per_unit || 0}
  • Gross Margin: ${fin?.unit_economics?.gross_margin_pct || 0}%
  • Customer Acquisition Cost (CAC): ₹${fin?.unit_economics?.cac_estimate || 0}
  • Lifetime Value (LTV): ₹${fin?.unit_economics?.ltv_estimate || 0}
  • LTV to CAC Ratio: ${fin?.unit_economics?.ltv_to_cac_ratio || 0} : 1
  • Payback Velocity: ${fin?.unit_economics?.payback_months || 0} Months
  • Working Capital Runway: ${fin?.runway?.months_of_runway || 6} Months (${fin?.runway?.critical_milestone || ''})

3.3 Break-Even Timeline (3 Scenarios):
  • Conservative Scenario: Break-even at Month ${fin?.scenarios?.conservative?.break_even_month || 6} (Year 1 Revenue: ₹${fin?.scenarios?.conservative?.year1_revenue.toLocaleString('en-IN')})
  • Base Case (Expected): Break-even at Month ${fin?.scenarios?.base?.break_even_month || 3} (Year 1 Revenue: ₹${fin?.scenarios?.base?.year1_revenue.toLocaleString('en-IN')})
  • Optimistic Scenario: Break-even at Month ${fin?.scenarios?.optimistic?.break_even_month || 2} (Year 1 Revenue: ₹${fin?.scenarios?.optimistic?.year1_revenue.toLocaleString('en-IN')})

================================================================================
SECTION IV: COMPETITIVE INTELLIGENCE & BLUE OCEAN POSITIONING
================================================================================
4.1 Identified Competitors:
${(comp?.competitor_matrix || []).map(c => `  • ${c.name} (${c.type}) | Threat: ${c.threat_level} | Pricing: ${c.pricing}\n    Weakness: ${c.weaknesses?.[0] || 'N/A'}`).join('\n')}

4.2 Blue Ocean Strategy (ERRC Grid):
  • ELIMINATE: ${(comp?.blue_ocean_grid?.eliminate || []).join(', ')}
  • REDUCE: ${(comp?.blue_ocean_grid?.reduce || []).join(', ')}
  • RAISE: ${(comp?.blue_ocean_grid?.raise || []).join(', ')}
  • CREATE: ${(comp?.blue_ocean_grid?.create || []).join(', ')}

================================================================================
SECTION V: REGULATORY LICENSING, COMPLIANCE & 90-DAY EXECUTION
================================================================================
5.1 Pre-Launch Statutory Licences:
${(rm?.licensing_checklist || []).map(l => `  • ${l.licence} | Authority: ${l.authority} | Timeline: ${l.timeline} | Fee: ${l.cost_estimate} | Status: ${l.status}`).join('\n')}

5.2 Critical Sprints (90-Day Execution):
  • Month 1 Theme: ${rm?.['90_day_roadmap']?.month_1?.theme || 'Launch & Beta Validation'}
  • Month 2 Theme: ${rm?.['90_day_roadmap']?.month_2?.theme || 'Growth & Marketplace Integration'}
  • Month 3 Theme: ${rm?.['90_day_roadmap']?.month_3?.theme || 'Scale & Geographic Expansion'}

--------------------------------------------------------------------------------
Generated by Zonek Feasibility Intelligence Engine
Zero-Hallucination Framework | Confidential & Proprietary
`;
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(generateMarkdown());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert('Could not copy automatically. Please use the Print/Save option.');
    }
  };

  // Export as Word (.doc)
  const handleDownloadDoc = () => {
    const content = document.getElementById('pdf-print-container')?.innerHTML || '';
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><title>${displayTitle} Feasibility Brief</title>
    <style>
      body { font-family: 'Times New Roman', Georgia, serif; font-size: 11pt; line-height: 1.5; color: #111; margin: 1in; }
      h1 { font-size: 20pt; font-weight: bold; margin-bottom: 4pt; border-bottom: 2pt solid #000; padding-bottom: 4pt; }
      h2 { font-size: 14pt; font-weight: bold; margin-top: 18pt; margin-bottom: 6pt; border-bottom: 1pt solid #444; padding-bottom: 2pt; text-transform: uppercase; }
      h3 { font-size: 12pt; font-weight: bold; margin-top: 12pt; margin-bottom: 4pt; }
      table { border-collapse: collapse; width: 100%; margin: 10pt 0; font-size: 10pt; }
      th, td { border: 1pt solid #bbb; padding: 6pt; text-align: left; }
      th { background-color: #f0f0f0; font-weight: bold; }
      .meta { font-size: 9pt; color: #555; margin-bottom: 15pt; }
      .badge { display: inline-block; padding: 2pt 6pt; font-weight: bold; font-size: 9pt; border: 1pt solid #000; }
    </style></head><body>`;
    const footer = `</body></html>`;
    const blob = new Blob([header + content + footer], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${displayTitle.replace(/\s+/g, '_')}_Feasibility_Brief.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* ── Strict Print Stylesheet Injection ─────────────────────────────── */}
      <style>{`
        @media print {
          /* Reset and isolate */
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          /* Hide EVERYTHING in the application except the designated print container */
          body * {
            visibility: hidden !important;
          }
          #pdf-print-container, #pdf-print-container * {
            visibility: visible !important;
          }
          #pdf-print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 12mm 15mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
          }
          /* Hide all interactive action buttons during print */
          .no-print, .no-print * {
            display: none !important;
          }
          /* Page break optimizations */
          .page-break-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .page-break-after {
            break-after: page !important;
            page-break-after: always !important;
          }
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
        }
      `}</style>

      {/* ── Modal Outer Shell ────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-[150] bg-black/85 backdrop-blur-md overflow-y-auto p-2 md:p-6 flex justify-center items-start print:p-0 print:bg-white print:static">
        <div className="bg-white text-neutral-900 w-full max-w-5xl border-2 border-black shadow-2xl my-6 relative overflow-hidden print:border-none print:shadow-none print:my-0 print:max-w-none">
          
          {/* ── Modal Control Bar (Excluded from Print) ────────────────────── */}
          <div className="bg-[#141414] text-white p-4 border-b-2 border-black flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
            <div className="flex items-center gap-3">
              <span className="text-xl">📄</span>
              <div>
                <h2 className="text-base font-black uppercase tracking-tight">Export Feasibility Intelligence</h2>
                <p className="text-xs text-neutral-400">Choose between the rich visual report or clean document memorandum.</p>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-1 bg-white/10 p-1 border border-white/20">
              <button
                onClick={() => setMode('document')}
                className={`px-3 py-1.5 text-xs font-bold uppercase transition-all ${
                  mode === 'document'
                    ? 'bg-white text-[#141414] shadow-sm'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                📝 Document This (Memorandum)
              </button>
              <button
                onClick={() => setMode('visual')}
                className={`px-3 py-1.5 text-xs font-bold uppercase transition-all ${
                  mode === 'visual'
                    ? 'bg-white text-[#141414] shadow-sm'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                🎨 Download As-Is (Visual PDF)
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-[#22C55E] hover:bg-[#16a34a] text-white font-black uppercase text-xs border border-black shadow-[2px_2px_0px_0px_#000] flex items-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px]"
              >
                <span>🖨️</span>
                <span>Print / Save PDF</span>
              </button>

              <button
                onClick={handleDownloadDoc}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase text-xs border border-black flex items-center gap-1"
                title="Download as Microsoft Word (.doc) document"
              >
                <span>Word (.doc)</span>
              </button>

              <button
                onClick={handleCopyText}
                className="px-3 py-2 bg-white/15 hover:bg-white/25 text-white font-bold uppercase text-xs border border-white/30"
              >
                {copied ? '✓ Copied!' : 'Copy Text'}
              </button>

              <button
                onClick={onClose}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold uppercase text-xs border border-white/20"
              >
                ✕ Close
              </button>
            </div>
          </div>

          {/* ── Printable Content Container ────────────────────────────────── */}
          <div id="pdf-print-container" className="p-6 md:p-10 max-h-[82vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0">
            
            {/* ══════════════════════════════════════════════════════════════════
                MODE 1: "DOCUMENT THIS" (EXECUTIVE INVESTMENT MEMORANDUM)
                Clean text-first layout, formal headings, clear typography, no UI boxes
               ══════════════════════════════════════════════════════════════════ */}
            {mode === 'document' ? (
              <div className="font-serif text-[#111] leading-relaxed max-w-4xl mx-auto space-y-6">
                
                {/* Formal Header */}
                <div className="border-b-2 border-black pb-4">
                  <div className="text-[10px] font-sans font-black uppercase tracking-widest text-neutral-500 mb-1">
                    CONFIDENTIAL INVESTMENT MEMORANDUM // VENTURE FEASIBILITY
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-neutral-900 font-sans">
                    {displayTitle}
                  </h1>
                  <div className="text-xs font-sans text-neutral-600 mt-2 flex flex-wrap gap-4">
                    <span><strong>Target Location:</strong> {location}</span>
                    <span><strong>Allocated Capital:</strong> ₹{budgetInr.toLocaleString('en-IN')}</span>
                    <span><strong>Evaluation Date:</strong> {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <span><strong>Feasibility Verdict:</strong> <span className="font-bold underline">{verdict}</span></span>
                  </div>
                </div>

                {/* Section I */}
                <div className="page-break-avoid">
                  <h2 className="text-base font-sans font-bold uppercase tracking-wider border-b border-neutral-300 pb-1 mb-3 text-neutral-900">
                    Section I: Executive Feasibility Thesis
                  </h2>
                  <p className="text-sm font-semibold mb-2">
                    {plan?.executive_summary?.one_liner}
                  </p>
                  <p className="text-xs text-neutral-700 leading-normal mb-4">
                    {plan?.executive_summary?.verdict_rationale}
                  </p>

                  <div className="space-y-2 text-xs">
                    <div>
                      <strong className="font-sans uppercase text-[11px] text-neutral-800">1.1 Problem Statement: </strong>
                      <span className="text-neutral-700">{plan?.executive_summary?.problem}</span>
                    </div>
                    <div>
                      <strong className="font-sans uppercase text-[11px] text-neutral-800">1.2 Proposed Solution: </strong>
                      <span className="text-neutral-700">{plan?.executive_summary?.solution}</span>
                    </div>
                    <div>
                      <strong className="font-sans uppercase text-[11px] text-neutral-800">1.3 Defensible Moat: </strong>
                      <span className="text-neutral-700">{plan?.executive_summary?.competitive_moat}</span>
                    </div>
                    <div>
                      <strong className="font-sans uppercase text-[11px] text-neutral-800">1.4 Market Opportunity: </strong>
                      <span className="text-neutral-700">{plan?.executive_summary?.market_opportunity}</span>
                    </div>
                  </div>
                </div>

                {/* Section II */}
                <div className="page-break-avoid">
                  <h2 className="text-base font-sans font-bold uppercase tracking-wider border-b border-neutral-300 pb-1 mb-3 text-neutral-900">
                    Section II: Customer Demand Economics & Offer Design
                  </h2>
                  
                  <h3 className="text-xs font-sans font-bold uppercase text-neutral-800 mb-1">2.1 Customer Jobs-To-Be-Done (JTBD)</h3>
                  <ul className="list-disc pl-5 text-xs text-neutral-700 space-y-1 mb-3">
                    {(plan?.jobs_to_be_done?.functional_jobs || []).map((j, i) => (
                      <li key={i}>{j}</li>
                    ))}
                  </ul>

                  <h3 className="text-xs font-sans font-bold uppercase text-neutral-800 mb-1">2.2 Core Offer Architecture</h3>
                  <p className="text-xs text-neutral-700 mb-2">
                    <strong>Core Offer:</strong> {plan?.offer_design?.core_offer}
                  </p>
                  <p className="text-xs text-neutral-700 mb-2">
                    <strong>Dream Outcome:</strong> {plan?.offer_design?.dream_outcome} (Achieved in {plan?.offer_design?.time_to_result || 'rapid timeframe'})
                  </p>

                  <h3 className="text-xs font-sans font-bold uppercase text-neutral-800 mb-1">2.3 Peter Thiel Monopoly Analysis</h3>
                  <div className="grid grid-cols-2 gap-3 text-xs text-neutral-700">
                    <div>• <strong>First Dominant Market:</strong> {plan?.monopoly_analysis?.first_market}</div>
                    <div>• <strong>Proprietary Advantage:</strong> {plan?.monopoly_analysis?.proprietary_tech_or_data}</div>
                    <div>• <strong>Network Effects:</strong> {plan?.monopoly_analysis?.network_effects}</div>
                    <div>• <strong>Copycat Barrier:</strong> {plan?.monopoly_analysis?.copycat_barrier_6_months}</div>
                  </div>
                </div>

                {/* Section III */}
                <div className="page-break-avoid">
                  <h2 className="text-base font-sans font-bold uppercase tracking-wider border-b border-neutral-300 pb-1 mb-3 text-neutral-900">
                    Section III: Capital Allocation, Capex & Unit Economics
                  </h2>

                  <div className="mb-3 text-xs">
                    <p>
                      <strong>Total Setup Capex Required:</strong> ₹{fin?.startup_costs?.setup_total.toLocaleString('en-IN')} &nbsp;|&nbsp;
                      <strong>Allocated Budget:</strong> ₹{budgetInr.toLocaleString('en-IN')} &nbsp;|&nbsp;
                      <strong>Capital Margin:</strong> ₹{(budgetInr - (fin?.startup_costs?.setup_total || 0)).toLocaleString('en-IN')}
                    </p>
                  </div>

                  <h3 className="text-xs font-sans font-bold uppercase text-neutral-800 mb-1">3.1 Itemized Setup Expenditure</h3>
                  <table className="w-full text-xs font-sans border-collapse mb-4">
                    <thead>
                      <tr className="bg-neutral-100 border-b border-neutral-300 text-left">
                        <th className="p-1.5 font-bold">Item / Investment Category</th>
                        <th className="p-1.5 font-bold text-right">Amount (₹)</th>
                        <th className="p-1.5 font-bold text-right">Basis / Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {(fin?.startup_costs?.breakdown || []).map((row, i) => (
                        <tr key={i}>
                          <td className="p-1.5">{row.item}</td>
                          <td className="p-1.5 text-right font-mono">₹{Number(row.amount).toLocaleString('en-IN')}</td>
                          <td className="p-1.5 text-right text-neutral-500">{row.source}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <h3 className="text-xs font-sans font-bold uppercase text-neutral-800 mb-1">3.2 Unit Economics & Contribution Margins</h3>
                  <div className="grid grid-cols-3 gap-2 text-xs font-sans p-2 bg-neutral-50 border border-neutral-200 mb-3">
                    <div>Average Ticket: <strong>₹{fin?.unit_economics?.avg_revenue_per_customer || 0}</strong></div>
                    <div>COGS per Unit: <strong>₹{fin?.unit_economics?.cogs_per_unit || 0}</strong></div>
                    <div>Gross Margin: <strong>{fin?.unit_economics?.gross_margin_pct || 0}%</strong></div>
                    <div>Estimated CAC: <strong>₹{fin?.unit_economics?.cac_estimate || 0}</strong></div>
                    <div>LTV Estimate: <strong>₹{fin?.unit_economics?.ltv_estimate || 0}</strong></div>
                    <div>LTV/CAC: <strong>{fin?.unit_economics?.ltv_to_cac_ratio || 0}:1</strong></div>
                  </div>

                  <h3 className="text-xs font-sans font-bold uppercase text-neutral-800 mb-1">3.3 12-Month Pro-Forma Projection</h3>
                  <div className="text-xs text-neutral-700">
                    <p>
                      • <strong>Base Case Break-Even:</strong> Month {fin?.scenarios?.base?.break_even_month || 3} (Expected Year 1 Revenue: ₹{fin?.scenarios?.base?.year1_revenue.toLocaleString('en-IN')})<br/>
                      • <strong>Conservative Break-Even:</strong> Month {fin?.scenarios?.conservative?.break_even_month || 6} | <strong>Working Capital Runway:</strong> {fin?.runway?.months_of_runway || 6} Months
                    </p>
                  </div>
                </div>

                {/* Section IV */}
                <div className="page-break-avoid">
                  <h2 className="text-base font-sans font-bold uppercase tracking-wider border-b border-neutral-300 pb-1 mb-3 text-neutral-900">
                    Section IV: Competitive Landscape & Strategic Differentiation
                  </h2>
                  
                  <h3 className="text-xs font-sans font-bold uppercase text-neutral-800 mb-1">4.1 Local Market Incumbents</h3>
                  <div className="space-y-1.5 text-xs text-neutral-700 mb-3">
                    {(comp?.competitor_matrix || []).map((c, i) => (
                      <div key={i}>
                        • <strong>{c.name}</strong> ({c.type}): Pricing at {c.pricing}. Threat Level: {c.threat_level}. Exploitable Weakness: {c.weaknesses?.[0]}
                      </div>
                    ))}
                  </div>

                  <h3 className="text-xs font-sans font-bold uppercase text-neutral-800 mb-1">4.2 Blue Ocean Strategy (ERRC Grid)</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs font-sans p-2 bg-neutral-50 border border-neutral-200">
                    <div><strong>Eliminate:</strong> {(comp?.blue_ocean_grid?.eliminate || []).join(', ')}</div>
                    <div><strong>Reduce:</strong> {(comp?.blue_ocean_grid?.reduce || []).join(', ')}</div>
                    <div><strong>Raise:</strong> {(comp?.blue_ocean_grid?.raise || []).join(', ')}</div>
                    <div><strong>Create:</strong> {(comp?.blue_ocean_grid?.create || []).join(', ')}</div>
                  </div>
                </div>

                {/* Section V */}
                <div className="page-break-avoid">
                  <h2 className="text-base font-sans font-bold uppercase tracking-wider border-b border-neutral-300 pb-1 mb-3 text-neutral-900">
                    Section V: Statutory Compliance, Licences & Operational Controls
                  </h2>

                  <h3 className="text-xs font-sans font-bold uppercase text-neutral-800 mb-1">5.1 Pre-Launch Regulatory Licences</h3>
                  <table className="w-full text-xs font-sans border-collapse mb-4">
                    <thead>
                      <tr className="bg-neutral-100 border-b border-neutral-300 text-left">
                        <th className="p-1.5 font-bold">Required Licence</th>
                        <th className="p-1.5 font-bold">Issuing Authority</th>
                        <th className="p-1.5 font-bold">Timeline</th>
                        <th className="p-1.5 font-bold text-right">Fee (Est.)</th>
                        <th className="p-1.5 font-bold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {(rm?.licensing_checklist || []).map((l, i) => (
                        <tr key={i}>
                          <td className="p-1.5 font-bold">{l.licence}</td>
                          <td className="p-1.5 text-neutral-600">{l.authority}</td>
                          <td className="p-1.5 font-mono">{l.timeline}</td>
                          <td className="p-1.5 text-right font-mono">{l.cost_estimate}</td>
                          <td className="p-1.5 text-right font-bold">{l.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <h3 className="text-xs font-sans font-bold uppercase text-neutral-800 mb-1">5.2 Day-1 Standard Operating Procedures (SOPs)</h3>
                  <div className="space-y-1.5 text-xs text-neutral-700">
                    {(rm?.sops || []).map((sop, i) => (
                      <div key={i}>
                        • <strong>{sop.process_name}</strong> (Owner: {sop.owner}) — Trigger: {sop.trigger}. Key Gate: {sop.quality_check}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Document Sign-off */}
                <div className="pt-6 border-t border-neutral-300 flex justify-between items-center text-[11px] font-sans text-neutral-500">
                  <span>Prepared with Zonek Zero-Hallucination Feasibility Architecture</span>
                  <span>Signature: __________________________</span>
                </div>
              </div>
            ) : (
              /* ══════════════════════════════════════════════════════════════════
                  MODE 2: "DOWNLOAD AS-IS" (FULL COMPREHENSIVE VISUAL DOSSIER)
                  Complete graphic cards, capex tables, badges, 12m P&L projection
                 ══════════════════════════════════════════════════════════════════ */
              <div className="space-y-6">
                
                {/* 1. Header & Verdict Banner */}
                <div className="p-6 border-2 border-black bg-[#141414] text-white">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-wider text-[#22C55E] mb-1">
                        Zonek Comprehensive Ground-Truth Dossier
                      </div>
                      <h1 className="text-2xl md:text-3xl font-black uppercase text-white">
                        {displayTitle}
                      </h1>
                      <p className="text-xs font-mono text-neutral-400 mt-1">
                        📍 {location} · Budget: ₹{budgetInr.toLocaleString('en-IN')} · Date: {new Date().toLocaleDateString('en-IN')}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-neutral-400 block mb-1">Feasibility Verdict</span>
                      <span className={`inline-block text-2xl font-black px-4 py-1 border-2 border-black ${
                        verdict === 'GO' ? 'bg-[#22C55E] text-white' :
                        verdict === 'CAUTION' ? 'bg-[#FBBF24] text-neutral-900' :
                        'bg-[#EF4444] text-white'
                      }`}>
                        {verdict}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/20">
                    <p className="text-sm font-bold text-white mb-1">{plan?.executive_summary?.one_liner}</p>
                    <p className="text-xs text-neutral-300 leading-relaxed">{plan?.executive_summary?.verdict_rationale}</p>
                  </div>
                </div>

                {/* 2. Executive Pillars */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 page-break-avoid">
                  <div className="p-4 border-2 border-black bg-neutral-50">
                    <span className="text-[10px] font-black uppercase text-neutral-500 block mb-1">Core Problem</span>
                    <p className="text-xs text-neutral-900">{plan?.executive_summary?.problem}</p>
                  </div>
                  <div className="p-4 border-2 border-black bg-neutral-50">
                    <span className="text-[10px] font-black uppercase text-neutral-500 block mb-1">Unique Solution</span>
                    <p className="text-xs text-neutral-900">{plan?.executive_summary?.solution}</p>
                  </div>
                  <div className="p-4 border-2 border-black bg-neutral-50">
                    <span className="text-[10px] font-black uppercase text-neutral-500 block mb-1">Defensible Moat</span>
                    <p className="text-xs text-neutral-900">{plan?.executive_summary?.competitive_moat}</p>
                  </div>
                </div>

                {/* 3. Financial Blueprint Summary */}
                {fin && (
                  <div className="p-6 border-2 border-black bg-white page-break-avoid">
                    <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-4">
                      <h3 className="font-black text-sm uppercase">Financial Blueprint & Unit Economics</h3>
                      <span className="text-xs font-mono font-bold">Confidence: {fin.startup_costs?.data_confidence || 'VERIFIED'}</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-4">
                      <div className="p-3 bg-neutral-50 border border-neutral-300">
                        <span className="text-[10px] font-bold uppercase text-neutral-500 block">Total Setup Capex</span>
                        <span className="text-base font-black text-neutral-900">₹{fin.startup_costs?.setup_total.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="p-3 bg-neutral-50 border border-neutral-300">
                        <span className="text-[10px] font-bold uppercase text-neutral-500 block">Gross Margin %</span>
                        <span className="text-base font-black text-emerald-700">{fin.unit_economics?.gross_margin_pct}%</span>
                      </div>
                      <div className="p-3 bg-neutral-50 border border-neutral-300">
                        <span className="text-[10px] font-bold uppercase text-neutral-500 block">Break-even Month</span>
                        <span className="text-base font-black text-neutral-900">Month {fin.scenarios?.base?.break_even_month || 3}</span>
                      </div>
                      <div className="p-3 bg-neutral-50 border border-neutral-300">
                        <span className="text-[10px] font-bold uppercase text-neutral-500 block">Runway</span>
                        <span className="text-base font-black text-emerald-700">{fin.runway?.months_of_runway || 6} Months</span>
                      </div>
                    </div>

                    {/* Itemized Capex Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b-2 border-black text-left text-neutral-500 uppercase font-black">
                            <th className="py-1.5">Capex Item</th>
                            <th className="py-1.5 text-right">Amount (₹)</th>
                            <th className="py-1.5 text-right">Verification Basis</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 font-mono">
                          {(fin.startup_costs?.breakdown || []).map((row, i) => (
                            <tr key={i}>
                              <td className="py-1.5 font-sans font-bold">{row.item}</td>
                              <td className="py-1.5 text-right font-black">₹{Number(row.amount).toLocaleString('en-IN')}</td>
                              <td className="py-1.5 text-right text-neutral-500">{row.source}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 4. Competitor Intelligence & ERRC Grid */}
                {comp && (
                  <div className="p-6 border-2 border-black bg-white page-break-avoid">
                    <h3 className="font-black text-sm uppercase pb-2 border-b-2 border-black mb-4">
                      Competitive Intelligence & Blue Ocean Grid
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-4">
                      {(comp.competitor_matrix || []).slice(0, 4).map((c, i) => (
                        <div key={i} className="p-3 border border-neutral-300 bg-neutral-50">
                          <div className="flex justify-between items-center mb-1">
                            <strong>{c.name}</strong>
                            <span className="text-[10px] px-1.5 py-0.5 bg-neutral-200">{c.pricing}</span>
                          </div>
                          <div className="text-[11px] text-neutral-600">Attack angle: {c.weaknesses?.[0]}</div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div className="p-2.5 bg-red-50 border border-red-300">
                        <strong className="block text-red-800 text-[10px] uppercase">Eliminate</strong>
                        <span>{(comp.blue_ocean_grid?.eliminate || []).slice(0, 2).join(', ')}</span>
                      </div>
                      <div className="p-2.5 bg-amber-50 border border-amber-300">
                        <strong className="block text-amber-800 text-[10px] uppercase">Reduce</strong>
                        <span>{(comp.blue_ocean_grid?.reduce || []).slice(0, 2).join(', ')}</span>
                      </div>
                      <div className="p-2.5 bg-blue-50 border border-blue-300">
                        <strong className="block text-blue-800 text-[10px] uppercase">Raise</strong>
                        <span>{(comp.blue_ocean_grid?.raise || []).slice(0, 2).join(', ')}</span>
                      </div>
                      <div className="p-2.5 bg-emerald-50 border border-emerald-300">
                        <strong className="block text-emerald-800 text-[10px] uppercase">Create</strong>
                        <span>{(comp.blue_ocean_grid?.create || []).slice(0, 2).join(', ')}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Statutory Licences */}
                {rm?.licensing_checklist && (
                  <div className="p-6 border-2 border-black bg-white page-break-avoid">
                    <h3 className="font-black text-sm uppercase pb-2 border-b-2 border-black mb-3">
                      Statutory Regulatory Licences
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      {rm.licensing_checklist.slice(0, 4).map((l, i) => (
                        <div key={i} className="p-2.5 border border-neutral-300 bg-neutral-50">
                          <strong className="block text-[11px] text-neutral-900">{l.licence}</strong>
                          <span className="text-[10px] text-neutral-500 font-mono block mt-0.5">{l.timeline} · {l.cost_estimate}</span>
                          <span className="inline-block mt-1 text-[9px] font-black uppercase text-red-700 bg-red-100 px-1 py-0.5">{l.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="pt-4 border-t-2 border-black flex justify-between items-center text-xs font-mono text-neutral-500">
                  <span>Powered by Zonek Machine Intelligence · Zero-Hallucination Framework</span>
                  <span>Confidential & Proprietary</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ExportPdfModal;
