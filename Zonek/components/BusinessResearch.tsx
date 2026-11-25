/**
 * BusinessResearch.tsx — Zonek / Bridgehead
 * ─────────────────────────────────────────────────────────────────────────────
 * Ground-Truth Business Research & Feasibility Engine
 *
 * Architecture:
 *   1. Intake Form (5-step progressive disclosure, pre-filled from onboarding profile)
 *   2. Saved Reports Drawer / History Switcher
 *   3. Live Research Terminal (telemetry log + animated synthesis status)
 *   4. Results Layout with Sticky 5-Tab SubNavbar:
 *      • Tab 1: Overview & Feasibility (Verdict, JTBD, Hormozi Offer, Thiel Moat, MVP)
 *      • Tab 2: Location & Rentals (Real commercial listings, price/sqft, lease diligence)
 *      • Tab 3: Competitors & Longevity (Competitor matrix, Blue Ocean ERRC grid, gaps)
 *      • Tab 4: Financial Blueprint (Day-0 capex breakdown, unit economics, 12m P&L, scenarios)
 *      • Tab 5: Gov Schemes & SOPs (Mudra/PMEGP subsidies, licenses, operational SOPs)
 *   5. 1-Click Investor PDF Export Engine
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { BusinessResearchInput, FullBusinessReport, BusinessResearchSSEEvent } from '../types';
import ResearchSubNavbar, { ResearchTabId } from './research/ResearchSubNavbar';
import OverviewFeasibilityTab from './research/OverviewFeasibilityTab';
import LocationRentalsTab from './research/LocationRentalsTab';
import CompetitorsLongevityTab from './research/CompetitorsLongevityTab';
import FinancialBlueprintTab from './research/FinancialBlueprintTab';
import GovSchemesComplianceTab from './research/GovSchemesComplianceTab';
import LiveResearchTerminal from './research/LiveResearchTerminal';
import ExportPdfModal from './research/ExportPdfModal';

// ─── Minimal Icons ───────────────────────────────────────────────────────────
const Icon = {
  Sparkles:   ({ className = '' }) => <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>,
  Check:      ({ className = '' }) => <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>,
  ArrowRight: ({ className = '' }) => <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>,
  Loader:     ({ className = '' }) => <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>,
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const DEFAULT_INPUT: BusinessResearchInput = {
  businessType: '',
  businessDescription: '',
  businessFormat: 'Brick & Mortar',
  location: '',
  totalBudget: 1000000,
  workingCapital: 200000,
  pricingModel: 'Per-unit',
  businessModel: 'B2C',
  spaceRequired: '500–1000 sqft',
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

interface SavedReportSummary {
  id: string;
  report_title: string;
  business_type: string;
  location: string;
  budget_inr: number;
  verdict: 'GO' | 'CAUTION' | 'STOP';
  firewall_violations: number;
  is_starred: boolean;
  pdf_url?: string;
  created_at: string;
}

const verdictStyle = (v: 'GO' | 'CAUTION' | 'STOP' | undefined) => {
  if (v === 'GO') return { bg: 'bg-[#22C55E]', text: 'text-white' };
  if (v === 'CAUTION') return { bg: 'bg-[#FBBF24]', text: 'text-[#141414]' };
  return { bg: 'bg-[#EF4444]', text: 'text-white' };
};

const inputClass = "w-full p-3 neo-border bg-[#E4E3E0] text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E]";
const labelClass = "block text-[11px] font-bold uppercase mb-1";
const textareaClass = `${inputClass} resize-none`;

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

// ─── MAIN ENGINE COMPONENT ────────────────────────────────────────────────────
export default function BusinessResearch() {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [stage, setStage] = useState<Stage>('form');
  const [formStep, setFormStep] = useState<FormStep>(1);
  const [input, setInput] = useState<BusinessResearchInput>({ ...DEFAULT_INPUT });
  const [progressEvents, setProgressEvents] = useState<BusinessResearchSSEEvent[]>([]);
  const [progressPct, setProgressPct] = useState(0);
  const [report, setReport] = useState<FullBusinessReport | null>(null);
  const [firewallViolations, setFirewallViolations] = useState(0);

  // Tab sub-navbar state
  const [researchTab, setResearchTab] = useState<ResearchTabId>('overview');
  const [showExportPdf, setShowExportPdf] = useState(false);
  const [evidenceData, setEvidenceData] = useState<{ rentals: any[]; competitors: any[]; schemes: any[] }>({
    rentals: [],
    competitors: [],
    schemes: [],
  });

  // History state
  const [historyList, setHistoryList] = useState<SavedReportSummary[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const setField = useCallback(<K extends keyof BusinessResearchInput>(key: K, val: BusinessResearchInput[K]) => {
    setInput(prev => ({ ...prev, [key]: val }));
  }, []);

  // Pre-fill from onboarding profile on mount
  useEffect(() => {
    try {
      const savedUserStr = localStorage.getItem('user');
      if (savedUserStr) {
        const u = JSON.parse(savedUserStr);
        setInput(prev => ({
          ...prev,
          businessType: u.business_type_interest || prev.businessType,
          location: u.primary_city || prev.location,
          currentStage: u.business_stage || prev.currentStage,
          founderExperience: u.founder_experience || prev.founderExperience,
          totalBudget:
            u.total_budget_range === 'Under ₹5L' ? 400000 :
            u.total_budget_range === '₹5–10L' ? 800000 :
            u.total_budget_range === '₹10–25L' ? 1800000 :
            u.total_budget_range === '₹25L+' ? 3500000 : prev.totalBudget,
        }));
      }
    } catch { /* ignore */ }
  }, []);

  // Fetch report history when History tab is selected
  const fetchHistory = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setHistoryError('Please sign in to view your research history.');
      return;
    }
    setIsLoadingHistory(true);
    setHistoryError(null);
    try {
      const res = await fetch(`${API_BASE}/business-research/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setHistoryList(data.data || []);
      } else {
        setHistoryError(data.error || 'Failed to fetch history');
      }
    } catch (err: any) {
      setHistoryError(err.message || 'Network error loading history');
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  const loadSavedReport = async (reportId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/business-research/report/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        setReport(data.data.report_data);
        setFirewallViolations(data.data.firewall_violations || 0);
        setInput(prev => ({
          ...prev,
          businessType: data.data.business_type || prev.businessType,
          location: data.data.location || prev.location,
          totalBudget: data.data.budget_inr || prev.totalBudget,
        }));
        setStage('results');
        setResearchTab('overview');
        setActiveTab('new');
      }
    } catch (err) {
      console.error('Failed to load saved report:', err);
    }
  };

  const toggleStar = async (reportId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/business-research/report/${reportId}/star`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setHistoryList(prev =>
          prev.map(r => r.id === reportId ? { ...r, is_starred: !r.is_starred } : r)
        );
      }
    } catch (err) {
      console.error('Failed to toggle star:', err);
    }
  };

  const deleteSavedReport = async (reportId: string) => {
    if (!window.confirm('Are you sure you want to delete this saved report?')) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/business-research/report/${reportId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setHistoryList(prev => prev.filter(r => r.id !== reportId));
      }
    } catch (err) {
      console.error('Failed to delete report:', err);
    }
  };

  // ─── START RESEARCH STREAM ────────────────────────────────────────────────
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
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token && token !== 'null') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const resp = await fetch(`${API_BASE}/business-research/full-report`, {
        method: 'POST',
        headers,
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
                if (data.evidence_summary) {
                  setEvidenceData(data.evidence_summary);
                }
                setStage('results');
                setResearchTab('overview');
                fetchHistory();
              } else {
                setProgressPct(data.pct || 0);
                setProgressEvents(prev => [...prev, { type: currentEvent as any, ...data }]);
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

  // ─── STEP FORM RENDERER ───────────────────────────────────────────────────
  const renderStep = () => {
    switch (formStep) {
      case 1: return (
        <div className="space-y-5">
          <h3 className="font-bold uppercase text-sm border-b-2 border-[#141414] pb-2">Core Business Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Business Name (optional)</label>
              <input className={inputClass} placeholder="e.g. Chai & Samosa Co." value={input.businessName || ''} onChange={e => setField('businessName', e.target.value)} />
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
              <label className={labelClass}>Target City / Locality *</label>
              <input required className={inputClass} placeholder="e.g. Koramangala, Bangalore / Bandra, Mumbai" value={input.location} onChange={e => setField('location', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Space Footprint</label>
              <select className={inputClass} value={input.spaceRequired || '500–1000 sqft'} onChange={e => setField('spaceRequired', e.target.value)}>
                <option value="<500 sqft">&lt; 500 sqft (Kiosk / Small)</option>
                <option value="500–1000 sqft">500–1000 sqft (Standard)</option>
                <option value=">1000 sqft">&gt; 1000 sqft (Large / Multi-floor)</option>
                <option value="Remote">Remote / Cloud (No physical footprint)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Target Customer Profile</label>
              <input className={inputClass} placeholder="e.g. Tech workers, College students, Families" value={input.targetMarket || ''} onChange={e => setField('targetMarket', e.target.value)} />
            </div>
          </div>
        </div>
      );

      case 2: return (
        <div className="space-y-5">
          <h3 className="font-bold uppercase text-sm border-b-2 border-[#141414] pb-2">Financial Model</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Total Available Budget (₹) *</label>
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
              <input type="number" min="0" className={inputClass} value={input.avgTicketSize || ''} onChange={e => setField('avgTicketSize', Number(e.target.value))} placeholder="Expected price per transaction" />
            </div>
          </div>
        </div>
      );

      case 3: return (
        <div className="space-y-5">
          <h3 className="font-bold uppercase text-sm border-b-2 border-[#141414] pb-2">Business Model & Differentiation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Business Model</label>
              <select className={inputClass} value={input.businessModel || 'B2C'} onChange={e => setField('businessModel', e.target.value)}>
                {['B2C', 'B2B', 'B2B2C', 'Marketplace / Platform', 'SaaS', 'D2C', 'Franchise'].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Current Stage</label>
              <select className={inputClass} value={input.currentStage || 'Idea'} onChange={e => setField('currentStage', e.target.value)}>
                {['Idea', 'Validated (customer interviews done)', 'MVP Built', 'Operating (paying customers)', 'Scaling'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Unique Value Proposition (UVP)</label>
            <textarea className={textareaClass} rows={2} placeholder="What makes your business different from local alternatives? Be specific." value={input.uniqueValueProposition || ''} onChange={e => setField('uniqueValueProposition', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Known Competitors (comma-separated)</label>
            <input className={inputClass} placeholder="e.g. Starbucks, Third Wave, Local Darshini" value={input.knownCompetitors?.join(', ') || ''} onChange={e => setField('knownCompetitors', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
          </div>
          <div>
            <label className={labelClass}>Your Key Differentiators (comma-separated)</label>
            <input className={inputClass} placeholder="e.g. 24/7 drive-thru, Specialty origin beans, Affordable combo pricing" value={input.differentiators?.join(', ') || ''} onChange={e => setField('differentiators', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Launch Timeline</label>
              <select className={inputClass} value={input.launchTimeline || '3 months'} onChange={e => setField('launchTimeline', e.target.value)}>
                {['< 1 month', '1–2 months', '3 months', '6 months', '12 months'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Expected Launch Team Size</label>
              <input type="number" min="1" max="100" className={inputClass} value={input.expectedTeamSize || 1} onChange={e => setField('expectedTeamSize', Number(e.target.value))} />
            </div>
          </div>
        </div>
      );

      case 4: return (
        <div className="space-y-5">
          <h3 className="font-bold uppercase text-sm border-b-2 border-[#141414] pb-2">Founder Background & Acquisition</h3>
          <div>
            <label className={labelClass}>Founder Domain Experience</label>
            <input className={inputClass} placeholder="e.g. 4 years operations in quick service restaurants, ex-chef..." value={input.founderExperience || ''} onChange={e => setField('founderExperience', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Target Customer Persona</label>
            <textarea className={textareaClass} rows={3} placeholder="Describe your ideal daily customer: age, profession, routines, urgent problems..." value={input.targetCustomerPersona || ''} onChange={e => setField('targetCustomerPersona', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Primary Customer Acquisition Channel</label>
            <select className={inputClass} value={input.primaryChannel || ''} onChange={e => setField('primaryChannel', e.target.value)}>
              <option value="">Select primary channel...</option>
              {['Walk-in / Physical Footfall', 'Instagram / Social Media', 'WhatsApp / Local Communities', 'Google Maps / Local SEO', 'Referrals / Word of Mouth', 'Cold Outreach / B2B Sales', 'Meta & Google Paid Ads', 'Partnerships / Pop-ups'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Existing Licences Held (comma-separated)</label>
            <input className={inputClass} placeholder="e.g. FSSAI, GST, Udyam MSME, Shop Act" value={input.existingLicences?.join(', ') || ''} onChange={e => setField('existingLicences', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
          </div>
        </div>
      );

      case 5: return (
        <div className="space-y-5">
          <h3 className="font-bold uppercase text-sm border-b-2 border-[#141414] pb-2">Synthesis Modules Configuration</h3>
          <p className="text-sm opacity-60">Select which deep intelligence modules to run in your report.</p>
          {[
            { key: 'includeFinancials', label: '📊 Financial Blueprint', desc: 'Itemized setup capex, unit economics, 12-month P&L, 3 break-even scenarios' },
            { key: 'includeCompetitors', label: '⚔️ Competitive Intelligence', desc: 'Competitor matrix, Blue Ocean ERRC grid, Porter 5 forces, positioning' },
            { key: 'includeMarketing', label: '🚀 StoryBrand Marketing', desc: 'StoryBrand script, landing page wireframe, channel CAC benchmarks' },
            { key: 'includeRoadmap', label: '🏛️ Gov Schemes & SOPs', desc: 'Mudra/PMEGP capital subsidies, statutory licensing checklist, operational SOPs' },
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
          <div className="p-4 bg-[#22C55E]/5 border-l-4 border-[#22C55E] text-xs">
            <strong>Foundational Standard:</strong> <em>Executive Feasibility Verdict, JTBD Analysis, Hormozi Offer Design,</em> and <em>Peter Thiel Monopoly Moat</em> are automatically included in every run.
          </div>
        </div>
      );
    }
  };

  // ─── STAGE 1: INTAKE & HISTORY ───────────────────────────────────────────
  if (stage === 'form') {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Navigation Tabs: New vs History */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-5 py-2.5 font-bold uppercase text-xs neo-border transition-all ${
              activeTab === 'new'
                ? 'bg-[#141414] text-white shadow-sm'
                : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
            }`}
          >
            ⚡ Run New Research
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-5 py-2.5 font-bold uppercase text-xs neo-border transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-[#141414] text-white shadow-sm'
                : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
            }`}
          >
            📂 Saved Reports {historyList.length > 0 && `(${historyList.length})`}
          </button>
        </div>

        {/* Tab 1: New Research Form */}
        {activeTab === 'new' ? (
          <>
            <div className="bg-[#141414] text-white p-6 neo-border mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Icon.Sparkles className="w-7 h-7 text-[#22C55E]" />
                <h1 className="text-2xl font-black uppercase tracking-tight">Zonek Research Engine</h1>
              </div>
              <p className="text-sm opacity-70">
                AI-synthesized business feasibility intelligence grounded in micro-location commercial rentals,
                competitor pricing, unit economics, and Central/State MSME schemes.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {['Micro-Location Evidence', 'Hormozi Offer Design', 'Thiel Monopoly Map', 'Unit Economics', 'Mudra / PMEGP Schemes'].map(tag => (
                  <span key={tag} className="px-2 py-0.5 text-[10px] font-bold bg-[#22C55E] text-white">{tag}</span>
                ))}
              </div>
            </div>

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
                    Synthesize Full Report
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Tab 2: Saved Reports History */
          <div className="bg-white neo-border p-6 md:p-8">
            <div className="flex items-center justify-between pb-4 border-b-2 border-[#141414] mb-6">
              <div>
                <h2 className="text-xl font-black uppercase">Your Research History</h2>
                <p className="text-xs opacity-60">Past feasibility evaluations saved to your account.</p>
              </div>
              <button
                onClick={fetchHistory}
                className="text-xs font-bold uppercase px-3 py-1.5 neo-border hover:bg-[#E4E3E0]"
              >
                ↻ Refresh
              </button>
            </div>

            {isLoadingHistory && (
              <div className="py-12 text-center text-sm font-mono opacity-50 flex items-center justify-center gap-2">
                <Icon.Loader className="w-5 h-5 text-[#22C55E]" /> Loading your saved reports...
              </div>
            )}

            {historyError && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm neo-border mb-4">
                {historyError}
              </div>
            )}

            {!isLoadingHistory && !historyError && historyList.length === 0 && (
              <div className="py-12 text-center">
                <div className="text-3xl mb-2">📄</div>
                <h3 className="font-bold uppercase text-sm mb-1">No reports saved yet</h3>
                <p className="text-xs opacity-60 max-w-sm mx-auto mb-4">
                  Run a research query to generate and store your first verified business feasibility report.
                </p>
                <button
                  onClick={() => setActiveTab('new')}
                  className="px-4 py-2 bg-[#22C55E] text-white font-bold uppercase text-xs neo-border"
                >
                  Start New Research
                </button>
              </div>
            )}

            <div className="space-y-4">
              {historyList.map(item => {
                const vs = verdictStyle(item.verdict);
                return (
                  <div
                    key={item.id}
                    className="p-5 neo-border bg-[#F5F4F0] hover:bg-[#EAE8E2] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 text-[10px] font-black neo-border ${vs.bg} ${vs.text}`}>
                          {item.verdict}
                        </span>
                        <span className="font-black text-base">{item.report_title}</span>
                        {item.is_starred && <span className="text-amber-500 text-sm">★</span>}
                      </div>
                      <div className="flex items-center gap-3 text-xs opacity-60 flex-wrap">
                        <span>📍 {item.location}</span>
                        <span>💰 ₹{Number(item.budget_inr || 0).toLocaleString('en-IN')}</span>
                        <span>📅 {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => toggleStar(item.id)}
                        title={item.is_starred ? 'Unstar' : 'Star'}
                        className="px-2.5 py-1.5 neo-border text-xs bg-white hover:bg-[#E4E3E0]"
                      >
                        {item.is_starred ? '★' : '☆'}
                      </button>
                      <button
                        onClick={() => loadSavedReport(item.id)}
                        className="px-4 py-1.5 bg-[#141414] text-white font-bold uppercase text-xs neo-border hover:bg-[#333] transition-colors"
                      >
                        View Report →
                      </button>
                      <button
                        onClick={() => deleteSavedReport(item.id)}
                        title="Delete"
                        className="px-2.5 py-1.5 neo-border text-xs bg-white text-red-600 hover:bg-red-50"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── STAGE 2: LIVE TELEMETRY TERMINAL ────────────────────────────────────
  if (stage === 'running') {
    return (
      <LiveResearchTerminal
        businessType={input.businessType}
        location={input.location}
        budgetInr={input.totalBudget}
        progressPct={progressPct}
        events={progressEvents}
      />
    );
  }

  // ─── STAGE 3: 5-TAB RESEARCH INTELLIGENCE SUITE ──────────────────────────
  if (stage === 'results' && report) {
    const verdict = report.business_plan?.executive_summary?.verdict || 'CAUTION';

    return (
      <div className="pb-32 bg-[#F5F4F0] min-h-screen">
        {/* Sticky 5-Tab Sub-Navbar */}
        <ResearchSubNavbar
          activeTab={researchTab}
          onTabChange={setResearchTab}
          verdict={verdict}
          rentalsCount={evidenceData.rentals?.length || report._meta?.evidence_sources?.rentals_found || 0}
          competitorsCount={evidenceData.competitors?.length || report._meta?.evidence_sources?.competitors_found || 0}
          schemesCount={evidenceData.schemes?.length || report._meta?.evidence_sources?.gov_schemes_found || 0}
          onExportPdf={() => setShowExportPdf(true)}
          onBackToForm={() => setStage('form')}
        />

        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6">
          {/* Hallucination Firewall Notice */}
          {firewallViolations > 0 && (
            <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-400 text-sm text-amber-950 shadow-[2px_2px_0px_0px_#000]">
              🔒 <strong>Hallucination Firewall Active:</strong> {firewallViolations} AI claim(s) were moderated to remove overconfident assertions. All numbers are grounded in local verified evidence.
            </div>
          )}

          {/* Tab 1: Overview & Feasibility */}
          {researchTab === 'overview' && report.business_plan && (
            <OverviewFeasibilityTab
              plan={report.business_plan}
              businessName={input.businessName}
              businessType={input.businessType}
              location={input.location}
              budgetInr={input.totalBudget}
            />
          )}

          {/* Tab 2: Location & Rentals */}
          {researchTab === 'location' && (
            <LocationRentalsTab
              location={input.location}
              spaceRequired={input.spaceRequired}
              businessType={input.businessType}
              totalBudget={input.totalBudget}
              rentals={evidenceData.rentals}
            />
          )}

          {/* Tab 3: Competitors & Longevity */}
          {researchTab === 'competitors' && report.competitive_analysis && (
            <CompetitorsLongevityTab
              comp={report.competitive_analysis}
              location={input.location}
              businessType={input.businessType}
            />
          )}

          {/* Tab 4: Financial Blueprint */}
          {researchTab === 'financials' && report.financials && (
            <FinancialBlueprintTab
              fin={report.financials}
              userBudget={input.totalBudget}
            />
          )}

          {/* Tab 5: Gov Schemes & Compliance */}
          {researchTab === 'compliance' && report.roadmap && (
            <GovSchemesComplianceTab
              roadmap={report.roadmap}
              location={input.location}
              businessType={input.businessType}
              schemes={evidenceData.schemes}
            />
          )}
        </div>

        {/* Printable Investor PDF Modal */}
        {showExportPdf && (
          <ExportPdfModal
            report={report}
            businessName={input.businessName}
            businessType={input.businessType}
            location={input.location}
            budgetInr={input.totalBudget}
            onClose={() => setShowExportPdf(false)}
          />
        )}
      </div>
    );
  }

  return null;
}
