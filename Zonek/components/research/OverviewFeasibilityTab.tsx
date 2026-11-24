import React from 'react';
import { FullBusinessReport } from '../../types';

interface Props {
  plan: NonNullable<FullBusinessReport['business_plan']>;
  businessName?: string;
  businessType: string;
  location: string;
  budgetInr: number;
}

const verdictStyle = (v: 'GO' | 'CAUTION' | 'STOP' | undefined) => {
  if (v === 'GO') return { bg: 'bg-[#22C55E]', text: 'text-white', badge: 'bg-[#15803D]' };
  if (v === 'CAUTION') return { bg: 'bg-[#FBBF24]', text: 'text-[#141414]', badge: 'bg-[#B45309] text-white' };
  return { bg: 'bg-[#EF4444]', text: 'text-white', badge: 'bg-[#B91C1C]' };
};

export const OverviewFeasibilityTab: React.FC<Props> = ({
  plan,
  businessName,
  businessType,
  location,
  budgetInr,
}) => {
  const es = plan.executive_summary || {
    verdict: 'CAUTION',
    one_liner: 'Feasibility Analysis for ' + businessType,
    verdict_rationale: 'Review the market indicators below to evaluate risk and opportunity.',
    problem: 'Market problem under evaluation',
    solution: 'Proposed business model',
    competitive_moat: 'Local positioning and service differentiation',
    market_opportunity: 'Target area demand density'
  };

  const jtbd = plan.jobs_to_be_done || {
    functional_jobs: [],
    social_jobs: [],
    emotional_jobs: [],
    current_substitutes: [],
    desired_outcomes: [],
  };

  const offer = plan.offer_design || {
    core_offer: '',
    offer_stack: [],
    dream_outcome: '',
    perceived_likelihood: '',
    time_to_result: '',
    effort_required: '',
  };

  const monopoly = plan.monopoly_analysis || {
    first_market: '',
    proprietary_tech_or_data: '',
    network_effects: '',
    economies_of_scale: '',
    brand: '',
    copycat_barrier_6_months: '',
  };

  const prod = plan.product_definition || {
    one_brilliant_thing: '',
    first_5_minutes_experience: [],
    what_to_cut: [],
    mvp_scope: [],
  };

  const vs = verdictStyle(es.verdict);

  return (
    <div className="space-y-6">
      {/* ── 1. Executive Feasibility Hero ─────────────────────────────── */}
      <div className={`${vs.bg} ${vs.text} p-6 md:p-8 border-2 border-black shadow-[4px_4px_0px_0px_#000]`}>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
          <div>
            <div className="inline-block text-[11px] font-black uppercase tracking-wider px-2 py-0.5 bg-black/20 mb-2">
              Zonek Ground-Truth Feasibility Verdict
            </div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
              {businessName || businessType}
            </h1>
            <p className="text-xs md:text-sm font-mono opacity-80 mt-1">
              📍 {location} · Budget: ₹{budgetInr.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase opacity-75 block">Strategic Verdict</span>
              <span className={`inline-block text-2xl md:text-3xl font-black px-4 py-1 border-2 border-current shadow-[2px_2px_0px_0px_#000]`}>
                {es.verdict}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-black/10 border border-black/20 p-4 mb-6">
          <div className="text-[11px] font-bold uppercase opacity-75 mb-1">Executive Summary</div>
          <p className="text-base font-bold mb-2">{es.one_liner}</p>
          <p className="text-sm opacity-90 leading-relaxed">{es.verdict_rationale}</p>
        </div>

        {/* 3 Pillar Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-black/15 p-4 border border-black/20">
            <span className="text-[10px] font-black uppercase opacity-75 block mb-1">01 / The Core Problem</span>
            <p className="text-xs font-medium leading-relaxed">{es.problem}</p>
          </div>
          <div className="bg-black/15 p-4 border border-black/20">
            <span className="text-[10px] font-black uppercase opacity-75 block mb-1">02 / The Solution</span>
            <p className="text-xs font-medium leading-relaxed">{es.solution}</p>
          </div>
          <div className="bg-black/15 p-4 border border-black/20">
            <span className="text-[10px] font-black uppercase opacity-75 block mb-1">03 / The Defensible Moat</span>
            <p className="text-xs font-medium leading-relaxed">{es.competitive_moat}</p>
          </div>
        </div>
      </div>

      {/* ── 2. Jobs-to-be-Done (JTBD) Customer Analysis ───────────────── */}
      <div className="bg-white border-2 border-black p-6 shadow-[3px_3px_0px_0px_#000]">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-black mb-5">
          <span className="text-xl">🎯</span>
          <div>
            <h3 className="font-black uppercase text-base tracking-tight">Jobs-to-be-Done (JTBD) Analysis</h3>
            <p className="text-xs text-neutral-500">Why customers in {location} actually buy, hire, or switch to you.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div className="p-4 bg-emerald-50 border border-emerald-200">
            <span className="text-xs font-black uppercase text-emerald-800 block mb-2">⚡ Functional Jobs</span>
            <ul className="space-y-1.5 text-xs text-emerald-950">
              {(jtbd.functional_jobs || []).map((j, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>{j}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200">
            <span className="text-xs font-black uppercase text-blue-800 block mb-2">🤝 Social Jobs</span>
            <ul className="space-y-1.5 text-xs text-blue-950">
              {(jtbd.social_jobs || []).map((j, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>{j}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-rose-50 border border-rose-200">
            <span className="text-xs font-black uppercase text-rose-800 block mb-2">❤️ Emotional Jobs</span>
            <ul className="space-y-1.5 text-xs text-rose-950">
              {(jtbd.emotional_jobs || []).map((j, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-rose-600 font-bold">✓</span>
                  <span>{j}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Current Substitutes & Desired Outcomes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-3 bg-neutral-100 border border-neutral-300">
            <span className="text-[11px] font-bold uppercase text-neutral-600 block mb-2">
              Current Substitutes (What they use right now)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(jtbd.current_substitutes || []).map((sub, i) => (
                <span key={i} className="px-2 py-1 bg-white border border-neutral-300 text-xs font-medium">
                  {sub}
                </span>
              ))}
            </div>
          </div>

          <div className="p-3 bg-neutral-100 border border-neutral-300">
            <span className="text-[11px] font-bold uppercase text-neutral-600 block mb-2">
              Desired Outcomes (Metrics that matter to them)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(jtbd.desired_outcomes || []).map((out, i) => (
                <span key={i} className="px-2 py-1 bg-white border border-neutral-300 text-xs font-medium text-emerald-700">
                  ★ {out}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Alex Hormozi $100M Offer Design ───────────────────────── */}
      <div className="bg-white border-2 border-black p-6 shadow-[3px_3px_0px_0px_#000]">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-black mb-5">
          <span className="text-xl">💎</span>
          <div>
            <h3 className="font-black uppercase text-base tracking-tight">High-Ticket Offer Design (Hormozi Framework)</h3>
            <p className="text-xs text-neutral-500">How to price, bundle, and position so customers feel stupid saying no.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <span className="text-[10px] font-black uppercase text-neutral-500 block mb-1">Core Offer</span>
            <div className="bg-amber-50 border-2 border-amber-300 p-4 font-bold text-sm text-amber-950 mb-3">
              {offer.core_offer || 'Custom specialized service offering with guaranteed outcome'}
            </div>

            <span className="text-[10px] font-black uppercase text-neutral-500 block mb-1">Offer Stack (Included Bonuses)</span>
            <div className="space-y-1.5">
              {(offer.offer_stack || []).map((item, i) => (
                <div key={i} className="p-2 bg-neutral-50 border border-neutral-200 text-xs flex items-center gap-2">
                  <span className="text-[#22C55E] font-bold">+</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-neutral-50 border border-neutral-200">
              <span className="text-[10px] font-bold uppercase text-neutral-500 block">Dream Outcome</span>
              <p className="text-xs font-medium text-neutral-900 mt-0.5">{offer.dream_outcome}</p>
            </div>
            <div className="p-3 bg-neutral-50 border border-neutral-200">
              <span className="text-[10px] font-bold uppercase text-neutral-500 block">Perceived Likelihood of Achievement</span>
              <p className="text-xs font-medium text-neutral-900 mt-0.5">{offer.perceived_likelihood}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-neutral-50 border border-neutral-200">
                <span className="text-[10px] font-bold uppercase text-neutral-500 block">Time to Result</span>
                <p className="text-xs font-bold text-neutral-900 mt-0.5">{offer.time_to_result}</p>
              </div>
              <div className="p-3 bg-neutral-50 border border-neutral-200">
                <span className="text-[10px] font-bold uppercase text-neutral-500 block">Effort Required</span>
                <p className="text-xs font-bold text-neutral-900 mt-0.5">{offer.effort_required}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Peter Thiel Monopoly / Moat Analysis ───────────────────── */}
      <div className="bg-white border-2 border-black p-6 shadow-[3px_3px_0px_0px_#000]">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-black mb-5">
          <span className="text-xl">🏰</span>
          <div>
            <h3 className="font-black uppercase text-base tracking-tight">Peter Thiel Monopoly Moat Analysis</h3>
            <p className="text-xs text-neutral-500">Own a small, defensible niche first before competing broadly.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-neutral-50 border border-neutral-200">
            <span className="text-[10px] font-black uppercase text-neutral-500 block mb-1">01 / Dominate First Market</span>
            <p className="text-xs text-neutral-800 font-medium">{monopoly.first_market}</p>
          </div>
          <div className="p-4 bg-neutral-50 border border-neutral-200">
            <span className="text-[10px] font-black uppercase text-neutral-500 block mb-1">02 / Proprietary Advantage</span>
            <p className="text-xs text-neutral-800 font-medium">{monopoly.proprietary_tech_or_data}</p>
          </div>
          <div className="p-4 bg-neutral-50 border border-neutral-200">
            <span className="text-[10px] font-black uppercase text-neutral-500 block mb-1">03 / Network Effects</span>
            <p className="text-xs text-neutral-800 font-medium">{monopoly.network_effects}</p>
          </div>
          <div className="p-4 bg-neutral-50 border border-neutral-200">
            <span className="text-[10px] font-black uppercase text-neutral-500 block mb-1">04 / Economies of Scale</span>
            <p className="text-xs text-neutral-800 font-medium">{monopoly.economies_of_scale}</p>
          </div>
          <div className="p-4 bg-neutral-50 border border-neutral-200">
            <span className="text-[10px] font-black uppercase text-neutral-500 block mb-1">05 / Brand Moat</span>
            <p className="text-xs text-neutral-800 font-medium">{monopoly.brand}</p>
          </div>
          <div className="p-4 bg-red-50 border border-red-200">
            <span className="text-[10px] font-black uppercase text-red-700 block mb-1">⚠️ 6-Month Copycat Barrier</span>
            <p className="text-xs text-red-950 font-medium">{monopoly.copycat_barrier_6_months}</p>
          </div>
        </div>
      </div>

      {/* ── 5. Product MVP Definition ─────────────────────────────────── */}
      <div className="bg-white border-2 border-black p-6 shadow-[3px_3px_0px_0px_#000]">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-black mb-5">
          <span className="text-xl">📦</span>
          <div>
            <h3 className="font-black uppercase text-base tracking-tight">MVP Launch Definition</h3>
            <p className="text-xs text-neutral-500">What to launch on Day 1 vs what to cut to stay on budget.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <div className="p-3 bg-emerald-50 border border-emerald-300 mb-4">
              <span className="text-[10px] font-black uppercase text-emerald-800 block">The One Brilliant Thing</span>
              <p className="text-sm font-black text-emerald-950 mt-1">{prod.one_brilliant_thing}</p>
            </div>

            <span className="text-[11px] font-bold uppercase text-neutral-600 block mb-2">First 5 Minutes Customer Experience</span>
            <div className="space-y-1.5">
              {(prod.first_5_minutes_experience || []).map((step, i) => (
                <div key={i} className="p-2 bg-neutral-50 border border-neutral-200 text-xs flex items-center gap-2">
                  <span className="w-4 h-4 bg-black text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4">
              <span className="text-[11px] font-bold uppercase text-red-600 block mb-2">What to Cut for Day 1 (Waste Reduction)</span>
              <div className="space-y-1.5">
                {(prod.what_to_cut || []).map((cut, i) => (
                  <div key={i} className="p-2 bg-red-50 border border-red-200 text-xs text-red-900 flex items-center gap-2">
                    <span className="text-red-500 font-bold">✗</span>
                    <span>{cut}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase text-neutral-600 block mb-2">Day 1 MVP Deliverables</span>
              <div className="space-y-1.5">
                {(prod.mvp_scope || []).map((item, i) => (
                  <div key={i} className="p-2 bg-neutral-50 border border-neutral-200 text-xs flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewFeasibilityTab;
