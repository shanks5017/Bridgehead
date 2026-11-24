import React from 'react';
import { FullBusinessReport } from '../../types';

interface Props {
  comp: NonNullable<FullBusinessReport['competitive_analysis']>;
  location: string;
  businessType: string;
}

export const CompetitorsLongevityTab: React.FC<Props> = ({ comp, location, businessType }) => {
  const matrix = comp.competitor_matrix || [];
  const gaps = comp.competitive_gaps || [];
  const bog = comp.blue_ocean_grid || { eliminate: [], reduce: [], raise: [], create: [] };
  const ff = comp.five_forces || {};
  const pos = comp.positioning_recommendation || {
    positioning_statement: '',
    price_positioning: 'Mid-Market',
    differentiation_axes: []
  };

  const threatColor = (threat: string) => {
    const t = (threat || '').toUpperCase();
    if (t.includes('HIGH')) return 'bg-red-100 text-red-800 border-red-300';
    if (t.includes('MED')) return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  };

  return (
    <div className="space-y-6">
      {/* ── 1. Strategic Positioning Statement ─────────────────────────── */}
      <div className="bg-[#141414] text-white p-6 border-2 border-black shadow-[4px_4px_0px_0px_#000]">
        <div className="text-[10px] font-black uppercase text-[#22C55E] tracking-wider mb-1">
          Market Positioning Recommendation
        </div>
        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-2">
          {pos.positioning_statement || `The premier defensible ${businessType} in ${location}`}
        </h2>
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="px-3 py-1 bg-white/10 text-xs font-mono border border-white/20">
            Price Tier: <strong className="text-white">{pos.price_positioning}</strong>
          </span>
          {(pos.differentiation_axes || []).map((axis, i) => (
            <span key={i} className="px-3 py-1 bg-[#22C55E] text-white text-xs font-bold">
              ✦ {axis}
            </span>
          ))}
        </div>
      </div>

      {/* ── 2. Local Competitor Intelligence Matrix ───────────────────── */}
      <div className="bg-white border-2 border-black p-6 shadow-[3px_3px_0px_0px_#000]">
        <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-5">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚔️</span>
            <div>
              <h3 className="font-black uppercase text-base tracking-tight">Direct & Indirect Competitor Matrix</h3>
              <p className="text-xs text-neutral-500">Identified market incumbents in {location} and their vulnerabilities.</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 bg-black text-white">
            {matrix.length} Competitors Mapped
          </span>
        </div>

        <div className="space-y-4">
          {matrix.map((c, i) => (
            <div key={i} className="p-4 border-2 border-black bg-[#FAFAFA] hover:bg-white transition-all shadow-[2px_2px_0px_0px_#000]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-black text-base text-neutral-900 uppercase">{c.name}</h4>
                  <span className="px-2 py-0.5 bg-neutral-200 text-neutral-800 text-[10px] font-bold uppercase">
                    {c.type}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold border ${threatColor(c.threat_level)}`}>
                    Threat: {c.threat_level}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-neutral-600">
                  <span>Pricing: <strong className="text-neutral-900">{c.pricing}</strong></span>
                  <span>·</span>
                  <span>Share: <strong className="text-neutral-900">{c.market_share_estimate}</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2 border-t border-neutral-200">
                <div className="p-2.5 bg-emerald-50/60 border border-emerald-200">
                  <span className="text-[10px] font-bold uppercase text-emerald-800 block mb-1">Their Strengths</span>
                  <ul className="space-y-0.5 text-neutral-800">
                    {(c.strengths || []).map((s, si) => (
                      <li key={si}>• {s}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-2.5 bg-red-50/60 border border-red-200">
                  <span className="text-[10px] font-bold uppercase text-red-800 block mb-1">Their Weaknesses (Your Attack Angle)</span>
                  <ul className="space-y-0.5 text-neutral-800">
                    {(c.weaknesses || []).map((w, wi) => (
                      <li key={wi}>• {w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. Blue Ocean Strategy Grid (Kim & Mauborgne) ─────────────── */}
      <div className="bg-white border-2 border-black p-6 shadow-[3px_3px_0px_0px_#000]">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-black mb-5">
          <span className="text-xl">🌊</span>
          <div>
            <h3 className="font-black uppercase text-base tracking-tight">Blue Ocean Strategy Grid (ERRC)</h3>
            <p className="text-xs text-neutral-500">Break the value-cost trade-off by actively choosing what NOT to do.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-red-50 border-2 border-red-200">
            <span className="text-xs font-black uppercase text-red-800 block mb-2">🚫 Eliminate (Cut Entirely)</span>
            <ul className="space-y-1 text-xs text-red-950">
              {(bog.eliminate || []).map((item, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="font-bold">✗</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-amber-50 border-2 border-amber-200">
            <span className="text-xs font-black uppercase text-amber-800 block mb-2">📉 Reduce (Below Standard)</span>
            <ul className="space-y-1 text-xs text-amber-950">
              {(bog.reduce || []).map((item, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="font-bold">↓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-blue-50 border-2 border-blue-200">
            <span className="text-xs font-black uppercase text-blue-800 block mb-2">📈 Raise (Above Standard)</span>
            <ul className="space-y-1 text-xs text-blue-950">
              {(bog.raise || []).map((item, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="font-bold">↑</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-emerald-50 border-2 border-emerald-200">
            <span className="text-xs font-black uppercase text-emerald-800 block mb-2">✨ Create (Never Offered in Area)</span>
            <ul className="space-y-1 text-xs text-emerald-950">
              {(bog.create || []).map((item, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="font-bold">★</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── 4. Unexploited Competitive Gaps ───────────────────────────── */}
      <div className="bg-white border-2 border-black p-6 shadow-[3px_3px_0px_0px_#000]">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-black mb-5">
          <span className="text-xl">💡</span>
          <div>
            <h3 className="font-black uppercase text-base tracking-tight">Unmet Market Opportunities in {location}</h3>
            <p className="text-xs text-neutral-500">Structural service gaps left wide open by existing businesses.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gaps.map((g, i) => (
            <div key={i} className="p-4 bg-neutral-50 border border-neutral-300">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-black text-sm uppercase text-neutral-900">{g.gap}</span>
                <span className="px-2 py-0.5 bg-black text-white text-[10px] font-bold">
                  Opportunity: {g.opportunity_size}
                </span>
              </div>
              <p className="text-xs text-neutral-600 leading-relaxed">
                <strong className="text-neutral-900">How to capture:</strong> {g.how_to_exploit}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. Michael Porter Five Forces ─────────────────────────────── */}
      {Object.keys(ff).length > 0 && (
        <div className="bg-white border-2 border-black p-6 shadow-[3px_3px_0px_0px_#000]">
          <h3 className="font-black uppercase text-base tracking-tight pb-3 border-b-2 border-black mb-4">
            Porter's Five Forces Industry Health Check
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {Object.entries(ff).map(([force, desc]) => (
              <div key={force} className="p-3 bg-neutral-50 border border-neutral-200">
                <span className="text-[10px] font-black uppercase text-neutral-500 block mb-1">
                  {force.replace(/_/g, ' ')}
                </span>
                <p className="text-xs font-medium text-neutral-800">{String(desc)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitorsLongevityTab;
