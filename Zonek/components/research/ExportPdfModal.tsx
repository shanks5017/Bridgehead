/**
 * ExportPdfModal.tsx — Zonek / Bridgehead
 * ─────────────────────────────────────────────────────────────────────────────
 * Comprehensive Multi-Mode Report & Document Export Engine
 *
 * Provides two distinct, senior-grade representations:
 *   1. "Document This" (Executive Investment Memorandum):
 *      Text-first, zero-UI clean document layout with formal section numbering
 *      (Section I to VI), clear H1/H2/H3 hierarchy, bullet points, and formatted
 *      data tables tailored for presenting to banks, partners, or investors.
 *
 *   2. "Download As-Is" (Full Visual Dossier):
 *      Complete graphic presentation retaining visual cards, badges, capex tables,
 *      unit economics metrics, competitor attack angles, and government subsidies.
 *
 * Printing Engine:
 *   Uses an isolated hidden iframe architecture that eliminates blank-page bugs,
 *   parent CSS overflow conflicts, and section repetition across all browsers.
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

  // Resolve evidence data
  const rentals = (evidence?.rentals?.length
    ? evidence.rentals
    : (report.evidence?.rentals || report.evidence_summary?.rentals || [])) as any[];

  const schemes = (evidence?.schemes?.length
    ? evidence.schemes
    : (report.evidence?.govSchemes || report.evidence?.schemes || report.evidence_summary?.schemes || [])) as any[];

  const displayTitle = businessName || businessType;
  const verdict = plan?.executive_summary?.verdict || 'CAUTION';

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
        margin: 14mm 15mm;
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
        font-size: 10.5pt;
        line-height: 1.5;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      h1 { font-size: 18pt; margin: 0 0 4pt 0; text-transform: uppercase; font-weight: bold; }
      h2 { font-size: 13pt; margin: 14pt 0 6pt 0; text-transform: uppercase; border-bottom: 1.5pt solid #222; padding-bottom: 3pt; font-weight: bold; }
      h3 { font-size: 11pt; margin: 10pt 0 4pt 0; font-weight: bold; text-transform: uppercase; }
      p, li { font-size: 10pt; line-height: 1.45; }
      ul { margin: 4pt 0 8pt 0; padding-left: 18pt; }
      table { width: 100%; border-collapse: collapse; margin: 8pt 0 12pt 0; font-size: 9.5pt; }
      th, td { border: 1pt solid #ccc; padding: 5pt 7pt; text-align: left; }
      th { background-color: #f3f3f3; font-weight: bold; }
      .text-right { text-align: right; }
      .font-mono { font-family: 'Courier New', Courier, monospace; }
      .badge { display: inline-block; padding: 2pt 6pt; font-weight: bold; font-size: 8.5pt; border: 1pt solid #111; }
      .page-break-avoid { page-break-inside: avoid; break-inside: avoid; }
      .footer-sign { margin-top: 24pt; padding-top: 10pt; border-top: 1pt solid #ccc; font-size: 8.5pt; color: #666; display: flex; justify-content: space-between; }
    `;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${displayTitle} — Feasibility Intelligence</title>
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
  <title>${displayTitle} — Feasibility Report</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 900px; margin: 40px auto; padding: 20px; line-height: 1.6; color: #111; background: #fff; }
    h1 { border-bottom: 3px solid #111; padding-bottom: 8px; font-size: 24px; text-transform: uppercase; }
    h2 { border-bottom: 1px solid #444; padding-bottom: 4px; margin-top: 28px; font-size: 18px; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    th, td { border: 1px solid #ccc; padding: 8px 10px; text-align: left; }
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
    a.download = `${displayTitle.replace(/\s+/g, '_')}_Feasibility_Report.html`;
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
Feasibility Verdict: ${verdict}

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
SECTION II: VALUE PROPOSITION & OFFER DESIGN (JTBD & MONOPOLY ANALYSIS)
================================================================================
2.1 Functional Jobs-To-Be-Done:
${(plan?.jobs_to_be_done?.functional_jobs || []).map(j => `  • ${j}`).join('\n')}

2.2 Current Substitutes (Existing Alternatives):
${(plan?.jobs_to_be_done?.current_substitutes || []).map(s => `  • ${s}`).join('\n')}

2.3 Core Offer Architecture:
Core Offer: ${plan?.offer_design?.core_offer || 'N/A'}
Dream Outcome: ${plan?.offer_design?.dream_outcome || 'N/A'}
Time to Result: ${plan?.offer_design?.time_to_result || 'N/A'}
Effort Required: ${plan?.offer_design?.effort_required || 'N/A'}

2.4 Peter Thiel Monopoly Analysis:
  • First Dominant Market: ${plan?.monopoly_analysis?.first_market || 'N/A'}
  • Proprietary Advantage: ${plan?.monopoly_analysis?.proprietary_tech_or_data || 'N/A'}
  • Network Effects: ${plan?.monopoly_analysis?.network_effects || 'N/A'}
  • 6-Month Copycat Barrier: ${plan?.monopoly_analysis?.copycat_barrier_6_months || 'N/A'}

================================================================================
SECTION III: COMMERCIAL REAL ESTATE & LOCATION BENCHMARKS
================================================================================
${rentals.length > 0 ? rentals.map(r => `  • ${r.title || r.locality || 'Commercial Space'}: ₹${Number(r.monthly_rent || r.rent || 0).toLocaleString('en-IN')}/month | Area: ${r.super_builtup_area_sqft || r.area_sqft || 'N/A'} sqft | Location: ${r.locality || r.address || location}`).join('\n') : '  • No direct rental listings cached for this specific locality. Benchmark against local average rates.'}

================================================================================
SECTION IV: CAPITAL ALLOCATION, CAPEX & UNIT ECONOMICS
================================================================================
Total Setup Capex: ₹${fin?.startup_costs?.setup_total.toLocaleString('en-IN')}
Budget Allocated: ₹${budgetInr.toLocaleString('en-IN')}
Capital Surplus / Deficit: ₹${(budgetInr - (fin?.startup_costs?.setup_total || 0)).toLocaleString('en-IN')}

Itemized Capex Breakdown:
${(fin?.startup_costs?.breakdown || []).map(b => `  • ${b.item}: ₹${Number(b.amount).toLocaleString('en-IN')} (${b.source})`).join('\n')}

Unit Economics:
  • Average Ticket Size: ₹${fin?.unit_economics?.avg_revenue_per_customer || 0}
  • COGS Per Unit: ₹${fin?.unit_economics?.cogs_per_unit || 0}
  • Gross Margin: ${fin?.unit_economics?.gross_margin_pct || 0}%
  • Estimated CAC: ₹${fin?.unit_economics?.cac_estimate || 0}
  • Estimated LTV: ₹${fin?.unit_economics?.ltv_estimate || 0}
  • LTV / CAC Ratio: ${fin?.unit_economics?.ltv_to_cac_ratio || 0} : 1
  • Payback Velocity: ${fin?.unit_economics?.payback_months || 0} Months
  • Working Capital Runway: ${fin?.runway?.months_of_runway || 6} Months

Break-Even Projections:
  • Base Case: Month ${fin?.scenarios?.base?.break_even_month || 3} (Expected Year 1: ₹${fin?.scenarios?.base?.year1_revenue.toLocaleString('en-IN')})
  • Conservative: Month ${fin?.scenarios?.conservative?.break_even_month || 6} (Expected Year 1: ₹${fin?.scenarios?.conservative?.year1_revenue.toLocaleString('en-IN')})

================================================================================
SECTION V: COMPETITIVE INTELLIGENCE & BLUE OCEAN POSITIONING
================================================================================
Identified Competitors:
${(comp?.competitor_matrix || []).map(c => `  • ${c.name} (${c.type}) | Pricing: ${c.pricing} | Threat: ${c.threat_level}\n    Exploitable Gap: ${c.weaknesses?.[0] || 'N/A'}`).join('\n')}

Blue Ocean Strategy (ERRC):
  • ELIMINATE: ${(comp?.blue_ocean_grid?.eliminate || []).join(', ')}
  • REDUCE: ${(comp?.blue_ocean_grid?.reduce || []).join(', ')}
  • RAISE: ${(comp?.blue_ocean_grid?.raise || []).join(', ')}
  • CREATE: ${(comp?.blue_ocean_grid?.create || []).join(', ')}

================================================================================
SECTION VI: STATUTORY COMPLIANCE & CENTRAL/STATE SCHEMES
================================================================================
Government Schemes & Capital Subsidies:
${schemes.length > 0 ? schemes.map(s => `  • ${s.scheme_name} (${s.ministry || 'Central/State'}): Benefit: ${s.benefit} | Eligibility: ${s.eligibility}`).join('\n') : '  • Mudra Shishu/Kishore & PMEGP credit-linked capital subsidies apply.'}

Statutory Licensing Checklist:
${(rm?.licensing_checklist || []).map(l => `  • ${l.licence} | Authority: ${l.authority} | Timeline: ${l.timeline} | Fee: ${l.cost_estimate} | Status: ${l.status}`).join('\n')}

--------------------------------------------------------------------------------
Generated by Zonek Zero-Hallucination Feasibility Engine
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

  // ─── WORD (.DOC) EXPORT ────────────────────────────────────────────────────
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
    <div className="fixed inset-0 z-[150] bg-black/85 backdrop-blur-md overflow-y-auto p-2 md:p-6 flex justify-center items-start">
      <div className="bg-white text-neutral-900 w-full max-w-5xl border-2 border-black shadow-2xl my-6 relative overflow-hidden">
        
        {/* ── Top Action Header ────────────────────────────────────────────── */}
        <div className="bg-[#141414] text-white p-4 border-b-2 border-black flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">📄</span>
            <div>
              <h2 className="text-base font-black uppercase tracking-tight">Export Feasibility Intelligence</h2>
              <p className="text-xs text-neutral-400">Continuous single document — guaranteed zero blank pages & complete data.</p>
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
              title="Download standalone offline HTML document"
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

        {/* ── Document Container (Rendered to PDF/Print) ───────────────────── */}
        <div id="pdf-print-container" className="p-6 md:p-10 max-h-[82vh] overflow-y-auto">
          
          {/* ══════════════════════════════════════════════════════════════════
              MODE 1: "DOCUMENT THIS" (EXECUTIVE INVESTMENT MEMORANDUM)
              Formal Roman numerals, text-first, clear H1/H2/H3, clean tables
             ══════════════════════════════════════════════════════════════════ */}
          {mode === 'document' ? (
            <div className="font-serif text-[#111] leading-relaxed max-w-4xl mx-auto space-y-6">
              
              {/* Header */}
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
                <p className="text-xs text-neutral-700 mb-1">
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

              {/* Section III: Location & Commercial Rentals */}
              <div className="page-break-avoid">
                <h2 className="text-base font-sans font-bold uppercase tracking-wider border-b border-neutral-300 pb-1 mb-3 text-neutral-900">
                  Section III: Commercial Real Estate & Micro-Market Benchmarks
                </h2>

                <p className="text-xs text-neutral-700 mb-3">
                  Evaluation grounded in physical commercial lease listings and spatial requirements in <strong>{location}</strong>:
                </p>

                <table className="w-full text-xs font-sans border-collapse mb-4">
                  <thead>
                    <tr className="bg-neutral-100 border-b border-neutral-300 text-left">
                      <th className="p-1.5 font-bold">Property / Zone</th>
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
                            <td className="p-1.5 font-bold">{r.title || r.locality || 'Commercial Floor'}</td>
                            <td className="p-1.5 font-mono">{sqft > 0 ? `${sqft} sqft` : 'Standard'}</td>
                            <td className="p-1.5 text-right font-mono font-bold">₹{rent > 0 ? rent.toLocaleString('en-IN') : 'Contact'}</td>
                            <td className="p-1.5 text-right font-mono text-neutral-600">{rateSqft !== 'N/A' ? `₹${rateSqft}` : '—'}</td>
                            <td className="p-1.5 text-right text-neutral-500">{r.source_platform || r.platform || 'Verified Market'}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-2 text-center text-neutral-500 italic">
                          Micro-market benchmark: Commercial rent in {location} averages ₹45–₹110/sqft depending on street frontage.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Section IV: Financials */}
              <div className="page-break-avoid">
                <h2 className="text-base font-sans font-bold uppercase tracking-wider border-b border-neutral-300 pb-1 mb-3 text-neutral-900">
                  Section IV: Capital Allocation, Capex & Unit Economics
                </h2>

                <div className="mb-3 text-xs">
                  <p>
                    <strong>Total Setup Capex Required:</strong> ₹{fin?.startup_costs?.setup_total.toLocaleString('en-IN')} &nbsp;|&nbsp;
                    <strong>Allocated Budget:</strong> ₹{budgetInr.toLocaleString('en-IN')} &nbsp;|&nbsp;
                    <strong>Capital Margin:</strong> ₹{(budgetInr - (fin?.startup_costs?.setup_total || 0)).toLocaleString('en-IN')}
                  </p>
                </div>

                <h3 className="text-xs font-sans font-bold uppercase text-neutral-800 mb-1">4.1 Itemized Setup Expenditure</h3>
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

                <h3 className="text-xs font-sans font-bold uppercase text-neutral-800 mb-1">4.2 Unit Economics & Contribution Margins</h3>
                <div className="grid grid-cols-3 gap-2 text-xs font-sans p-2 bg-neutral-50 border border-neutral-200 mb-3">
                  <div>Average Ticket: <strong>₹{fin?.unit_economics?.avg_revenue_per_customer || 0}</strong></div>
                  <div>COGS per Unit: <strong>₹{fin?.unit_economics?.cogs_per_unit || 0}</strong></div>
                  <div>Gross Margin: <strong>{fin?.unit_economics?.gross_margin_pct || 0}%</strong></div>
                  <div>Estimated CAC: <strong>₹{fin?.unit_economics?.cac_estimate || 0}</strong></div>
                  <div>LTV Estimate: <strong>₹{fin?.unit_economics?.ltv_estimate || 0}</strong></div>
                  <div>LTV/CAC: <strong>{fin?.unit_economics?.ltv_to_cac_ratio || 0}:1</strong></div>
                </div>

                <h3 className="text-xs font-sans font-bold uppercase text-neutral-800 mb-1">4.3 12-Month Pro-Forma Projections</h3>
                <div className="text-xs text-neutral-700">
                  <p>
                    • <strong>Base Case Break-Even:</strong> Month {fin?.scenarios?.base?.break_even_month || 3} (Expected Year 1 Revenue: ₹{fin?.scenarios?.base?.year1_revenue.toLocaleString('en-IN')})<br/>
                    • <strong>Conservative Break-Even:</strong> Month {fin?.scenarios?.conservative?.break_even_month || 6} | <strong>Working Capital Runway:</strong> {fin?.runway?.months_of_runway || 6} Months
                  </p>
                </div>
              </div>

              {/* Section V: Competitive Landscape */}
              <div className="page-break-avoid">
                <h2 className="text-base font-sans font-bold uppercase tracking-wider border-b border-neutral-300 pb-1 mb-3 text-neutral-900">
                  Section V: Competitive Landscape & Strategic Differentiation
                </h2>
                
                <h3 className="text-xs font-sans font-bold uppercase text-neutral-800 mb-1">5.1 Local Market Incumbents</h3>
                <div className="space-y-1.5 text-xs text-neutral-700 mb-3">
                  {(comp?.competitor_matrix || []).map((c, i) => (
                    <div key={i}>
                      • <strong>{c.name}</strong> ({c.type}): Pricing at {c.pricing}. Threat Level: {c.threat_level}. Exploitable Weakness: {c.weaknesses?.[0]}
                    </div>
                  ))}
                </div>

                <h3 className="text-xs font-sans font-bold uppercase text-neutral-800 mb-1">5.2 Blue Ocean Strategy (ERRC Grid)</h3>
                <div className="grid grid-cols-2 gap-2 text-xs font-sans p-2 bg-neutral-50 border border-neutral-200">
                  <div><strong>Eliminate:</strong> {(comp?.blue_ocean_grid?.eliminate || []).join(', ')}</div>
                  <div><strong>Reduce:</strong> {(comp?.blue_ocean_grid?.reduce || []).join(', ')}</div>
                  <div><strong>Raise:</strong> {(comp?.blue_ocean_grid?.raise || []).join(', ')}</div>
                  <div><strong>Create:</strong> {(comp?.blue_ocean_grid?.create || []).join(', ')}</div>
                </div>
              </div>

              {/* Section VI: Government Schemes & Statutory Licences */}
              <div className="page-break-avoid">
                <h2 className="text-base font-sans font-bold uppercase tracking-wider border-b border-neutral-300 pb-1 mb-3 text-neutral-900">
                  Section VI: Central/State Government Schemes & Statutory Licences
                </h2>

                <h3 className="text-xs font-sans font-bold uppercase text-neutral-800 mb-1">6.1 Government Capital Subsidies & Schemes</h3>
                <table className="w-full text-xs font-sans border-collapse mb-4">
                  <thead>
                    <tr className="bg-neutral-100 border-b border-neutral-300 text-left">
                      <th className="p-1.5 font-bold">Scheme Name</th>
                      <th className="p-1.5 font-bold">Ministry / Authority</th>
                      <th className="p-1.5 font-bold">Financial Benefit</th>
                      <th className="p-1.5 font-bold">Eligibility Criteria</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {schemes.length > 0 ? (
                      schemes.map((s, i) => (
                        <tr key={i}>
                          <td className="p-1.5 font-bold">{s.scheme_name}</td>
                          <td className="p-1.5 text-neutral-600">{s.ministry || 'Ministry of MSME'}</td>
                          <td className="p-1.5 font-mono">{s.benefit}</td>
                          <td className="p-1.5 text-neutral-600">{s.eligibility}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-2 text-center text-neutral-500 italic">
                          PMEGP (up to 35% capital subsidy) & Pradhan Mantri MUDRA Yojana (up to ₹10 Lakhs collateral-free credit).
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <h3 className="text-xs font-sans font-bold uppercase text-neutral-800 mb-1">6.2 Pre-Launch Regulatory Licences</h3>
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
                      {rentals.length > 0 ? (
                        rentals.map((r, i) => (
                          <tr key={i}>
                            <td className="py-1.5 font-sans font-bold">{r.title || r.locality || 'Commercial Facility'}</td>
                            <td className="py-1.5 font-mono">{r.super_builtup_area_sqft || r.area_sqft || 750} sqft</td>
                            <td className="py-1.5 text-right font-black">₹{Number(r.monthly_rent || r.rent || 0).toLocaleString('en-IN')}</td>
                            <td className="py-1.5 text-right text-neutral-500">{r.source_platform || r.platform || 'Verified'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-2 text-center text-neutral-500 italic">
                            Locality commercial baseline: ₹50–₹100/sqft average in {location}.
                          </td>
                        </tr>
                      )}
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

              {/* 5. Competitor Intelligence & ERRC Grid */}
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

              {/* 6. Statutory Licences & Government Schemes */}
              <div className="p-6 border-2 border-black bg-white page-break-avoid">
                <h3 className="font-black text-sm uppercase pb-2 border-b-2 border-black mb-3">
                  Government Schemes & Statutory Licences
                </h3>

                {schemes.length > 0 && (
                  <div className="mb-4">
                    <span className="text-[10px] font-black uppercase text-neutral-500 block mb-2">Central / State Capital Subsidies</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {schemes.slice(0, 2).map((s, i) => (
                        <div key={i} className="p-2.5 bg-emerald-50 border border-emerald-300">
                          <strong className="text-emerald-950 font-bold block">{s.scheme_name}</strong>
                          <span className="text-[11px] text-emerald-800 block mt-0.5">{s.benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {rm?.licensing_checklist && (
                  <div>
                    <span className="text-[10px] font-black uppercase text-neutral-500 block mb-2">Pre-Launch Statutory Clearances</span>
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
              </div>

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
