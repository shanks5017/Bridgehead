/**
 * BusinessResearch.tsx  — Zonek / Bridgehead
 * ─────────────────────────────────────────────────────────────────────────────
 * Comprehensive Business Research & Documentation Engine
 *
 * Input stages:
 *   1. Core Basics         (business type, format, location)
 *   2. Financial Model     (budget, pricing, revenue goals)
 *   3. Business Model      (UVP, competitors, model type)
 *   4. Founder & Customer  (persona, experience, channels)
 *   5. Report Config       (which sections to generate)
 *
 * Output sections (all in one SSE stream):
 *   • Executive Summary + Verdict (GO/CAUTION/STOP)
 *   • Jobs-to-be-Done Analysis
 *   • Offer Design (Hormozi framework)
 *   • Monopoly Analysis (Thiel framework)
 *   • Financial Projections + P&L + Scenarios
 *   • Competitive Intelligence + Blue Ocean Grid
 *   • Marketing Strategy + StoryBrand + Landing Page
 *   • 90-Day Roadmap + SOPs + Risk Register
 *   • Licensing Checklist + Team Structure
 *
 * No existing code is changed. This is a NEW component imported alongside
 * the existing Research.tsx. Add `BUSINESS_RESEARCH` to the View enum and
 * route it in App.tsx as described below.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useRef, useCallback } from 'react';
import { BusinessResearchInput, FullBusinessReport, BusinessResearchSSEEvent } from '../types';

// ─── Icon set (reuse existing or inline SVGs) ────────────────────────────────
const Icon = {
  Sparkles:  ({ className = '' }) => <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>,
  Chart:     ({ className = '' }) => <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>,
  Users:     ({ className = '' }) => <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
  Rocket:    ({ className = '' }) => <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>,
  Shield:    ({ className = '' }) => <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>,
  Map:       ({ className = '' }) => <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>,
  Check:     ({ className = '' }) => <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>,
  ArrowRight:({ className = '' }) => <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>,
  Loader:    ({ className = '' }) => <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>,
};

// ─── API config ──────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

// ─── Default form state ───────────────────────────────────────────────────────
const DEFAULT_INPUT: BusinessResearchInput = {
  businessType: '',
  businessDescription: '',
  businessFormat: 'Brick & Mortar',
  location: '',
  totalBudget: 1000000,
  workingCapital: 200000,
  pricingModel: 'Per-unit',
  businessModel: 'B2C',
  spaceRequired: '500-1000',
  launchTimeline: '3 months',
  currentStage: 'Idea',
  includeRoadmap: true,
  includeFinancials: true,
  includeMarketing: true,
  includeCompetitors: true,
  includeSOPs: true,
};

type Stage = 'form' | 'running' | 'results';
type FormStep = 1 | 2 | 3 | 4 | 5;

// ─── Score color helper ───────────────────────────────────────────────────────
const verdictStyle = (v: 'GO' | 'CAUTION' | 'STOP' | undefined) => {
  if (v === 'GO') return { bg: 'bg-[#22C55E]', text: 'text-white', border: 'border-[#22C55E]' };
  if (v === 'CAUTION') return { bg: 'bg-[#FBBF24]', text: 'text-[#141414]', border: 'border-[#FBBF24]' };
  return { bg: 'bg-[#EF4444]', text: 'text-white', border: 'border-[#EF4444]' };
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="w-full bg-[#D9D8D6] h-2 rounded-none neo-border">
      <div
        className="h-full bg-[#22C55E] transition-all duration-500"
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white neo-border mb-4">
      <button
        className="w-full flex items-center justify-between p-5 border-b-2 border-[#141414] text-left"
        onClick={() => setOpen(o => !o)}
      >
        <span className="flex items-center gap-3 text-base font-bold uppercase tracking-tight">
          {icon}
          {title}
        </span>
        <span className="text-[#22C55E] font-bold text-lg">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="p-5">{children}</div>}
    </div>
  );
}

function Tag({ children, color = 'green' }: { children: React.ReactNode; color?: 'green' | 'yellow' | 'red' | 'blue' | 'gray' }) {
  const cls = {
    green: 'bg-[#22C55E] text-white',
    yellow: 'bg-[#FBBF24] text-[#141414]',
    red: 'bg-[#EF4444] text-white',
    blue: 'bg-[#3B82F6] text-white',
    gray: 'bg-[#D9D8D6] text-[#141414]',
  }[color];
  return (
    <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase neo-border ${cls}`}>
      {children}
    </span>
  );
}

function InfoGrid({ items }: { items: { label: string; value: string | number }[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {items.map(({ label, value }) => (
        <div key={label} className="bg-[#E4E3E0] p-3 neo-border">
          <div className="text-[9px] font-bold uppercase opacity-50 mb-1">{label}</div>
          <div className="text-sm font-bold">{value}</div>
        </div>
      ))}
    </div>
  );
}

function BulletList({ items, color = 'green' }: { items: string[]; color?: 'green' | 'blue' | 'red' }) {
  const dot = { green: 'bg-[#22C55E]', blue: 'bg-[#3B82F6]', red: 'bg-[#EF4444]' }[color];
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          <span className={`w-1.5 h-1.5 mt-1.5 rounded-full flex-shrink-0 ${dot}`} />
          {item}
        </li>
      ))}
    </ul>
  );
}

// ─── FORM STEPS ───────────────────────────────────────────────────────────────

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <React.Fragment key={i}>
          <div className={`w-8 h-8 neo-border flex items-center justify-center text-xs font-bold
            ${i + 1 < step ? 'bg-[#22C55E] text-white' :
              i + 1 === step ? 'bg-[#141414] text-white' : 'bg-white text-[#141414]'}`}>
            {i + 1 < step ? <Icon.Check className="w-4 h-4" /> : i + 1}
          </div>
          {i < total - 1 && <div className={`flex-1 h-0.5 ${i + 1 < step ? 'bg-[#22C55E]' : 'bg-[#D9D8D6]'}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

const inputClass = "w-full p-3 neo-border bg-[#E4E3E0] text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]";
const labelClass = "block text-[11px] font-bold uppercase mb-1";
const textareaClass = `${inputClass} resize-none`;

// ─── RESULTS RENDERER ─────────────────────────────────────────────────────────

function BusinessPlanSection({ plan }: { plan: FullBusinessReport['business_plan'] }) {
  if (!plan) return null;
  const es = plan.executive_summary || {
    verdict: 'CAUTION',
    one_liner: 'Business Opportunity Analysis',
    verdict_rationale: 'Review the market indicators below to evaluate risk and opportunity.',
    problem: 'Market problem under evaluation',
    solution: 'Proposed business model',
    competitive_moat: 'Local positioning and service differentiation'
  };
  const vs = verdictStyle(es.verdict as any);
  const jtbd = plan.jobs_to_be_done || { functional_jobs: [], social_jobs: [], emotional_jobs: [], current_substitutes: [], desired_outcomes: [] };
  const offer = plan.offer_design || { core_offer: '', offer_stack: [], dream_outcome: '', perceived_likelihood: '', time_to_result: '', effort_required: '' };
  const monopoly = plan.monopoly_analysis || { first_market: '', proprietary_tech_or_data: '', network_effects: '', economies_of_scale: '', brand: '', copycat_barrier_6_months: '' };
  const prod = plan.product_definition || { one_brilliant_thing: '', first_5_minutes_experience: [], what_to_cut: [], mvp_scope: [] };

  return (
    <>
      {/* Executive Summary / Hero */}
      <div className={`${vs.bg} ${vs.text} p-6 neo-border mb-4 relative`}>
        <div className="absolute top-4 right-4">
          <span className="text-2xl font-black border-2 border-current px-3 py-1">{es.verdict}</span>
        </div>
        <div className="text-[11px] font-bold uppercase opacity-80 mb-1">Executive Summary</div>
        <h2 className="text-2xl font-black uppercase mb-2">{es.one_liner}</h2>
        <p className="text-sm opacity-90 mb-3">{es.verdict_rationale}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <div className="bg-black/10 p-3">
            <div className="text-[9px] font-bold uppercase mb-1">The Problem</div>
            <p className="text-xs">{es.problem}</p>
          </div>
          <div className="bg-black/10 p-3">
            <div className="text-[9px] font-bold uppercase mb-1">The Solution</div>
            <p className="text-xs">{es.solution}</p>
          </div>
          <div className="bg-black/10 p-3">
            <div className="text-[9px] font-bold uppercase mb-1">Competitive Moat</div>
            <p className="text-xs">{es.competitive_moat}</p>
          </div>
        </div>
      </div>

      {/* JTBD */}
      <SectionCard title="Jobs-to-be-Done Analysis" icon={<Icon.Users className="w-5 h-5" />}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <div className="text-[10px] font-bold uppercase mb-2 text-[#22C55E]">Functional Jobs</div>
            <BulletList items={jtbd.functional_jobs || []} />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase mb-2 text-[#3B82F6]">Social Jobs</div>
            <BulletList items={jtbd.social_jobs || []} color="blue" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase mb-2 text-[#EF4444]">Emotional Jobs</div>
            <BulletList items={jtbd.emotional_jobs || []} color="red" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-[10px] font-bold uppercase mb-2">Current Substitutes (what they use today)</div>
          <div className="flex flex-wrap gap-2">
            {(jtbd.current_substitutes || []).map((s, i) => <React.Fragment key={i}><Tag color="gray">{s}</Tag></React.Fragment>)}
          </div>
        </div>
      </SectionCard>

      {/* Offer Design */}
      <SectionCard title="Offer Design (Hormozi Framework)" icon={<Icon.Sparkles className="w-5 h-5" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase mb-2">Core Offer</div>
            <div className="bg-[#E4E3E0] p-3 neo-border text-sm font-bold">{offer.core_offer}</div>
            <div className="mt-3 text-[10px] font-bold uppercase mb-2">Dream Outcome</div>
            <div className="bg-[#22C55E]/10 border-l-4 border-[#22C55E] p-3 text-sm">{offer.dream_outcome}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase mb-2">Offer Stack (Bonuses)</div>
            {(offer.offer_stack || []).map((s, i) => (
              <div key={i} className="flex items-center gap-2 p-2 border-b border-[#D9D8D6] text-sm">
                <span className="w-5 h-5 bg-[#22C55E] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">{i + 1}</span>
                {s}
              </div>
            ))}
          </div>
        </div>
        <InfoGrid items={[
          { label: 'Time to Result', value: offer.time_to_result },
          { label: 'Effort Required', value: offer.effort_required },
          { label: 'Perceived Likelihood', value: offer.perceived_likelihood },
        ]} />
      </SectionCard>

      {/* Monopoly Analysis */}
      <SectionCard title="Monopoly Analysis (Thiel Framework)" icon={<Icon.Shield className="w-5 h-5" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            {[
              ['First Market to Dominate', monopoly.first_market],
              ['Proprietary Tech / Data', monopoly.proprietary_tech_or_data],
              ['Network Effects', monopoly.network_effects],
            ].map(([k, v]) => (
              <div key={k} className="bg-[#E4E3E0] p-3 neo-border">
                <div className="text-[9px] font-bold uppercase opacity-50 mb-1">{k}</div>
                <div className="text-sm">{v}</div>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {[
              ['Economies of Scale', monopoly.economies_of_scale],
              ['Brand Moat', monopoly.brand],
              ['6-Month Copycat Barrier', monopoly.copycat_barrier_6_months],
            ].map(([k, v]) => (
              <div key={k} className="bg-[#E4E3E0] p-3 neo-border">
                <div className="text-[9px] font-bold uppercase opacity-50 mb-1">{k}</div>
                <div className="text-sm">{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <div className="text-[10px] font-bold uppercase mb-2">The One Brilliant Thing</div>
          <div className="text-lg font-black border-l-4 border-[#22C55E] pl-4">{prod.one_brilliant_thing}</div>
        </div>
      </SectionCard>
    </>
  );
}

function FinancialsSection({ fin }: { fin: FullBusinessReport['financials'] }) {
  if (!fin) return null;
  const inr = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;
  const sc = fin.startup_costs || { breakdown: [], setup_total: 0, budget_gap: 0, data_confidence: '' };
  const ue = fin.unit_economics || { avg_revenue_per_customer: 0, gross_margin_pct: 0, cac_estimate: 0, ltv_estimate: 0, ltv_to_cac_ratio: 0, payback_months: 0, notes: '' };
  const scenarios = fin.scenarios || {
    conservative: { monthly_customers: 0, break_even_month: 0, year1_revenue: 0 },
    base: { monthly_customers: 0, break_even_month: 0, year1_revenue: 0 },
    optimistic: { monthly_customers: 0, break_even_month: 0, year1_revenue: 0 }
  };
  const runway = fin.runway || { months_of_runway: 0, critical_milestone: '', fundraise_or_revenue_flag: '' };
  const pa = fin.pricing_analysis || { price_too_cheap_threshold: 0, ideal_range_min: 0, ideal_range_max: 0, price_too_expensive_threshold: 0, pricing_rationale: '' };

  return (
    <SectionCard title="Financial Projections" icon={<Icon.Chart className="w-5 h-5" />}>
      {/* Startup cost breakdown */}
      <div className="mb-6">
        <div className="text-[11px] font-bold uppercase mb-3">Startup Cost Breakdown</div>
        <div className="space-y-1 mb-3">
          {(sc.breakdown || []).map((row, i) => (
            <div key={i} className="flex justify-between items-center py-1.5 border-b border-[#D9D8D6] text-sm">
              <span>{row.item}</span>
              <span className="font-bold font-mono">{inr(row.amount)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center p-3 bg-[#141414] text-white neo-border">
          <span className="font-bold uppercase text-sm">Total Setup</span>
          <span className="font-black text-lg">{inr(sc.setup_total)}</span>
        </div>
        {sc.budget_gap > 0 && (
          <div className="mt-2 p-3 bg-[#EF4444]/10 border-l-4 border-[#EF4444] text-sm">
            ⚠️ Budget Gap: <strong>{inr(sc.budget_gap)}</strong> — additional funding needed
          </div>
        )}
        <div className="mt-2 text-[10px] opacity-50 font-mono">{sc.data_confidence}</div>
      </div>

      {/* Unit economics */}
      <div className="mb-6">
        <div className="text-[11px] font-bold uppercase mb-3">Unit Economics</div>
        <InfoGrid items={[
          { label: 'Avg Revenue / Customer', value: inr(ue.avg_revenue_per_customer) },
          { label: 'Gross Margin', value: `${ue.gross_margin_pct}%` },
          { label: 'CAC Estimate', value: inr(ue.cac_estimate) },
          { label: 'LTV Estimate', value: inr(ue.ltv_estimate) },
          { label: 'LTV : CAC', value: `${ue.ltv_to_cac_ratio}x` },
          { label: 'Payback Period', value: `${ue.payback_months} months` },
        ]} />
        <div className="mt-2 text-[10px] font-mono opacity-50">{ue.notes}</div>
      </div>

      {/* Scenarios */}
      <div className="mb-6">
        <div className="text-[11px] font-bold uppercase mb-3">12-Month Scenarios</div>
        <div className="grid grid-cols-3 gap-3">
          {(['conservative', 'base', 'optimistic'] as const).map(k => {
            const s = scenarios[k] || { monthly_customers: 0, break_even_month: 0, year1_revenue: 0 };
            const colors = { conservative: 'border-[#EF4444]', base: 'border-[#FBBF24]', optimistic: 'border-[#22C55E]' };
            return (
              <div key={k} className={`p-4 neo-border border-t-4 ${colors[k]}`}>
                <div className="text-[10px] font-bold uppercase mb-2 capitalize">{k}</div>
                <div className="text-xs space-y-1">
                  <div>Customers/mo: <strong>{s.monthly_customers}</strong></div>
                  <div>Breakeven: <strong>Month {s.break_even_month}</strong></div>
                  <div>Year 1 Revenue: <strong>{inr(s.year1_revenue)}</strong></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Runway */}
      <div className="p-4 bg-[#E4E3E0] neo-border">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase opacity-50 mb-1">Runway</div>
            <div className="text-2xl font-black">{runway.months_of_runway} months</div>
            <div className="text-xs mt-1 opacity-70">{runway.critical_milestone}</div>
          </div>
          <Tag color={runway.fundraise_or_revenue_flag?.includes('Self') ? 'green' : 'yellow'}>
            {runway.fundraise_or_revenue_flag || 'Assessing'}
          </Tag>
        </div>
      </div>

      {/* Pricing */}
      <div className="mt-4">
        <div className="text-[11px] font-bold uppercase mb-3">Pricing Analysis</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Too Cheap', value: `₹${pa.price_too_cheap_threshold?.toLocaleString() || 0}` },
            { label: 'Ideal Min', value: `₹${pa.ideal_range_min?.toLocaleString() || 0}` },
            { label: 'Ideal Max', value: `₹${pa.ideal_range_max?.toLocaleString() || 0}` },
            { label: 'Too Expensive', value: `₹${pa.price_too_expensive_threshold?.toLocaleString() || 0}` },
          ].map(x => (
            <div key={x.label} className="bg-[#E4E3E0] p-3 neo-border text-center">
              <div className="text-[9px] font-bold uppercase opacity-50 mb-1">{x.label}</div>
              <div className="font-bold">{x.value}</div>
            </div>
          ))}
        </div>
        <div className="mt-2 text-xs opacity-60 font-mono">{pa.pricing_rationale}</div>
      </div>
    </SectionCard>
  );
}

function CompetitiveSection({ comp }: { comp: FullBusinessReport['competitive_analysis'] }) {
  if (!comp) return null;
  const threatColor = (t: string) => t === 'HIGH' ? 'red' : t === 'MEDIUM' ? 'yellow' : 'green';
  return (
    <SectionCard title="Competitive Intelligence" icon={<Icon.Shield className="w-5 h-5" />}>
      {/* Competitor Matrix */}
      <div className="mb-6">
        <div className="text-[11px] font-bold uppercase mb-3">Competitor Matrix</div>
        <div className="space-y-3">
          {comp.competitor_matrix?.map((c, i) => (
            <div key={i} className="p-4 neo-border">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">{c.name}</span>
                <div className="flex gap-2">
                  <Tag color="gray">{c.type}</Tag>
                  <Tag color={threatColor(c.threat_level) as any}>Threat: {c.threat_level}</Tag>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="font-bold text-[#22C55E] mb-1">Strengths</div>
                  <BulletList items={c.strengths} />
                </div>
                <div>
                  <div className="font-bold text-[#EF4444] mb-1">Weaknesses</div>
                  <BulletList items={c.weaknesses} color="red" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Blue Ocean Grid */}
      <div className="mb-6">
        <div className="text-[11px] font-bold uppercase mb-3">Blue Ocean Strategy Grid</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['eliminate', 'reduce', 'raise', 'create'] as const).map(key => {
            const colors = { eliminate: 'border-[#EF4444]', reduce: 'border-[#FBBF24]', raise: 'border-[#3B82F6]', create: 'border-[#22C55E]' };
            return (
              <div key={key} className={`p-3 neo-border border-t-4 ${colors[key]}`}>
                <div className="text-[10px] font-bold uppercase mb-2 capitalize">{key}</div>
                <BulletList items={comp.blue_ocean_grid[key] || []} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Gaps */}
      <div>
        <div className="text-[11px] font-bold uppercase mb-3">Market Gaps & Opportunities</div>
        {comp.competitive_gaps?.map((g, i) => (
          <div key={i} className="p-3 bg-[#22C55E]/5 border-l-4 border-[#22C55E] mb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold">{g.gap}</span>
              <Tag color={g.opportunity_size === 'LARGE' ? 'green' : g.opportunity_size === 'MEDIUM' ? 'yellow' : 'gray'}>
                {g.opportunity_size}
              </Tag>
            </div>
            <div className="text-xs opacity-70">↳ {g.how_to_exploit}</div>
          </div>
        ))}
      </div>

      {/* Positioning */}
      <div className="mt-4 p-4 bg-[#141414] text-white neo-border">
        <div className="text-[10px] font-bold uppercase opacity-50 mb-2">Positioning Statement</div>
        <div className="text-sm font-mono italic">{comp.positioning_recommendation?.positioning_statement}</div>
        <div className="mt-2 flex gap-2 flex-wrap">
          <Tag color="green">{comp.positioning_recommendation?.price_positioning}</Tag>
          {comp.positioning_recommendation?.differentiation_axes?.map((a, i) => <React.Fragment key={i}><Tag color="blue">{a}</Tag></React.Fragment>)}
        </div>
      </div>
    </SectionCard>
  );
}

function MarketingSection({ mkt }: { mkt: FullBusinessReport['marketing_strategy'] }) {
  if (!mkt) return null;
  const sb = mkt.storybrand_script || {
    character: '',
    problem: { external: '', internal: '', philosophical: '' },
    guide: '',
    plan: [],
    call_to_action: { direct: '', transitional: '' },
    failure_avoided: '',
    success_achieved: ''
  };
  const lpw = mkt.landing_page_wireframe || {
    hero_headline: '',
    hero_subheadline: '',
    primary_cta: '',
    social_proof_hook: '',
    three_step_simplifier: [],
    objection_crushers: [],
    secondary_cta: ''
  };
  const channels = mkt.acquisition_channels || [];
  const content = mkt.content_strategy || { hook_formula: '', content_pillars: [], first_30_days_plan: [], lead_magnet_idea: '' };

  return (
    <SectionCard title="Marketing & Growth Strategy" icon={<Icon.Rocket className="w-5 h-5" />}>
      {/* StoryBrand */}
      <div className="mb-6">
        <div className="text-[11px] font-bold uppercase mb-3">StoryBrand Script</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            {[
              ['Character (Hero)', sb.character],
              ['External Problem', sb.problem?.external],
              ['Internal Problem', sb.problem?.internal],
              ['Guide Role', sb.guide],
            ].map(([k, v]) => (
              <div key={k} className="bg-[#E4E3E0] p-3 neo-border">
                <div className="text-[9px] font-bold uppercase opacity-50 mb-1">{k}</div>
                <div className="text-sm">{v}</div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="bg-[#22C55E]/10 p-3 neo-border border-l-4 border-[#22C55E]">
              <div className="text-[9px] font-bold uppercase opacity-50 mb-1">Success (Happy Ending)</div>
              <div className="text-sm font-bold">{sb.success_achieved}</div>
            </div>
            <div className="bg-[#EF4444]/10 p-3 neo-border border-l-4 border-[#EF4444]">
              <div className="text-[9px] font-bold uppercase opacity-50 mb-1">Failure (Stakes)</div>
              <div className="text-sm">{sb.failure_avoided}</div>
            </div>
            <div className="p-3 neo-border">
              <div className="text-[9px] font-bold uppercase opacity-50 mb-1">Call to Action</div>
              <div className="text-sm"><strong>Direct:</strong> {sb.call_to_action?.direct}</div>
              <div className="text-sm mt-1"><strong>Transitional:</strong> {sb.call_to_action?.transitional}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Landing page wireframe */}
      <div className="mb-6 p-4 bg-[#141414] text-white neo-border">
        <div className="text-[10px] font-bold uppercase opacity-50 mb-3">Landing Page Wireframe</div>
        <div className="text-2xl font-black mb-1">{lpw.hero_headline}</div>
        <div className="text-sm opacity-70 mb-3">{lpw.hero_subheadline}</div>
        <button className="bg-[#22C55E] text-white px-6 py-2 font-bold uppercase text-sm neo-border">
          {lpw.primary_cta}
        </button>
        <div className="mt-4 text-[10px] font-bold uppercase opacity-50">Social Proof</div>
        <div className="text-sm mt-1 italic opacity-70">{lpw.social_proof_hook}</div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {(lpw.three_step_simplifier || []).map((s, i) => (
            <div key={i} className="bg-white/10 p-2 text-center">
              <div className="font-bold text-[#22C55E] text-lg">{i + 1}</div>
              <div className="text-xs">{s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Acquisition channels */}
      <div>
        <div className="text-[11px] font-bold uppercase mb-3">Acquisition Channels (Priority Ranked)</div>
        <div className="space-y-3">
          {channels
            ?.slice()
            ?.sort((a, b) => a.priority - b.priority)
            .map((ch, i) => (
              <div key={i} className="flex items-start gap-4 p-3 neo-border">
                <div className="w-8 h-8 bg-[#141414] text-white flex items-center justify-center font-bold flex-shrink-0">
                  {ch.priority}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-sm">{ch.channel}</span>
                    <Tag color="gray">CAC: {ch.cac_estimate}</Tag>
                    <Tag color={ch.effort === 'LOW' ? 'green' : ch.effort === 'MEDIUM' ? 'yellow' : 'red'}>Effort: {ch.effort}</Tag>
                    <Tag color="blue">{ch.time_to_results}</Tag>
                  </div>
                  <BulletList items={ch.recommended_tactics || []} />
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Lead magnet */}
      <div className="mt-4 p-4 bg-[#22C55E]/5 border-l-4 border-[#22C55E] neo-border">
        <div className="text-[10px] font-bold uppercase mb-1">Lead Magnet Idea</div>
        <div className="text-sm font-bold">{content.lead_magnet_idea}</div>
      </div>
    </SectionCard>
  );
}

function RoadmapSection({ roadmap }: { roadmap: FullBusinessReport['roadmap'] }) {
  if (!roadmap) return null;
  const months = roadmap['90_day_roadmap'] || {};
  const milestones = roadmap.critical_milestones || [];
  const sops = roadmap.sops || [];
  const risks = roadmap.risk_register || [];
  const licensing = roadmap.licensing_checklist || [];

  return (
    <SectionCard title="90-Day Execution Roadmap" icon={<Icon.Map className="w-5 h-5" />}>
      {/* Monthly themes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {(['month_1', 'month_2', 'month_3'] as const).map((m, mi) => {
          const mo = (months as any)?.[m];
          if (!mo) return null;
          const colors = ['border-[#3B82F6]', 'border-[#FBBF24]', 'border-[#22C55E]'];
          return (
            <div key={m} className={`neo-border border-t-4 p-4 ${colors[mi]}`}>
              <div className="text-[10px] font-bold uppercase opacity-50 mb-1">Month {mi + 1}</div>
              <div className="font-bold mb-3">{mo.theme}</div>
              {(mo.weekly_sprints || []).map((w: any) => (
                <div key={w.week} className="mb-2 p-2 bg-[#E4E3E0] neo-border">
                  <div className="text-[9px] font-bold uppercase">Week {w.week}: {w.focus}</div>
                  <div className="text-[10px] opacity-60 mt-1">{w.deliverable}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Critical milestones */}
      <div className="mb-6">
        <div className="text-[11px] font-bold uppercase mb-3">Critical Milestones</div>
        <div className="space-y-2">
          {milestones.map((m, i) => (
            <div key={i} className="flex gap-4 p-3 neo-border">
              <div className="w-6 h-6 bg-[#22C55E] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
              <div>
                <div className="font-bold text-sm">{m.milestone}</div>
                <div className="text-[10px] opacity-60">{m.target_date} · Success: {m.success_metric}</div>
                <div className="text-[10px] text-[#EF4444] mt-1">⚠️ Risk if missed: {m.risk_if_missed}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SOPs */}
      {sops.length > 0 && (
        <div className="mb-6">
          <div className="text-[11px] font-bold uppercase mb-3">Standard Operating Procedures</div>
          <div className="space-y-3">
            {sops.map((sop, i) => (
              <div key={i} className="p-4 neo-border">
                <div className="font-bold mb-1">{sop.process_name}</div>
                <div className="text-[10px] opacity-50 mb-2">Trigger: {sop.trigger} · Owner: {sop.owner}</div>
                <ol className="text-sm space-y-1">
                  {(sop.steps || []).map((s: string, si: number) => (
                    <li key={si} className="flex gap-2 items-start">
                      <span className="text-[#22C55E] font-bold">{si + 1}.</span> {s}
                    </li>
                  ))}
                </ol>
                <div className="mt-2 text-[10px] text-[#3B82F6]">✓ Quality Check: {sop.quality_check}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk register */}
      <div className="mb-6">
        <div className="text-[11px] font-bold uppercase mb-3">Risk Register</div>
        <div className="space-y-2">
          {risks.map((r, i) => (
            <div key={i} className="p-3 neo-border">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm">{r.risk}</span>
                <div className="flex gap-1">
                  <Tag color={r.probability === 'HIGH' ? 'red' : r.probability === 'MEDIUM' ? 'yellow' : 'green'}>P: {r.probability}</Tag>
                  <Tag color={r.impact === 'HIGH' ? 'red' : r.impact === 'MEDIUM' ? 'yellow' : 'green'}>I: {r.impact}</Tag>
                </div>
              </div>
              <div className="text-xs text-[#22C55E]">↳ Mitigation: {r.mitigation}</div>
              <div className="text-xs opacity-50 mt-1">Contingency: {r.contingency}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Licensing checklist */}
      <div>
        <div className="text-[11px] font-bold uppercase mb-3">Licensing Checklist</div>
        <div className="space-y-2">
          {licensing.map((l, i) => (
            <div key={i} className="flex items-center gap-3 p-3 neo-border">
              <div className={`w-4 h-4 neo-border flex items-center justify-center ${l.status === 'Required' ? 'bg-[#EF4444]' : 'bg-[#D9D8D6]'}`}>
                {l.status === 'Required' && <span className="text-white text-[8px]">!</span>}
              </div>
              <div className="flex-1">
                <div className="font-bold text-sm">{l.licence}</div>
                <div className="text-[10px] opacity-60">{l.authority} · {l.timeline} · {l.cost_estimate}</div>
              </div>
              <Tag color={l.status === 'Required' ? 'red' : l.status === 'Recommended' ? 'yellow' : 'gray'}>
                {l.status}
              </Tag>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function BusinessResearch() {
  const [stage, setStage] = useState<Stage>('form');
  const [formStep, setFormStep] = useState<FormStep>(1);
  const [input, setInput] = useState<BusinessResearchInput>({ ...DEFAULT_INPUT });
  const [progressEvents, setProgressEvents] = useState<BusinessResearchSSEEvent[]>([]);
  const [progressPct, setProgressPct] = useState(0);
  const [report, setReport] = useState<FullBusinessReport | null>(null);
  const [firewallViolations, setFirewallViolations] = useState(0);
  const eventsRef = useRef<HTMLDivElement>(null);

  const setField = useCallback(<K extends keyof BusinessResearchInput>(key: K, val: BusinessResearchInput[K]) => {
    setInput(prev => ({ ...prev, [key]: val }));
  }, []);

  // ── FORM STEPS ─────────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (formStep) {
      case 1: return (
        <div className="space-y-5">
          <h3 className="font-bold uppercase text-sm border-b-2 border-[#141414] pb-2">Core Business Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Business Name (optional)</label>
              <input className={inputClass} placeholder="e.g. Brew & Co." value={input.businessName || ''} onChange={e => setField('businessName', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Business Type *</label>
              <input required className={inputClass} placeholder="e.g. Cafe, Gym, SaaS, Pharmacy" value={input.businessType} onChange={e => setField('businessType', e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Business Description</label>
            <textarea className={textareaClass} rows={3} placeholder="Describe your concept in detail — the more context, the better the research..." value={input.businessDescription || ''} onChange={e => setField('businessDescription', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Business Format *</label>
              <select className={inputClass} value={input.businessFormat} onChange={e => setField('businessFormat', e.target.value)}>
                {['Brick & Mortar', 'Online', 'Hybrid', 'SaaS', 'Service / Consulting', 'Marketplace', 'Manufacturing'].map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Location / Area *</label>
              <input required className={inputClass} placeholder="e.g. RS Puram, Coimbatore / Bangalore / Delhi" value={input.location} onChange={e => setField('location', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Space Required</label>
              <select className={inputClass} value={input.spaceRequired || '500-1000'} onChange={e => setField('spaceRequired', e.target.value)}>
                <option value="<500">&lt; 500 sqft (Kiosk / Small)</option>
                <option value="500-1000">500–1000 sqft (Standard)</option>
                <option value=">1000">&gt; 1000 sqft (Large)</option>
                <option value="Remote">Remote / No physical space</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Target Market / Area</label>
              <input className={inputClass} placeholder="e.g. College students, SMBs, Households" value={input.targetMarket || ''} onChange={e => setField('targetMarket', e.target.value)} />
            </div>
          </div>
        </div>
      );

      case 2: return (
        <div className="space-y-5">
          <h3 className="font-bold uppercase text-sm border-b-2 border-[#141414] pb-2">Financial Model</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Total Budget (₹) *</label>
              <input required type="number" min="10000" step="10000" className={inputClass} value={input.totalBudget} onChange={e => setField('totalBudget', Number(e.target.value))} />
            </div>
            <div>
              <label className={labelClass}>Working Capital Reserved (₹)</label>
              <input type="number" min="0" step="10000" className={inputClass} value={input.workingCapital || ''} onChange={e => setField('workingCapital', Number(e.target.value))} />
            </div>
            <div>
              <label className={labelClass}>Monthly Burn Target (₹)</label>
              <input type="number" min="0" step="1000" className={inputClass} value={input.monthlyBurnTarget || ''} onChange={e => setField('monthlyBurnTarget', Number(e.target.value))} />
            </div>
            <div>
              <label className={labelClass}>Revenue Goal — Year 1 (₹)</label>
              <input type="number" min="0" step="10000" className={inputClass} value={input.revenueGoal12Months || ''} onChange={e => setField('revenueGoal12Months', Number(e.target.value))} />
            </div>
            <div>
              <label className={labelClass}>Pricing Model</label>
              <select className={inputClass} value={input.pricingModel || 'Per-unit'} onChange={e => setField('pricingModel', e.target.value)}>
                {['Per-unit / Per-sale', 'Subscription / Monthly', 'Service Fee / Project', 'Freemium', 'Usage-based', 'Commission / Marketplace'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Avg Ticket Size / Price (₹)</label>
              <input type="number" min="0" className={inputClass} value={input.avgTicketSize || ''} onChange={e => setField('avgTicketSize', Number(e.target.value))} placeholder="Expected price per customer / sale" />
            </div>
          </div>
        </div>
      );

      case 3: return (
        <div className="space-y-5">
          <h3 className="font-bold uppercase text-sm border-b-2 border-[#141414] pb-2">Business Model & Competitive Position</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Business Model</label>
              <select className={inputClass} value={input.businessModel || 'B2C'} onChange={e => setField('businessModel', e.target.value)}>
                {['B2C', 'B2B', 'B2B2C', 'Marketplace / Platform', 'SaaS', 'DTC', 'Franchise'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Current Stage</label>
              <select className={inputClass} value={input.currentStage || 'Idea'} onChange={e => setField('currentStage', e.target.value)}>
                {['Idea', 'Validated (some customer interviews done)', 'MVP Built', 'Revenue (paying customers)', 'Scale'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Unique Value Proposition (UVP)</label>
            <textarea className={textareaClass} rows={2} placeholder="What makes your business different from alternatives? Be specific." value={input.uniqueValueProposition || ''} onChange={e => setField('uniqueValueProposition', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Known Competitors (comma-separated)</label>
            <input className={inputClass} placeholder="e.g. Starbucks, Chai Point, Local kirana" value={input.knownCompetitors?.join(', ') || ''} onChange={e => setField('knownCompetitors', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
          </div>
          <div>
            <label className={labelClass}>Your Differentiators (comma-separated)</label>
            <input className={inputClass} placeholder="e.g. Faster delivery, Local ingredients, Lower price" value={input.differentiators?.join(', ') || ''} onChange={e => setField('differentiators', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Launch Timeline</label>
              <select className={inputClass} value={input.launchTimeline || '3 months'} onChange={e => setField('launchTimeline', e.target.value)}>
                {['< 1 month', '1-2 months', '3 months', '6 months', '12 months', '12+ months'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Expected Team Size at Launch</label>
              <input type="number" min="1" max="100" className={inputClass} value={input.expectedTeamSize || 1} onChange={e => setField('expectedTeamSize', Number(e.target.value))} />
            </div>
          </div>
        </div>
      );

      case 4: return (
        <div className="space-y-5">
          <h3 className="font-bold uppercase text-sm border-b-2 border-[#141414] pb-2">Founder Profile & Customer Persona</h3>
          <div>
            <label className={labelClass}>Founder Domain Experience</label>
            <input className={inputClass} placeholder="e.g. 5 years in F&B industry, ex-operations manager..." value={input.founderExperience || ''} onChange={e => setField('founderExperience', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Ideal Customer Persona</label>
            <textarea className={textareaClass} rows={3} placeholder="Describe your ideal customer: age, occupation, habits, pain points, what they read, where they hang out..." value={input.targetCustomerPersona || ''} onChange={e => setField('targetCustomerPersona', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Primary Acquisition Channel</label>
            <select className={inputClass} value={input.primaryChannel || ''} onChange={e => setField('primaryChannel', e.target.value)}>
              <option value="">Select preferred channel...</option>
              {['Social Media (Instagram/FB)', 'SEO / Content Marketing', 'Referrals / Word of Mouth', 'Cold Outreach (Email/Call)', 'WhatsApp / Local Communities', 'Google Ads / Meta Ads', 'Walk-in / Footfall', 'Partnerships', 'Events / Pop-ups'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Existing Licences / Registrations (comma-separated)</label>
            <input className={inputClass} placeholder="e.g. FSSAI, GST, Udyam MSME, Shop & Establishment" value={input.existingLicences?.join(', ') || ''} onChange={e => setField('existingLicences', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
          </div>
        </div>
      );

      case 5: return (
        <div className="space-y-5">
          <h3 className="font-bold uppercase text-sm border-b-2 border-[#141414] pb-2">Report Configuration</h3>
          <p className="text-sm opacity-60">Select which sections to include in your comprehensive business documentation report.</p>
          {[
            { key: 'includeFinancials', label: '📊 Financial Projections', desc: 'Unit economics, 12-month P&L, 3 scenarios, pricing analysis, runway' },
            { key: 'includeCompetitors', label: '⚔️ Competitive Intelligence', desc: 'Competitor matrix, blue ocean grid, Five Forces, positioning statement' },
            { key: 'includeMarketing', label: '🚀 Marketing & Growth Strategy', desc: 'StoryBrand script, landing page wireframe, acquisition channels, launch sequence' },
            { key: 'includeRoadmap', label: '🗺️ 90-Day Roadmap', desc: 'Sprint plan, OKRs, SOPs, risk register, licensing checklist, team structure' },
            { key: 'includeSOPs', label: '📋 Standard Operating Procedures', desc: 'Included as part of roadmap — step-by-step operational playbooks' },
          ].map(({ key, label, desc }) => (
            <label key={key} className="flex items-start gap-3 p-3 neo-border cursor-pointer hover:bg-[#E4E3E0] transition-colors">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 accent-[#22C55E]"
                checked={!!input[key as keyof BusinessResearchInput]}
                onChange={e => setField(key as keyof BusinessResearchInput, e.target.checked as any)}
              />
              <div>
                <div className="font-bold text-sm">{label}</div>
                <div className="text-[11px] opacity-60 mt-0.5">{desc}</div>
              </div>
            </label>
          ))}
          <div className="p-4 bg-[#22C55E]/5 border-l-4 border-[#22C55E] text-sm">
            <strong>Note:</strong> The <em>Business Plan, JTBD Analysis, Offer Design,</em> and <em>Monopoly Analysis</em> are always included in every report as the foundation.
          </div>
        </div>
      );
    }
  };

  // ── START RESEARCH ─────────────────────────────────────────────────────────

  const startResearch = async () => {
    if (!input.businessType || !input.location || !input.totalBudget) {
      alert('Please fill in Business Type, Location, and Budget before starting.');
      return;
    }
    setStage('running');
    setProgressEvents([]);
    setProgressPct(0);
    setReport(null);

    try {
      const resp = await fetch(`${API_BASE}/business-research/full-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!resp.body) throw new Error('No readable stream');
      const reader = resp.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let currentEvent = '';
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.substring(7).trim();
          } else if (line.startsWith('data: ')) {
            const dataStr = line.substring(6).trim();
            if (!dataStr) continue;
            try {
              const data = JSON.parse(dataStr);
              if (currentEvent === 'report_ready') {
                setReport(data.report);
                setFirewallViolations(data.firewall_violations_total || 0);
                setStage('results');
              } else {
                setProgressPct(data.pct || 0);
                setProgressEvents(prev => [...prev, { type: currentEvent as any, ...data }]);
                eventsRef.current?.scrollTo({ top: eventsRef.current.scrollHeight, behavior: 'smooth' });
              }
            } catch { /* ignore */ }
          }
        }
      }
    } catch (err) {
      setProgressEvents(prev => [...prev, {
        type: 'error',
        message: `Connection failed: ${err}. Ensure backend is running on port 5001.`,
      }]);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  if (stage === 'form') {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="bg-[#141414] text-white p-6 neo-border mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Icon.Sparkles className="w-7 h-7 text-[#22C55E]" />
            <h1 className="text-2xl font-black uppercase tracking-tight">Business Research Engine</h1>
          </div>
          <p className="text-sm opacity-70">
            Complete AI-powered business documentation: plan, financials, competitive intelligence, 
            marketing strategy & 90-day execution roadmap — all grounded in verified local data.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {['JTBD Analysis', 'Hormozi Offer Design', 'Thiel Monopoly Map', 'StoryBrand Script', 'Blue Ocean Grid', 'SOPs & Risk Register'].map(tag => (
              <span key={tag} className="px-2 py-0.5 text-[10px] font-bold bg-[#22C55E] text-white">{tag}</span>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white neo-border p-6 md:p-8">
          <StepIndicator step={formStep} total={5} />

          <div className="mb-6">{renderStep()}</div>

          <div className="flex justify-between items-center border-t-2 border-[#141414] pt-4">
            <button
              onClick={() => setFormStep(s => Math.max(1, s - 1) as FormStep)}
              disabled={formStep === 1}
              className="px-5 py-2 neo-border font-bold uppercase text-sm disabled:opacity-30"
            >
              ← Back
            </button>
            <span className="text-xs font-mono opacity-50">Step {formStep} of 5</span>
            {formStep < 5 ? (
              <button
                onClick={() => setFormStep(s => Math.min(5, s + 1) as FormStep)}
                className="px-5 py-2 bg-[#141414] text-white font-bold uppercase text-sm neo-border flex items-center gap-2"
              >
                Next <Icon.ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={startResearch}
                className="px-6 py-3 bg-[#22C55E] text-white font-black uppercase neo-border flex items-center gap-2 hover:bg-[#16a34a] transition-colors"
              >
                <Icon.Sparkles className="w-5 h-5" />
                Generate Full Report
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'running') {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-8">
        <div className="bg-white neo-border p-6">
          <div className="flex items-center gap-4 mb-5 pb-4 border-b-2 border-[#141414]">
            <Icon.Loader className="w-8 h-8 text-[#22C55E]" />
            <div>
              <h2 className="text-xl font-black uppercase">Generating Research Report</h2>
              <p className="text-sm font-mono opacity-50">{input.businessType} · {input.location} · ₹{input.totalBudget.toLocaleString('en-IN')}</p>
            </div>
          </div>
          <ProgressBar pct={progressPct} />
          <div className="mt-2 text-right text-xs font-mono opacity-50">{Math.round(progressPct)}%</div>
          <div ref={eventsRef} className="mt-4 space-y-2 max-h-64 overflow-y-auto no-scrollbar font-mono text-xs p-3 bg-[#E4E3E0] neo-border">
            {progressEvents.map((ev, i) => (
              <div key={i} className="flex gap-2 items-start border-b border-[#141414]/10 pb-1.5">
                <span className="text-[#22C55E] flex-shrink-0">
                  {ev.type === 'section_complete' ? '✓' : ev.type === 'error' ? '✗' : '▶'}
                </span>
                <div>
                  {ev.section && <span className="font-bold">[{ev.label || ev.section}] </span>}
                  {ev.stage && !ev.section && <span className="opacity-60">[{ev.stage}] </span>}
                  {ev.message}
                </div>
              </div>
            ))}
            {progressEvents.length === 0 && <div className="opacity-40">Initializing research engine...</div>}
          </div>
          <div className="mt-4 text-center text-xs font-mono opacity-40 animate-pulse">
            This may take 60–120 seconds. Running 5 AI analysis modules in sequence...
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'results' && report) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 pb-32">
        {/* Top bar */}
        <div className="bg-[#141414] text-white p-6 neo-border mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase opacity-50 mb-1">Full Business Research Report</div>
              <h1 className="text-2xl font-black uppercase">{input.businessName || input.businessType}</h1>
              <p className="text-sm opacity-60 mt-1">{input.location} · {report._meta.input_summary.format} · ₹{input.totalBudget.toLocaleString('en-IN')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 text-xs font-bold bg-[#22C55E] text-white">
                {report._meta.evidence_sources.rentals_found} Rentals Found
              </span>
              <span className="px-3 py-1 text-xs font-bold bg-[#3B82F6] text-white">
                {report._meta.evidence_sources.competitors_found} Competitors
              </span>
              {firewallViolations > 0 && (
                <span className="px-3 py-1 text-xs font-bold bg-[#FBBF24] text-[#141414]">
                  ⚠️ {firewallViolations} Claims Moderated
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Firewall notice */}
        {firewallViolations > 0 && (
          <div className="mb-4 p-3 bg-[#FEF3C7] border-l-4 border-[#F59E0B] text-sm text-[#92400E] neo-border">
            🔒 <strong>Hallucination Firewall:</strong> {firewallViolations} AI claim(s) were moderated to remove overconfident assertions. All remaining claims are grounded in evidence or labeled [ESTIMATE].
          </div>
        )}

        {/* Report sections */}
        {report.business_plan && <BusinessPlanSection plan={report.business_plan} />}
        {report.financials && <FinancialsSection fin={report.financials} />}
        {report.competitive_analysis && <CompetitiveSection comp={report.competitive_analysis} />}
        {report.marketing_strategy && <MarketingSection mkt={report.marketing_strategy} />}
        {report.roadmap && <RoadmapSection roadmap={report.roadmap} />}

        {/* Reset */}
        <div className="mt-8 flex gap-4">
          <button onClick={() => { setStage('form'); setFormStep(1); }} className="flex-1 py-4 neo-border font-bold uppercase text-center hover:bg-[#E4E3E0] transition-colors">
            ← New Research
          </button>
          <button onClick={() => setStage('form')} className="px-6 py-4 bg-[#141414] text-white font-bold uppercase neo-border hover:bg-[#333] transition-colors">
            Edit Inputs & Regenerate
          </button>
        </div>
      </div>
    );
  }

  return null;
}
