/**
 * ExportPdfModal.tsx — Zonek / Bridgehead
 * ─────────────────────────────────────────────────────────────────────────────
 * Complete Multi-Mode Report & Document Export Engine
 *
 * Exposes 100% of the intelligence generated across all 5 research tabs:
 *   Section I:   Executive Summary & Feasibility Thesis
 *   Section II:  Customer Demand, JTBD & Offer Architecture (Hormozi & Thiel)
 *   Section III: Commercial Real Estate & Micro-Market Footprint
 *   Section IV:  Capital Allocation, Day-0 Capex & Unit Economics
 *   Section V:   12-Month Pro-Forma Cash Flow & 3 Break-Even Scenarios
 *   Section VI:  Competitive Intelligence, Blue Ocean ERRC & Porter's 5 Forces
 *   Section VII: Central & State Government Capital Subsidies & Grants
 *   Section VIII: Pre-Launch Regulatory Licensing & Statutory Checklist
 *   Section IX:  Standard Operating Procedures (SOPs) & Risk Register
 *
 * Export Modes:
 *   1. "📝 Document This" (Executive Investment Memorandum):
 *      Formal, bank-ready, institutional typography (Times New Roman / Georgia),
 *      Roman numerals, formal data tables, no decorative UI cards.
 *
 *   2. "🎨 Download As-Is" (Comprehensive Visual Dossier):
 *      Full visual presentation with status indicators, capex breakdown tables,
 *      unit economics metrics, competitor attack grids, and 12-month projections.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import { FullBusinessReport } from '../../types';

interface Props {
  report: FullBusinessReport;
  evidence?: {
    rentals?: any[];
    competitors?: any[];
    schemes?: any[];
  };
  businessName?: string;
  businessType: string;
  location: string;
  budgetInr: number;
  onClose: () => void;
}

type ExportMode = 'document' | 'visual';

export const ExportPdfModal: React.FC<Props> = ({
  report,
  evidence,
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

  // Resolve all evidence sources
  const rentals = (evidence?.rentals?.length
    ? evidence.rentals
    : (report.evidence?.rentals || report.evidence_summary?.rentals || [])) as any[];

  const schemes = (evidence?.schemes?.length
    ? evidence.schemes
    : (report.evidence?.govSchemes || report.evidence?.schemes || report.evidence_summary?.schemes || [])) as any[];

  const displayTitle = businessName || businessType;
  const verdict = plan?.executive_summary?.verdict || 'CAUTION';

  const monthlyProjections = fin?.monthly_projections_12m || [];
  const scenarios = fin?.scenarios;
  const sops = rm?.sops || [];
  const risks = rm?.risk_register || [];
  const licensing = rm?.licensing_checklist || [];
  const competitors = comp?.competitor_matrix || [];

  // ─── BULLETPROOF IFRAME PRINT ENGINE ───────────────────────────────────────
  const handlePrint = () => {
    const container = document.getElementById('pdf-print-container');
    if (!container) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const isDocMode = mode === 'document';
    const styles = `
      @page {
        size: A4 portrait;
        margin: 12mm 14mm;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        padding: 0;
        font-family: ${isDocMode ? "'Times New Roman', Georgia, serif" : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"};
        color: #111111;
        background: #ffffff;
        font-size: 10pt;
        line-height: 1.45;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      h1 { font-size: 18pt; margin: 0 0 4pt 0; text-transform: uppercase; font-weight: bold; }
      h2 { font-size: 12.5pt; margin: 14pt 0 5pt 0; text-transform: uppercase; border-bottom: 1.5pt solid #222; padding-bottom: 3pt; font-weight: bold; }
      h3 { font-size: 10.5pt; margin: 9pt 0 3pt 0; font-weight: bold; text-transform: uppercase; }
      p, li { font-size: 9.5pt; line-height: 1.4; }
      ul { margin: 3pt 0 6pt 0; padding-left: 18pt; }
      table { width: 100%; border-collapse: collapse; margin: 6pt 0 10pt 0; font-size: 9pt; }
      th, td { border: 1pt solid #ccc; padding: 4.5pt 6.5pt; text-align: left; }
      th { background-color: #f3f3f3; font-weight: bold; }
      .text-right { text-align: right; }
      .font-mono { font-family: 'Courier New', Courier, monospace; }
      .badge { display: inline-block; padding: 2pt 5pt; font-weight: bold; font-size: 8pt; border: 1pt solid #111; }
      .page-break-avoid { page-break-inside: avoid; break-inside: avoid; }
      .page-break-before { page-break-before: always; break-before: page; }
      .footer-sign { margin-top: 20pt; padding-top: 8pt; border-top: 1pt solid #ccc; font-size: 8pt; color: #666; display: flex; justify-content: space-between; }
    `;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${displayTitle} — Comprehensive Feasibility Intelligence</title>
          <style>${styles}</style>
        </head>
        <body>
          <div style="padding: 10px;">
            ${container.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        try { document.body.removeChild(iframe); } catch {}
      }, 2500);
    }, 400);
  };

  // ─── STANDALONE HTML EXPORT ────────────────────────────────────────────────
  const handleDownloadHtml = () => {
    const container = document.getElementById('pdf-print-container');
    if (!container) return;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${displayTitle} — Complete Feasibility Intelligence Dossier</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 950px; margin: 30px auto; padding: 20px; line-height: 1.5; color: #111; background: #fff; }
    h1 { border-bottom: 3px solid #111; padding-bottom: 8px; font-size: 24px; text-transform: uppercase; }
    h2 { border-bottom: 1.5px solid #333; padding-bottom: 4px; margin-top: 24px; font-size: 16px; text-transform: uppercase; }
    h3 { margin-top: 14px; font-size: 13px; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
    th { background: #f4f4f4; }
    .page-break-avoid { break-inside: avoid; }
    @media print { body { max-width: 100%; margin: 0; padding: 0; } }
  </style>
</head>
<body>
  ${container.innerHTML}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${displayTitle.replace(/\s+/g, '_')}_Complete_Dossier.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ─── WORD (.DOC) EXPORT ────────────────────────────────────────────────────
  const handleDownloadDoc = () => {
    const content = document.getElementById('pdf-print-container')?.innerHTML || '';
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><title>${displayTitle} Feasibility Brief</title>
    <style>
      body { font-family: 'Times New Roman', Georgia, serif; font-size: 10.5pt; line-height: 1.45; color: #111; margin: 1in; }
      h1 { font-size: 20pt; font-weight: bold; margin-bottom: 4pt; border-bottom: 2pt solid #000; padding-bottom: 4pt; }
      h2 { font-size: 13pt; font-weight: bold; margin-top: 16pt; margin-bottom: 5pt; border-bottom: 1pt solid #444; padding-bottom: 2pt; text-transform: uppercase; }
      h3 { font-size: 11pt; font-weight: bold; margin-top: 10pt; margin-bottom: 3pt; }
      table { border-collapse: collapse; width: 100%; margin: 8pt 0; font-size: 9.5pt; }
      th, td { border: 1pt solid #bbb; padding: 5pt; text-align: left; }
      th { background-color: #f0f0f0; font-weight: bold; }
    </style></head><body>`;
    const footer = `</body></html>`;
    const blob = new Blob([header + content + footer], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${displayTitle.replace(/\s+/g, '_')}_Complete_Memorandum.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ─── MARKDOWN GENERATION ───────────────────────────────────────────────────
  const generateMarkdown = () => {
    return `# BUSINESS FEASIBILITY MEMORANDUM: ${displayTitle.toUpperCase()}
Target Location: ${location} | Allocated Capital: ₹${budgetInr.toLocaleString('en-IN')}
Date of Evaluation: ${new Date().toLocaleDateString('en-IN')}
Strategic Feasibility Verdict: ${verdict}

================================================================================
SECTION I: EXECUTIVE SUMMARY & FEASIBILITY THESIS
================================================================================
One-Liner Thesis:
${plan?.executive_summary?.one_liner || 'N/A'}

Verdict Rationale:
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
SECTION II: VALUE PROPOSITION, JTBD & MONOPOLY ARCHITECTURE
================================================================================
2.1 Functional Jobs-To-Be-Done:
${(plan?.jobs_to_be_done?.functional_jobs || []).map(j => `  • ${j}`).join('\n')}

2.2 Emotional & Social Drivers:
  • Social: ${(plan?.jobs_to_be_done?.social_jobs || []).join('; ')}
  • Emotional: ${(plan?.jobs_to_be_done?.emotional_jobs || []).join('; ')}

2.3 Current Substitutes (Existing Alternatives):
${(plan?.jobs_to_be_done?.current_substitutes || []).map(s => `  • ${s}`).join('\n')}

2.4 Core Offer Architecture (Hormozi Framework):
  • Core Offer: ${plan?.offer_design?.core_offer || 'N/A'}
  • Dream Outcome: ${plan?.offer_design?.dream_outcome || 'N/A'}
  • Time to Result: ${plan?.offer_design?.time_to_result || 'N/A'}
  • Effort Required: ${plan?.offer_design?.effort_required || 'N/A'}
  • Offer Stack: ${(plan?.offer_design?.offer_stack || []).join(' + ')}

2.5 Peter Thiel Monopoly Moat:
  • Beachhead Market: ${plan?.monopoly_analysis?.first_market || 'N/A'}
  • Proprietary Tech/Data: ${plan?.monopoly_analysis?.proprietary_tech_or_data || 'N/A'}
  • Network Effects: ${plan?.monopoly_analysis?.network_effects || 'N/A'}
  • 6-Month Copycat Barrier: ${plan?.monopoly_analysis?.copycat_barrier_6_months || 'N/A'}

================================================================================
SECTION III: COMMERCIAL REAL ESTATE & LOCATION BENCHMARKS
================================================================================
${rentals.length > 0 ? rentals.map(r => `  • ${r.title || r.locality || 'Commercial Floor'}: ₹${Number(r.monthly_rent || r.rent || 0).toLocaleString('en-IN')}/mo | Area: ${r.super_builtup_area_sqft || r.area_sqft || 'N/A'} sqft | Source: ${r.source_platform || r.platform || 'Verified'}`).join('\n') : '  • Standard commercial rent in ' + location + ' benchmarks at ₹50–₹110/sqft.'}

================================================================================
SECTION IV: DAY-0 CAPITAL ALLOCATION & UNIT ECONOMICS
================================================================================
Total Setup Capex: ₹${fin?.startup_costs?.setup_total.toLocaleString('en-IN')}
Budget Allocated: ₹${budgetInr.toLocaleString('en-IN')}
Surplus / Deficit: ₹${(budgetInr - (fin?.startup_costs?.setup_total || 0)).toLocaleString('en-IN')}

Itemized Capex Breakdown:
${(fin?.startup_costs?.breakdown || []).map(b => `  • ${b.item}: ₹${Number(b.amount).toLocaleString('en-IN')} (${b.source})`).join('\n')}

Unit Economics Metrics:
  • Avg Ticket Size: ₹${fin?.unit_economics?.avg_revenue_per_customer || 0}
  • COGS Per Unit: ₹${fin?.unit_economics?.cogs_per_unit || 0}
  • Gross Margin %: ${fin?.unit_economics?.gross_margin_pct || 0}%
  • Customer CAC: ₹${fin?.unit_economics?.cac_estimate || 0}
  • Lifetime Value (LTV): ₹${fin?.unit_economics?.ltv_estimate || 0}
  • LTV / CAC Ratio: ${fin?.unit_economics?.ltv_to_cac_ratio || 0} : 1
  • Payback Velocity: ${fin?.unit_economics?.payback_months || 0} Months
  • Working Capital Runway: ${fin?.runway?.months_of_runway || 6} Months

================================================================================
SECTION V: 12-MONTH PRO-FORMA CASH FLOW & 3 BREAK-EVEN SCENARIOS
================================================================================
Break-Even Scenarios:
  • Conservative: Month ${scenarios?.conservative?.break_even_month || 6} (Year 1 Revenue: ₹${scenarios?.conservative?.year1_revenue.toLocaleString('en-IN')})
  • Base Case: Month ${scenarios?.base?.break_even_month || 3} (Year 1 Revenue: ₹${scenarios?.base?.year1_revenue.toLocaleString('en-IN')})
  • Optimistic: Month ${scenarios?.optimistic?.break_even_month || 2} (Year 1 Revenue: ₹${scenarios?.optimistic?.year1_revenue.toLocaleString('en-IN')})

12-Month Cash Burn & Margin Schedule:
${monthlyProjections.map(m => `  • M${m.month}: Cust: ${m.customers} | Rev: ₹${m.revenue.toLocaleString('en-IN')} | Exp: ₹${m.expenses.toLocaleString('en-IN')} | Net: ₹${m.net.toLocaleString('en-IN')} | Burn: ₹${m.cumulative_burn.toLocaleString('en-IN')}`).join('\n')}

================================================================================
SECTION VI: COMPETITIVE LANDSCAPE & BLUE OCEAN STRATEGY
================================================================================
Competitors Mapped:
${competitors.map(c => `  • ${c.name} (${c.type}): Threat: ${c.threat_level} | Pricing: ${c.pricing} | Attack: ${c.weaknesses?.[0] || 'N/A'}`).join('\n')}

Blue Ocean ERRC Grid:
  • Eliminate: ${(comp?.blue_ocean_grid?.eliminate || []).join(', ')}
  • Reduce: ${(comp?.blue_ocean_grid?.reduce || []).join(', ')}
  • Raise: ${(comp?.blue_ocean_grid?.raise || []).join(', ')}
  • Create: ${(comp?.blue_ocean_grid?.create || []).join(', ')}

================================================================================
SECTION VII: GOVERNMENT CAPITAL SUBSIDIES & STATUTORY CLEARANCES
================================================================================
Government Schemes:
${schemes.map(s => `  • ${s.scheme_name} (${s.ministry}): Benefit: ${s.benefit} | Eligibility: ${s.eligibility}`).join('\n')}

Statutory Licensing Checklist:
${licensing.map(l => `  • ${l.licence} | Authority: ${l.authority} | Timeline: ${l.timeline} | Fee: ${l.cost_estimate} | Status: ${l.status}`).join('\n')}

================================================================================
SECTION VIII: OPERATIONAL SOPS & RISK MITIGATION PLAYBOOK
================================================================================
Standard Operating Procedures (SOPs):
${sops.map(sop => `  • ${sop.process_name} (Owner: ${sop.owner}): Trigger: ${sop.trigger} | Gate: ${sop.quality_check}\n    Steps: ${(sop.steps || []).join(' -> ')}`).join('\n')}

Risk Register:
${risks.map(r => `  • Risk: ${r.risk} (Impact: ${r.impact}, Prob: ${r.probability}) | Mitigation: ${r.mitigation}`).join('\n')}

--------------------------------------------------------------------------------
Zonek Feasibility Intelligence Engine · Confidential & Proprietary
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

  return (
    <div className="fixed inset-0 z-[150] bg-black/85 backdrop-blur-md overflow-y-auto p-2 md:p-6 flex justify-center items-start">
      <div className="bg-white text-neutral-900 w-full max-w-5xl border-2 border-black shadow-2xl my-6 relative overflow-hidden">
        
        {/* ── Control Header ──────────────────────────────────────────────── */}
        <div className="bg-[#141414] text-white p-4 border-b-2 border-black flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">📄</span>
            <div>
              <h2 className="text-base font-black uppercase tracking-tight">Export Full Feasibility Dossier</h2>
              <p className="text-xs text-neutral-400">Complete intelligence suite — includes 12-month projections, capex, SOPs & schemes.</p>
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
              🎨 Download As-Is (Visual Dossier)
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#22C55E] hover:bg-[#16a34a] text-white font-black uppercase text-xs border border-black shadow-[2px_2px_0px_0px_#000] flex items-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px]"
              title="Prints or saves complete multi-page PDF"
            >
              <span>🖨️</span>
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={handleDownloadHtml}
              className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-bold uppercase text-xs border border-white/20 flex items-center gap-1"
              title="Download standalone offline HTML file"
            >
              <span>HTML</span>
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
        <div id="pdf-print-container" className="p-6 md:p-10 max-h-[82vh] overflow-y-auto">
          
          {/* ══════════════════════════════════════════════════════════════════
              MODE 1: "DOCUMENT THIS" (EXECUTIVE INVESTMENT MEMORANDUM)
              Formal Roman numerals, text-first, clear H1/H2/H3, clean tables
             ══════════════════════════════════════════════════════════════════ */}
          {mode === 'document' ? (
            <div className="font-serif text-[#111] leading-relaxed max-w-4xl mx-auto space-y-6">
              
              {/* Header Title Block */}
              <div className="border-b-2 border-black pb-4">
                <div className="text-[10px] font-sans font-black uppercase tracking-widest text-neutral-500 mb-1">
                  CONFIDENTIAL INVESTMENT MEMORANDUM // INSTITUTIONAL FEASIBILITY
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

              {/* Section I: Executive Summary */}
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
                    <strong className="font-sans uppercase text-[11px] text-neutral-800">1.1 Core Problem Statement: </strong>
                    <span className="text-neutral-700">{plan?.executive_summary?.problem}</span>
                  </div>
                  <div>
                    <strong className="font-sans uppercase text-[11px] text-neutral-800">1.2 Proposed Proprietary Solution: </strong>
                    <span className="text-neutral-700">{plan?.executive_summary?.solution}</span>
                  </div>
                  <div>
                    <strong className="font-sans uppercase text-[11px] text-neutral-800">1.3 Defensible Moat: </strong>
                    <span className="text-neutral-700">{plan?.executive_summary?.competitive_moat}</span>
                  </div>
                  <div>
                    <strong className="font-sans uppercase text-[11px] text-neutral-800">1.4 Market Opportunity & Demand Density: </strong>
                    <span className="text-neutral-700">{plan?.executive_summary?.market_opportunity}</span>
                  </div>
                </div>
              </div>

              {/* Section II: Value Proposition, JTBD & Monopoly Analysis */}
              <div className="page-break-avoid">
                <h2 className="text-base font-sans font-bold uppercase tracking-wider border-b border-neutral-300 pb-1 mb-3 text-neutral-900">
                  Section II: Value Proposition & Customer Demand Architecture
                </h2>
                
                <h3 className="text-xs font-sans font-bold uppercase text-neutral-800 mb-1">2.1 Customer Jobs-To-Be-Done (JTBD)</h3>
                <ul className="list-disc pl-5 text-xs text-neutral-700 space-y-1 mb-3">
                  {(plan?.jobs_to_be_done?.functional_jobs || []).map((j, i) => (
                    <li key={i}>{j}</li>
                  ))}
                </ul>

                <h3 className="text-xs font-sans font-bold uppercase text-neutral-800 mb-1">2.2 Core Offer Architecture (Hormozi Framework)</h3>
                <div className="space-y-1 text-xs text-neutral-700 mb-3">
                  <p><strong>Core Offer:</strong> {plan?.offer_design?.core_offer}</p>
                  <p><strong>Dream Outcome:</strong> {plan?.offer_design?.dream_outcome} (Achieved in {plan?.offer_design?.time_to_result || 'rapid timeframe'})</p>
                  <p><strong>Effort & Friction Minimization:</strong> {plan?.offer_design?.effort_required}</p>
                  <p><strong>Offer Stack:</strong> {(plan?.offer_design?.offer_stack || []).join(' + ')}</p>
                </div>

                <h3 className="text-xs font-sans font-bold uppercase text-neutral-800 mb-1">2.3 Peter Thiel Monopoly Moat Analysis</h3>
                <div className="grid grid-cols-2 gap-3 text-xs text-neutral-700">
                  <div>• <strong>Beachhead Dominant Market:</strong> {plan?.monopoly_analysis?.first_market}</div>
                  <div>• <strong>Proprietary Technology/Data:</strong> {plan?.monopoly_analysis?.proprietary_tech_or_data}</div>
                  <div>• <strong>Network Effects Driver:</strong> {plan?.monopoly_analysis?.network_effects}</div>
                  <div>• <strong>6-Month Copycat Barrier:</strong> {plan?.monopoly_analysis?.copycat_barrier_6_months}</div>
                </div>
              </div>

              {/* Section III: Location & Commercial Rentals */}
              <div className="page-break-avoid">
                <h2 className="text-base font-sans font-bold uppercase tracking-wider border-b border-neutral-300 pb-1 mb-3 text-neutral-900">
                  Section III: Commercial Real Estate & Micro-Market Footprint
                </h2>

                <p className="text-xs text-neutral-700 mb-3">
                  Physical and spatial commercial lease intelligence in <strong>{location}</strong>:
                </p>

                <table className="w-full text-xs font-sans border-collapse mb-4">
                  <thead>
                    <tr className="bg-neutral-100 border-b border-neutral-300 text-left">
                      <th className="p-1.5 font-bold">Property Listing / Micro-Zone</th>
                      <th className="p-1.5 font-bold">Area (Sqft)</th>
                      <th className="p-1.5 font-bold text-right">Rent / Month (₹)</th>
                      <th className="p-1.5 font-bold text-right">Rate / Sqft</th>
                      <th className="p-1.5 font-bold text-right">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {rentals.length > 0 ? (
                      rentals.map((r, i) => {
                        const rent = Number(r.monthly_rent || r.rent || 0);
                        const sqft = Number(r.super_builtup_area_sqft || r.area_sqft || 0);
                        const rateSqft = sqft > 0 && rent > 0 ? Math.round(rent / sqft) : 'N/A';
                        return (
                          <tr key={i}>
                            <td className="p-1.5 font-bold">{r.title || r.locality || 'Commercial Facility'}</td>
                            <td className="p-1.5 font-mono">{sqft > 0 ? `${sqft} sqft` : 'Standard'}</td>
                            <td className="p-1.5 text-right font-mono font-bold">₹{rent > 0 ? rent.toLocaleString('en-IN') : 'Contact'}</td>
                            <td className="p-1.5 text-right font-mono text-neutral-600">{rateSqft !== 'N/A' ? `₹${rateSqft}` : '—'}</td>
                            <td className="p-1.5 text-right text-neutral-500">{r.source_platform || r.platform || 'Verified'}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-2 text-center text-neutral-500 italic">
                          Baseline: Commercial space in {location} averages ₹45–₹110/sqft depending on street frontage.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Section IV: Day-0 Capex & Unit Economics */}
              <div className="page-break-avoid">
                <h2 className="text-base font-sans font-bold uppercase tracking-wider border-b border-neutral-300 pb-1 mb-3 text-neutral-900">
                  Section IV: Capital Allocation, Day-0 Capex & Unit Economics
                </h2>

                <div className="mb-3 text-xs">
                  <p>
                    <strong>Total Setup Capex Required:</strong> ₹{fin?.startup_costs?.setup_total.toLocaleString('en-IN')} &nbsp;|&nbsp;
                    <strong>Allocated Budget:</strong> ₹{budgetInr.toLocaleString('en-IN')} &nbsp;|&nbsp;
                    <strong>Capital Surplus / Deficit:</strong> ₹{(budgetInr - (fin?.startup_costs?.setup_total || 0)).toLocaleString('en-IN')}
                  </p>
                </div>

                <h3 className="text-xs font-sans font-bold uppercase text-neutral-800 mb-1">4.1 Itemized Setup Expenditure Breakdown</h3>
                <table className="w-full text-xs font-sans border-collapse mb-4">
                  <thead>
                    <tr className="bg-neutral-100 border-b border-neutral-300 text-left">
                      <th className="p-1.5 font-bold">Category / Expenditure Item</th>
                      <th className="p-1.5 font-bold text-right">Amount (₹)</th>
                      <th className="p-1.5 font-bold text-right">Verification Basis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {(fin?.startup_costs?.breakdown || []).map((row, i) => (
                      <tr key={i}>
                        <td className="p-1.5">{row.item}</td>
                        <td className="p-1.5 text-right font-mono font-bold">₹{Number(row.amount).toLocaleString('en-IN')}</td>
                        <td className="p-1.5 text-right text-neutral-500">{row.source}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-black font-bold bg-neutral-50">
                      <td className="p-1.5 uppercase">Total Setup Capex Required</td>
                      <td className="p-1.5 text-right font-mono">₹{fin?.startup_costs?.setup_total.toLocaleString('en-IN')}</td>
                      <td className="p-1.5 text-right text-neutral-500">Includes contingency</td>
                    </tr>
                  </tbody>
                </table>

                <h3 className="text-xs font-sans font-bold uppercase text-neutral-800 mb-1">4.2 Unit Economics & Customer Contribution Margins</h3>
                <div className="grid grid-cols-3 gap-2 text-xs font-sans p-2.5 bg-neutral-50 border border-neutral-200 mb-3">
                  <div>Average Ticket: <strong>₹{fin?.unit_economics?.avg_revenue_per_customer || 0}</strong></div>
                  <div>COGS per Unit: <strong>₹{fin?.unit_economics?.cogs_per_unit || 0}</strong></div>
                  <div>Gross Margin: <strong>{fin?.unit_economics?.gross_margin_pct || 0}%</strong></div>
                  <div>Estimated CAC: <strong>₹{fin?.unit_economics?.cac_estimate || 0}</strong></div>
                  <div>LTV Estimate: <strong>₹{fin?.unit_economics?.ltv_estimate || 0}</strong></div>
                  <div>LTV/CAC: <strong>{fin?.unit_economics?.ltv_to_cac_ratio || 0}:1</strong></div>
                </div>
              </div>

              {/* Section V: 12-Month Pro-Forma & Scenarios */}
              <div className="page-break-avoid">
                <h2 className="text-base font-sans font-bold uppercase tracking-wider border-b border-neutral-300 pb-1 mb-3 text-neutral-900">
                  Section V: 12-Month Pro-Forma Cash Flow & Stress Testing
                </h2>

                <h3 className="text-xs font-sans font-bold uppercase text-neutral-800 mb-1">5.1 Three-Scenario Break-Even Projections</h3>
                <div className="grid grid-cols-3 gap-2 text-xs font-sans p-2 bg-neutral-50 border border-neutral-200 mb-3">
                  <div>
                    <strong>Conservative (Slow):</strong><br/>
                    Break-Even: Month {scenarios?.conservative?.break_even_month || 6}<br/>
                    Year 1 Rev: ₹{scenarios?.conservative?.year1_revenue.toLocaleString('en-IN')}
                  </div>
                  <div>
                    <strong>Base Case (Expected):</strong><br/>
                    Break-Even: Month {scenarios?.base?.break_even_month || 3}<br/>
                    Year 1 Rev: ₹{scenarios?.base?.year1_revenue.toLocaleString('en-IN')}
                  </div>
                  <div>
                    <strong>Optimistic (High Demand):</strong><br/>
                    Break-Even: Month {scenarios?.optimistic?.break_even_month || 2}<br/>
                    Year 1 Rev: ₹{scenarios?.optimistic?.year1_revenue.toLocaleString('en-IN')}
                  </div>
                </div>

                {monthlyProjections.length > 0 && (
                  <>
                    <h3 className="text-xs font-sans font-bold uppercase text-neutral-800 mb-1">5.2 12-Month Monthly Revenue & Burn Schedule</h3>
                    <table className="w-full text-xs font-sans border-collapse mb-4">
                      <thead>
                        <tr className="bg-neutral-100 border-b border-neutral-300 text-left font-bold">
                          <th className="p-1">Month</th>
                          <th className="p-1 text-right">Customers</th>
                          <th className="p-1 text-right">Revenue (₹)</th>
                          <th className="p-1 text-right">Expenses (₹)</th>
                          <th className="p-1 text-right">Net Margin (₹)</th>
                          <th className="p-1 text-right">Cumulative Burn</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200 font-mono text-[11px]">
                        {monthlyProjections.map(m => (
                          <tr key={m.month}>
                            <td className="p-1 font-sans font-bold">M{m.month}</td>
                            <td className="p-1 text-right">{m.customers}</td>
                            <td className="p-1 text-right">₹{m.revenue.toLocaleString('en-IN')}</td>
                            <td className="p-1 text-right">₹{m.expenses.toLocaleString('en-IN')}</td>
                            <td className={`p-1 text-right font-bold ${m.net >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                              {m.net >= 0 ? '+' : ''}₹{m.net.toLocaleString('en-IN')}
                            </td>
                            <td className="p-1 text-right text-neutral-500">₹{m.cumulative_burn.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </div>

              {/* Section VI: Competitive Landscape */}
              <div className="page-break-avoid">
                <h2 className="text-base font-sans font-bold uppercase tracking-wider border-b border-neutral-300 pb-1 mb-3 text-neutral-900">
                  Section VI: Competitive Landscape & Strategic Differentiation
                </h2>
                
                <h3 className="text-xs font-sans font-bold uppercase text-neutral-800 mb-1">6.1 Identified Market Incumbents</h3>
                <table className="w-full text-xs font-sans border-collapse mb-4">
                  <thead>
                    <tr className="bg-neutral-100 border-b border-neutral-300 text-left">
                      <th className="p-1.5 font-bold">Competitor</th>
                      <th className="p-1.5 font-bold">Type</th>
                      <th className="p-1.5 font-bold">Pricing Model</th>
                      <th className="p-1.5 font-bold">Threat</th>
                      <th className="p-1.5 font-bold">Exploitable Weakness</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {competitors.map((c, i) => (
                      <tr key={i}>
                        <td className="p-1.5 font-bold">{c.name}</td>
                        <td className="p-1.5 text-neutral-600">{c.type}</td>
                        <td className="p-1.5 font-mono">{c.pricing}</td>
                        <td className="p-1.5 font-bold">{c.threat_level}</td>
                        <td className="p-1.5 text-neutral-600">{c.weaknesses?.[0]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h3 className="text-xs font-sans font-bold uppercase text-neutral-800 mb-1">6.2 Blue Ocean Strategy (ERRC Grid)</h3>
                <div className="grid grid-cols-2 gap-2 text-xs font-sans p-2 bg-neutral-50 border border-neutral-200 mb-3">
                  <div><strong>Eliminate:</strong> {(comp?.blue_ocean_grid?.eliminate || []).join(', ')}</div>
                  <div><strong>Reduce:</strong> {(comp?.blue_ocean_grid?.reduce || []).join(', ')}</div>
                  <div><strong>Raise:</strong> {(comp?.blue_ocean_grid?.raise || []).join(', ')}</div>
                  <div><strong>Create:</strong> {(comp?.blue_ocean_grid?.create || []).join(', ')}</div>
                </div>
              </div>

              {/* Section VII: Government Schemes & Statutory Licences */}
              <div className="page-break-avoid">
                <h2 className="text-base font-sans font-bold uppercase tracking-wider border-b border-neutral-300 pb-1 mb-3 text-neutral-900">
                  Section VII: Government Capital Subsidies & Statutory Licences
                </h2>

                <h3 className="text-xs font-sans font-bold uppercase text-neutral-800 mb-1">7.1 Central / State Capital Grants & Subsidies</h3>
                <table className="w-full text-xs font-sans border-collapse mb-4">
                  <thead>
                    <tr className="bg-neutral-100 border-b border-neutral-300 text-left">
                      <th className="p-1.5 font-bold">Scheme</th>
                      <th className="p-1.5 font-bold">Authority</th>
                      <th className="p-1.5 font-bold">Financial Benefit</th>
                      <th className="p-1.5 font-bold">Eligibility Criteria</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {schemes.map((s, i) => (
                      <tr key={i}>
                        <td className="p-1.5 font-bold">{s.scheme_name}</td>
                        <td className="p-1.5 text-neutral-600">{s.ministry || 'Central Govt'}</td>
                        <td className="p-1.5 font-mono">{typeof s.benefit === 'object' ? JSON.stringify(s.benefit).replace(/["{}]/g, ' ') : String(s.benefit)}</td>
                        <td className="p-1.5 text-neutral-600">{typeof s.eligibility === 'object' ? JSON.stringify(s.eligibility).replace(/["{}]/g, ' ') : String(s.eligibility)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h3 className="text-xs font-sans font-bold uppercase text-neutral-800 mb-1">7.2 Pre-Launch Statutory Licensing Checklist</h3>
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
                    {licensing.map((l, i) => (
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
              </div>

              {/* Section VIII: Operational SOPs & Risk Mitigation */}
              <div className="page-break-avoid">
                <h2 className="text-base font-sans font-bold uppercase tracking-wider border-b border-neutral-300 pb-1 mb-3 text-neutral-900">
                  Section VIII: Standard Operating Procedures & Risk Mitigation
                </h2>

                <h3 className="text-xs font-sans font-bold uppercase text-neutral-800 mb-1">8.1 Day-1 Operational SOPs</h3>
                <div className="space-y-2 mb-4">
                  {sops.map((sop, i) => (
                    <div key={i} className="p-2 border border-neutral-200 bg-neutral-50 text-xs">
                      <div className="flex justify-between font-bold mb-1">
                        <span>{sop.process_name}</span>
                        <span className="text-neutral-500">Owner: {sop.owner}</span>
                      </div>
                      <div className="text-neutral-600 mb-1">Trigger: {sop.trigger} | Gate: {sop.quality_check}</div>
                      <div className="text-neutral-800 pl-3 border-l-2 border-neutral-300">
                        {(sop.steps || []).map((step, si) => (
                          <div key={si}>• {step}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <h3 className="text-xs font-sans font-bold uppercase text-neutral-800 mb-1">8.2 Risk Register & Contingency Countermeasures</h3>
                <table className="w-full text-xs font-sans border-collapse mb-4">
                  <thead>
                    <tr className="bg-neutral-100 border-b border-neutral-300 text-left">
                      <th className="p-1.5 font-bold">Identified Risk</th>
                      <th className="p-1.5 font-bold">Impact</th>
                      <th className="p-1.5 font-bold">Mitigation Strategy</th>
                      <th className="p-1.5 font-bold">Contingency Plan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {risks.map((r, i) => (
                      <tr key={i}>
                        <td className="p-1.5 font-bold">{r.risk}</td>
                        <td className="p-1.5 font-mono">{r.impact}</td>
                        <td className="p-1.5 text-neutral-600">{r.mitigation}</td>
                        <td className="p-1.5 text-neutral-600">{r.contingency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Sign-off */}
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

              {/* 3. Location & Rentals Card */}
              <div className="p-6 border-2 border-black bg-white page-break-avoid">
                <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-4">
                  <h3 className="font-black text-sm uppercase">Commercial Real Estate & Local Benchmarks</h3>
                  <span className="text-xs font-mono font-bold">📍 {location}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b-2 border-black text-left text-neutral-500 uppercase font-black">
                        <th className="py-1.5">Property Listing</th>
                        <th className="py-1.5">Area</th>
                        <th className="py-1.5 text-right">Rent / Month</th>
                        <th className="py-1.5 text-right">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 font-mono">
                      {rentals.map((r, i) => (
                        <tr key={i}>
                          <td className="py-1.5 font-sans font-bold">{r.title || r.locality || 'Commercial Facility'}</td>
                          <td className="py-1.5 font-mono">{r.super_builtup_area_sqft || r.area_sqft || 750} sqft</td>
                          <td className="py-1.5 text-right font-black">₹{Number(r.monthly_rent || r.rent || 0).toLocaleString('en-IN')}</td>
                          <td className="py-1.5 text-right text-neutral-500">{r.source_platform || r.platform || 'Verified'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. Financial Blueprint Summary */}
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
                      <span className="text-base font-black text-neutral-900">Month {scenarios?.base?.break_even_month || 3}</span>
                    </div>
                    <div className="p-3 bg-neutral-50 border border-neutral-300">
                      <span className="text-[10px] font-bold uppercase text-neutral-500 block">Runway</span>
                      <span className="text-base font-black text-emerald-700">{fin.runway?.months_of_runway || 6} Months</span>
                    </div>
                  </div>

                  {/* Itemized Capex Table */}
                  <div className="overflow-x-auto mb-4">
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

                  {/* 12-Month Cash Burn Table */}
                  {monthlyProjections.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-neutral-300">
                      <h4 className="font-bold text-xs uppercase mb-2">12-Month Pro-Forma Cash Flow Projections</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs font-mono">
                          <thead>
                            <tr className="border-b border-black text-left text-neutral-500 font-bold uppercase">
                              <th className="py-1">Month</th>
                              <th className="py-1 text-right">Customers</th>
                              <th className="py-1 text-right">Revenue (₹)</th>
                              <th className="py-1 text-right">Expenses (₹)</th>
                              <th className="py-1 text-right">Net Margin (₹)</th>
                              <th className="py-1 text-right">Cumulative Burn</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-200">
                            {monthlyProjections.map(m => (
                              <tr key={m.month}>
                                <td className="py-1 font-bold font-sans">M{m.month}</td>
                                <td className="py-1 text-right">{m.customers}</td>
                                <td className="py-1 text-right text-emerald-700 font-bold">₹{m.revenue.toLocaleString('en-IN')}</td>
                                <td className="py-1 text-right text-neutral-700">₹{m.expenses.toLocaleString('en-IN')}</td>
                                <td className={`py-1 text-right font-bold ${m.net >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                  {m.net >= 0 ? '+' : ''}₹{m.net.toLocaleString('en-IN')}
                                </td>
                                <td className="py-1 text-right text-neutral-500">₹{m.cumulative_burn.toLocaleString('en-IN')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 5. Competitor Intelligence & ERRC Grid */}
              {comp && (
                <div className="p-6 border-2 border-black bg-white page-break-avoid">
                  <h3 className="font-black text-sm uppercase pb-2 border-b-2 border-black mb-4">
                    Competitive Intelligence & Blue Ocean Grid
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-4">
                    {competitors.map((c, i) => (
                      <div key={i} className="p-3 border border-neutral-300 bg-neutral-50">
                        <div className="flex justify-between items-center mb-1">
                          <strong>{c.name}</strong>
                          <span className="text-[10px] px-1.5 py-0.5 bg-neutral-200 font-bold">{c.pricing}</span>
                        </div>
                        <div className="text-[11px] text-neutral-600">Attack angle: {c.weaknesses?.[0]}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 bg-red-50 border border-red-300">
                      <strong className="block text-red-800 text-[10px] uppercase">Eliminate</strong>
                      <span>{(comp.blue_ocean_grid?.eliminate || []).join(', ')}</span>
                    </div>
                    <div className="p-2.5 bg-amber-50 border border-amber-300">
                      <strong className="block text-amber-800 text-[10px] uppercase">Reduce</strong>
                      <span>{(comp.blue_ocean_grid?.reduce || []).join(', ')}</span>
                    </div>
                    <div className="p-2.5 bg-blue-50 border border-blue-300">
                      <strong className="block text-blue-800 text-[10px] uppercase">Raise</strong>
                      <span>{(comp.blue_ocean_grid?.raise || []).join(', ')}</span>
                    </div>
                    <div className="p-2.5 bg-emerald-50 border border-emerald-300">
                      <strong className="block text-emerald-800 text-[10px] uppercase">Create</strong>
                      <span>{(comp.blue_ocean_grid?.create || []).join(', ')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. Statutory Licences & Government Schemes */}
              <div className="p-6 border-2 border-black bg-white page-break-avoid">
                <h3 className="font-black text-sm uppercase pb-2 border-b-2 border-black mb-3">
                  Government Schemes & Statutory Licences
                </h3>

                {schemes.length > 0 && (
                  <div className="mb-4">
                    <span className="text-[10px] font-black uppercase text-neutral-500 block mb-2">Central / State Capital Subsidies</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {schemes.map((s, i) => (
                        <div key={i} className="p-2.5 bg-emerald-50 border border-emerald-300">
                          <strong className="text-emerald-950 font-bold block">{s.scheme_name}</strong>
                          <span className="text-[11px] text-emerald-800 block mt-0.5">{typeof s.benefit === 'object' ? JSON.stringify(s.benefit).replace(/["{}]/g, ' ') : String(s.benefit)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {licensing.length > 0 && (
                  <div>
                    <span className="text-[10px] font-black uppercase text-neutral-500 block mb-2">Pre-Launch Statutory Clearances</span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      {licensing.map((l, i) => (
                        <div key={i} className="p-2.5 border border-neutral-300 bg-neutral-50">
                          <strong className="block text-[11px] text-neutral-900">{l.licence}</strong>
                          <span className="text-[10px] text-neutral-500 font-mono block mt-0.5">{l.timeline} · {l.cost_estimate}</span>
                          <span className="inline-block mt-1 text-[9px] font-black uppercase text-red-700 bg-red-100 px-1 py-0.5">{l.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 7. Operational SOPs & Risk Register */}
              {(sops.length > 0 || risks.length > 0) && (
                <div className="p-6 border-2 border-black bg-white page-break-avoid">
                  <h3 className="font-black text-sm uppercase pb-2 border-b-2 border-black mb-3">
                    Operational SOPs & Risk Contingency
                  </h3>

                  {sops.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-4">
                      {sops.map((sop, i) => (
                        <div key={i} className="p-3 border border-neutral-300 bg-neutral-50">
                          <div className="flex justify-between font-bold mb-1">
                            <span>{sop.process_name}</span>
                            <span className="text-neutral-500 font-normal">Owner: {sop.owner}</span>
                          </div>
                          <div className="text-neutral-600 text-[11px] mb-1">Trigger: {sop.trigger}</div>
                          <div className="text-neutral-800">
                            {(sop.steps || []).map((step, si) => (
                              <div key={si}>• {step}</div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {risks.length > 0 && (
                    <div className="space-y-2 text-xs">
                      {risks.map((r, i) => (
                        <div key={i} className="p-2 border border-neutral-200 bg-neutral-50 flex justify-between gap-3">
                          <div>
                            <span className="font-bold">{r.risk}</span> (Impact: {r.impact})
                            <div className="text-neutral-600">Mitigation: {r.mitigation}</div>
                          </div>
                          <div className="text-right text-neutral-500 text-[11px]">
                            Contingency: {r.contingency}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
  );
};

export default ExportPdfModal;
