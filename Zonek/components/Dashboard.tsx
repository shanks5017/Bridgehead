/**
 * Dashboard.tsx — Zonek / Bridgehead
 * ─────────────────────────────────────────────────────────────────────────────
 * Founder Command Center (Phase 2 Master Pillar)
 *
 * Provides a dual-state operational command center for entrepreneurs:
 *
 * 1. State A: Zero-Friction Launchpad (New Visitor / No Saved Venture)
 *    - Instant feasibility testing intake form.
 *    - Explanatory value pillars (Feasibility, Rent Ground Truth, Subsidies).
 *
 * 2. State B: Active Founder Command Center (Returning Founder with Venture)
 *    - HIGHLY CUSTOMIZABLE Launch Target Countdown (30d, 60d, 90d, 180d, 365d, or custom date).
 *    - Dynamic multi-phase milestone planner calibrated to founder's timeline.
 *    - Checkable daily & weekly execution tasks (with custom task creation).
 *    - Live budget burn & capital runway meter.
 *    - Venture switcher & 1-click actions (Open 5-Tab Dossier, Export Investor PDF).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, User, FullBusinessReport } from '../types';
import { ExportPdfModal } from './research/ExportPdfModal';
import {
  SparklesIcon,
  CheckIcon,
  PlusIcon,
  TrashIcon,
  ArrowRightIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  RocketIcon,
  LocationPinIcon
} from './icons';

interface DashboardProps {
  setView: (view: View) => void;
  currentUser: User | null;
}

interface SavedReportHeader {
  id: string;
  report_title: string;
  business_type: string;
  location: string;
  budget_inr: number;
  verdict: 'GO' | 'CAUTION' | 'STOP';
  is_starred: boolean;
  created_at: string;
}

interface TaskItem {
  id: string;
  title: string;
  category: 'legal' | 'space' | 'capex' | 'marketing' | 'operations';
  isCompleted: boolean;
  isCustom?: boolean;
}

const API_BASE = 'http://localhost:5001/api';

export const Dashboard: React.FC<DashboardProps> = ({ setView, currentUser }) => {
  // ─── Component State ───────────────────────────────────────────────────────
  const [reportsList, setReportsList] = useState<SavedReportHeader[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<FullBusinessReport | null>(null);
  const [activeReportMeta, setActiveReportMeta] = useState<SavedReportHeader | null>(null);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [isLoadingActiveReport, setIsLoadingActiveReport] = useState(false);

  // Quick Start Form state (State A)
  const [quickBizType, setQuickBizType] = useState('');
  const [quickLocation, setQuickLocation] = useState('');
  const [quickBudget, setQuickBudget] = useState(500000);
  const [quickTimeline, setQuickTimeline] = useState('90');

  // Timeline & Countdown State (State B)
  const [timelineDays, setTimelineDays] = useState<number>(90);
  const [targetLaunchDate, setTargetLaunchDate] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [isEditingTimeline, setIsEditingTimeline] = useState(false);
  const [customDaysInput, setCustomDaysInput] = useState<string>('90');
  const [customDatePicker, setCustomDatePicker] = useState<string>('');

  // Live Countdown Ticker
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    progressPct: 0,
  });

  // Tasks Checklist State
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed' | 'legal' | 'space' | 'capex' | 'marketing' | 'operations'>('all');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<'legal' | 'space' | 'capex' | 'marketing' | 'operations'>('operations');
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Export PDF Modal
  const [showExportPdf, setShowExportPdf] = useState(false);

  // ─── 1. Fetch User Reports on Mount ────────────────────────────────────────
  const fetchReports = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoadingReports(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/business-research/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        setReportsList(data.data);
        if (data.data.length > 0 && !selectedReportId) {
          setSelectedReportId(data.data[0].id);
        }
      }
    } catch (err) {
      console.warn('Dashboard fetchReports error:', err);
    } finally {
      setIsLoadingReports(false);
    }
  }, [selectedReportId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // ─── 2. Fetch Single Full Report when selectedReportId changes ─────────────
  useEffect(() => {
    if (!selectedReportId) {
      setActiveReport(null);
      setActiveReportMeta(null);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    let isMounted = true;
    setIsLoadingActiveReport(true);

    fetch(`${API_BASE}/business-research/report/${selectedReportId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.success && data.data) {
          const reportRow = data.data;
          setActiveReport(reportRow.report_data);
          setActiveReportMeta({
            id: reportRow.id,
            report_title: reportRow.report_title,
            business_type: reportRow.business_type,
            location: reportRow.location,
            budget_inr: reportRow.budget_inr,
            verdict: reportRow.verdict,
            is_starred: reportRow.is_starred,
            created_at: reportRow.created_at,
          });

          // Initialize Timeline Configuration for this report
          const savedTimelineKey = `zonek_timeline_${reportRow.id}`;
          const savedTimeline = localStorage.getItem(savedTimelineKey);

          let configuredDays = 90;
          let configStartDate = reportRow.created_at || new Date().toISOString();
          let configTargetDate = '';

          if (savedTimeline) {
            try {
              const parsed = JSON.parse(savedTimeline);
              configuredDays = parsed.timelineDays || 90;
              configStartDate = parsed.startDate || configStartDate;
              configTargetDate = parsed.targetLaunchDate;
            } catch {}
          } else {
            // Calibrate timeline default from report input if available
            const stage = reportRow.report_data?._meta?.input_summary?.stage;
            if (stage === '< 1 month') configuredDays = 30;
            else if (stage === '1–2 months') configuredDays = 60;
            else if (stage === '6 months') configuredDays = 180;
            else if (stage === '12 months') configuredDays = 365;
            else configuredDays = 90;

            const startObj = new Date(configStartDate);
            const targetObj = new Date(startObj.getTime() + configuredDays * 24 * 60 * 60 * 1000);
            configTargetDate = targetObj.toISOString();
          }

          setTimelineDays(configuredDays);
          setStartDate(configStartDate);
          setTargetLaunchDate(configTargetDate);
          setCustomDaysInput(configuredDays.toString());
          setCustomDatePicker(configTargetDate ? configTargetDate.split('T')[0] : '');

          // Initialize Tasks for this report
          const savedTasksKey = `zonek_tasks_${reportRow.id}`;
          const savedTasks = localStorage.getItem(savedTasksKey);

          if (savedTasks) {
            try {
              setTasks(JSON.parse(savedTasks));
            } catch {
              generateDefaultTasks(reportRow.report_data);
            }
          } else {
            generateDefaultTasks(reportRow.report_data);
          }
        }
      })
      .catch(err => {
        console.warn('Failed to load active report:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingActiveReport(false);
      });

    return () => { isMounted = false; };
  }, [selectedReportId]);

  // ─── 3. Default Tasks Generator from Report ────────────────────────────────
  const generateDefaultTasks = (rep: FullBusinessReport) => {
    const list: TaskItem[] = [];

    // Add legal licenses
    (rep?.roadmap?.licensing_checklist || []).forEach((lic, idx) => {
      list.push({
        id: `lic_${idx}`,
        title: `Obtain ${lic.licence} (${lic.authority})`,
        category: 'legal',
        isCompleted: lic.status === 'Completed',
      });
    });

    // Add space & site
    list.push({
      id: 'space_1',
      title: 'Finalize Commercial Lease Agreement & Deposit Terms',
      category: 'space',
      isCompleted: false,
    });
    list.push({
      id: 'space_2',
      title: 'Execute Interior Layout & Electrical Load Verification',
      category: 'space',
      isCompleted: false,
    });

    // Add capex items
    (rep?.financials?.startup_costs?.breakdown || []).slice(0, 4).forEach((cap, idx) => {
      list.push({
        id: `cap_${idx}`,
        title: `Procure ${cap.item}`,
        category: 'capex',
        isCompleted: false,
      });
    });

    // Add marketing tasks
    list.push({
      id: 'mkt_1',
      title: 'Configure Google My Business & Local Map Listing',
      category: 'marketing',
      isCompleted: false,
    });
    list.push({
      id: 'mkt_2',
      title: 'Setup Brand Assets & Pre-Launch Community Buzz Campaign',
      category: 'marketing',
      isCompleted: false,
    });

    // Add operations SOPs
    (rep?.roadmap?.sops || []).slice(0, 3).forEach((sop, idx) => {
      list.push({
        id: `sop_${idx}`,
        title: `Establish SOP: ${sop.process_name} (Owner: ${sop.owner})`,
        category: 'operations',
        isCompleted: false,
      });
    });

    setTasks(list);
    if (selectedReportId) {
      localStorage.setItem(`zonek_tasks_${selectedReportId}`, JSON.stringify(list));
    }
  };

  // ─── 4. Live Countdown Engine (Every 1 Second) ─────────────────────────────
  useEffect(() => {
    if (!targetLaunchDate) return;

    const calculateTime = () => {
      const now = new Date().getTime();
      const target = new Date(targetLaunchDate).getTime();
      const start = startDate ? new Date(startDate).getTime() : now;
      const totalDuration = Math.max(1, target - start);
      const elapsed = Math.max(0, now - start);
      const diff = target - now;

      const progress = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));

      if (diff <= 0) {
        setCountdown({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
          progressPct: 100,
        });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({
        days,
        hours,
        minutes,
        seconds,
        isExpired: false,
        progressPct: progress,
      });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [targetLaunchDate, startDate]);

  // ─── 5. Timeline Customization Handlers ─────────────────────────────────────
  const applyTimelinePreset = (days: number) => {
    const start = startDate ? new Date(startDate) : new Date();
    const newTarget = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    const targetIso = newTarget.toISOString();

    setTimelineDays(days);
    setTargetLaunchDate(targetIso);
    setCustomDaysInput(days.toString());
    setCustomDatePicker(targetIso.split('T')[0]);

    if (selectedReportId) {
      localStorage.setItem(`zonek_timeline_${selectedReportId}`, JSON.stringify({
        timelineDays: days,
        targetLaunchDate: targetIso,
        startDate: start.toISOString(),
      }));
    }
    setIsEditingTimeline(false);
  };

  const applyCustomTargetDate = (dateStr: string) => {
    if (!dateStr) return;
    const chosenTarget = new Date(dateStr);
    const start = startDate ? new Date(startDate) : new Date();
    const diffMs = chosenTarget.getTime() - start.getTime();
    const calculatedDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    const targetIso = chosenTarget.toISOString();

    setTimelineDays(calculatedDays);
    setTargetLaunchDate(targetIso);
    setCustomDaysInput(calculatedDays.toString());
    setCustomDatePicker(dateStr);

    if (selectedReportId) {
      localStorage.setItem(`zonek_timeline_${selectedReportId}`, JSON.stringify({
        timelineDays: calculatedDays,
        targetLaunchDate: targetIso,
        startDate: start.toISOString(),
      }));
    }
    setIsEditingTimeline(false);
  };

  // ─── 6. Task Handlers ──────────────────────────────────────────────────────
  const toggleTask = (taskId: string) => {
    setTasks(prev => {
      const updated = prev.map(t => t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t);
      if (selectedReportId) {
        localStorage.setItem(`zonek_tasks_${selectedReportId}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const addCustomTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: TaskItem = {
      id: `custom_${Date.now()}`,
      title: newTaskTitle.trim(),
      category: newTaskCategory,
      isCompleted: false,
      isCustom: true,
    };
    setTasks(prev => {
      const updated = [newTask, ...prev];
      if (selectedReportId) {
        localStorage.setItem(`zonek_tasks_${selectedReportId}`, JSON.stringify(updated));
      }
      return updated;
    });
    setNewTaskTitle('');
    setIsAddingTask(false);
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => {
      const updated = prev.filter(t => t.id !== taskId);
      if (selectedReportId) {
        localStorage.setItem(`zonek_tasks_${selectedReportId}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  // ─── 7. Navigation Actions ─────────────────────────────────────────────────
  const handleOpenFullDossier = () => {
    if (selectedReportId) {
      localStorage.setItem('bridgehead_selected_report_id', selectedReportId);
      setView(View.BUSINESS_RESEARCH);
    }
  };

  const handleStartQuickResearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickBizType || !quickLocation) return;

    localStorage.setItem('bridgehead_research_prefill', JSON.stringify({
      businessType: quickBizType,
      location: quickLocation,
      totalBudget: Number(quickBudget),
      launchTimeline: `${quickTimeline} days`,
    }));
    setView(View.BUSINESS_RESEARCH);
  };

  // ─── Dynamic Sprint Phase Calculator ───────────────────────────────────────
  const sprintPhases = useMemo(() => {
    const total = timelineDays;
    const p1End = Math.round(total * 0.25);
    const p2End = Math.round(total * 0.55);
    const p3End = Math.round(total * 0.85);

    return [
      {
        phase: 'Phase 1',
        title: 'Validation & Statutory Clearances',
        window: `Days 1–${p1End}`,
        desc: 'Commercial lease finalization, entity incorporation, Udyam MSME, FSSAI/Shop Act filing.',
        isActive: countdown.progressPct <= 25,
      },
      {
        phase: 'Phase 2',
        title: 'Capex Procurement & Fit-Out',
        window: `Days ${p1End + 1}–${p2End}`,
        desc: 'Core equipment procurement, interior fit-out, utility setup, supply chain vendor locking.',
        isActive: countdown.progressPct > 25 && countdown.progressPct <= 55,
      },
      {
        phase: 'Phase 3',
        title: 'Brand Seeding & Soft Testing',
        window: `Days ${p2End + 1}–${p3End}`,
        desc: 'Local micro-influencer outreach, staff training, Day-1 SOP dry-runs, Google Maps listing.',
        isActive: countdown.progressPct > 55 && countdown.progressPct <= 85,
      },
      {
        phase: 'Phase 4',
        title: 'Public Opening & Scale',
        window: `Days ${p3End + 1}–${total}`,
        desc: 'Grand public launch, paid customer onboarding, first 30-day unit economics reconciliation.',
        isActive: countdown.progressPct > 85,
      },
    ];
  }, [timelineDays, countdown.progressPct]);

  const filteredTasks = useMemo(() => {
    if (taskFilter === 'all') return tasks;
    if (taskFilter === 'pending') return tasks.filter(t => !t.isCompleted);
    if (taskFilter === 'completed') return tasks.filter(t => t.isCompleted);
    return tasks.filter(t => t.category === taskFilter);
  }, [tasks, taskFilter]);

  const completedTasksCount = useMemo(() => tasks.filter(t => t.isCompleted).length, [tasks]);
  const taskProgressPct = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;

  // ─── Financials Calculation ────────────────────────────────────────────────
  const allocatedBudget = activeReportMeta?.budget_inr || activeReport?._meta?.input_summary?.budget_inr || 500000;
  const setupCapex = activeReport?.financials?.startup_costs?.setup_total || Math.round(allocatedBudget * 0.65);
  const capitalBuffer = allocatedBudget - setupCapex;
  const runwayMonths = activeReport?.financials?.runway?.months_of_runway || 6;

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: LOADING STATE
  // ══════════════════════════════════════════════════════════════════════════
  if (isLoadingReports) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-foundation text-ink">
        <div className="w-12 h-12 border-4 border-ink border-t-accent-green animate-spin mb-4" />
        <h2 className="text-sm font-mono font-bold uppercase tracking-widest">Loading Founder Command Center...</h2>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: STATE A — ZERO-FRICTION VENTURE LAUNCHPAD (NO ACTIVE REPORTS)
  // ══════════════════════════════════════════════════════════════════════════
  if (reportsList.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-10">
        
        {/* Hero Header */}
        <div className="bg-ink text-foundation p-8 md:p-12 border-2 border-ink shadow-[6px_6px_0px_0px_#000]">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-green text-ink text-xs font-mono font-bold uppercase tracking-wider mb-4">
            <SparklesIcon className="w-4 h-4" />
            <span>Founder Operating System // Launchpad</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-tight">
            Own The Zone Before You Open The Door.
          </h1>
          <p className="text-sm md:text-base font-mono opacity-80 mt-3 max-w-2xl leading-relaxed">
            Eliminate blind commercial leases and unvalidated startup capital. Zonek generates ground-truth feasibility verdicts, itemized Indian capex blueprints, and customized multi-phase launch command centers.
          </p>
        </div>

        {/* Quick Launch Intake Form */}
        <div className="bg-white border-2 border-ink p-6 md:p-10 shadow-[5px_5px_0px_0px_#000]">
          <div className="flex items-center gap-3 pb-4 border-b-2 border-ink mb-6">
            <RocketIcon className="w-6 h-6 text-accent-green" />
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">Initialize Your Venture Command Center</h2>
              <p className="text-xs text-ink/60">Enter your business parameters to unlock feasibility metrics and launch execution checklist.</p>
            </div>
          </div>

          <form onSubmit={handleStartQuickResearch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider mb-2">
                  What business do you want to build? *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Specialty Coffee Shop, Cloud Kitchen, Crossfit Gym, SaaS"
                  value={quickBizType}
                  onChange={e => setQuickBizType(e.target.value)}
                  className="w-full p-3.5 bg-foundation border-2 border-ink text-sm font-bold focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider mb-2">
                  Target City & Neighborhood *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Indiranagar, Bangalore / Bandra West, Mumbai"
                  value={quickLocation}
                  onChange={e => setQuickLocation(e.target.value)}
                  className="w-full p-3.5 bg-foundation border-2 border-ink text-sm font-bold focus:outline-none focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider mb-2">
                  Total Available Capital (₹) *
                </label>
                <input
                  type="number"
                  step="50000"
                  min="50000"
                  required
                  value={quickBudget}
                  onChange={e => setQuickBudget(Number(e.target.value))}
                  className="w-full p-3.5 bg-foundation border-2 border-ink text-sm font-mono font-bold focus:outline-none focus:bg-white"
                />
                <span className="text-[11px] font-mono text-ink/60 mt-1 block">
                  Allocated: ₹{quickBudget.toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider mb-2">
                  Target Launch Horizon (Customizable) *
                </label>
                <select
                  value={quickTimeline}
                  onChange={e => setQuickTimeline(e.target.value)}
                  className="w-full p-3.5 bg-foundation border-2 border-ink text-sm font-bold focus:outline-none focus:bg-white"
                >
                  <option value="30">⚡ Fast-Track Launch (30 Days — Pop-ups, Kiosks, MVP)</option>
                  <option value="60">🏃 Rapid Sprint (60 Days — Retail, QSR, Tech MVP)</option>
                  <option value="90">🎯 Standard Rollout (90 Days — Cafes, Clinics, Boutiques)</option>
                  <option value="180">🏗️ Medium Buildout (180 Days / 6 Months — Heavy Capex, Gyms)</option>
                  <option value="365">🏛️ Long Horizon (365 Days / 1 Year — Manufacturing, Large scale)</option>
                </select>
                <span className="text-[11px] font-mono text-ink/60 mt-1 block">
                  Not locked to 90 days — fully adjustable anytime.
                </span>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-ink flex flex-col md:flex-row items-center justify-between gap-4">
              <span className="text-xs font-mono text-ink/60">
                🔒 Zero-Hallucination Framework · High-speed Groq 120B reasoning engine
              </span>
              <button
                type="submit"
                className="w-full md:w-auto px-8 py-4 bg-accent-green hover:bg-[#16a34a] text-ink font-black uppercase tracking-wider text-xs border-2 border-ink shadow-[3px_3px_0px_0px_#000] flex items-center justify-center gap-2 active:translate-x-[1px] active:translate-y-[1px] transition-all"
              >
                <span>Run Feasibility Engine & Setup Dashboard</span>
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Value Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white border-2 border-ink shadow-[4px_4px_0px_0px_#000]">
            <div className="text-2xl mb-2">📍</div>
            <h3 className="font-black uppercase text-sm mb-1">Micro-Market Ground Truth</h3>
            <p className="text-xs text-ink/70 leading-relaxed">
              Real commercial rental benchmarks (₹/sqft), verified deposit ratios, and physical space availability in your target neighborhood.
            </p>
          </div>

          <div className="p-6 bg-white border-2 border-ink shadow-[4px_4px_0px_0px_#000]">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-black uppercase text-sm mb-1">Indian Capex & Unit Economics</h3>
            <p className="text-xs text-ink/70 leading-relaxed">
              Itemized equipment pricing, realistic Gross Margins, CAC payback speed, and 12-month Pro-Forma cash burn models.
            </p>
          </div>

          <div className="p-6 bg-white border-2 border-ink shadow-[4px_4px_0px_0px_#000]">
            <div className="text-2xl mb-2">⏱️</div>
            <h3 className="font-black uppercase text-sm mb-1">Customizable Execution Clock</h3>
            <p className="text-xs text-ink/70 leading-relaxed">
              Whether launching in 30 days or 180 days, track your daily checkable sprint tasks, statutory licenses, and runway in real time.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER: STATE B — ACTIVE FOUNDER COMMAND CENTER (HIGHLY CUSTOMIZABLE)
  // ══════════════════════════════════════════════════════════════════════════
  const displayTitle = activeReportMeta?.report_title || activeReportMeta?.business_type || 'Active Venture';
  const displayLocation = activeReportMeta?.location || activeReport?._meta?.input_summary?.location || 'India';
  const displayVerdict = activeReportMeta?.verdict || activeReport?.business_plan?.executive_summary?.verdict || 'CAUTION';

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-8">
      
      {/* ── 1. Active Venture Switcher Bar ───────────────────────────────── */}
      <div className="bg-white border-2 border-ink p-4 md:p-6 shadow-[4px_4px_0px_0px_#000] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 text-xs font-black uppercase border-2 border-ink ${
            displayVerdict === 'GO' ? 'bg-accent-green text-white' :
            displayVerdict === 'CAUTION' ? 'bg-[#FBBF24] text-ink' :
            'bg-[#EF4444] text-white'
          }`}>
            {displayVerdict}
          </span>
          <div>
            <div className="text-[10px] font-mono font-bold uppercase text-ink/50">Active Command Venture</div>
            <h1 className="text-lg md:text-xl font-black uppercase text-ink tracking-tight flex items-center gap-2">
              <span>{displayTitle}</span>
              <span className="text-xs font-mono font-normal text-ink/60">· 📍 {displayLocation}</span>
            </h1>
          </div>
        </div>

        {/* Switcher & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {reportsList.length > 1 && (
            <select
              value={selectedReportId || ''}
              onChange={e => setSelectedReportId(e.target.value)}
              className="px-3 py-2 bg-foundation border-2 border-ink text-xs font-bold uppercase focus:outline-none"
            >
              {reportsList.map(r => (
                <option key={r.id} value={r.id}>
                  {r.report_title} ({r.verdict})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleOpenFullDossier}
            className="px-4 py-2 bg-ink hover:bg-neutral-800 text-white font-bold uppercase text-xs border-2 border-ink shadow-[2px_2px_0px_0px_#000] flex items-center gap-1.5 transition-all"
            title="Open complete 5-tab research report"
          >
            <ChartBarIcon className="w-4 h-4 text-accent-green" />
            <span>Open 5-Tab Dossier</span>
          </button>

          <button
            onClick={() => setShowExportPdf(true)}
            className="px-4 py-2 bg-accent-green hover:bg-[#16a34a] text-white font-black uppercase text-xs border-2 border-ink shadow-[2px_2px_0px_0px_#000] flex items-center gap-1.5 transition-all"
            title="Download investor PDF or memorandum"
          >
            <span>🖨️</span>
            <span>Export PDF</span>
          </button>

          <button
            onClick={() => setView(View.BUSINESS_RESEARCH)}
            className="px-3 py-2 bg-foundation hover:bg-white text-ink font-bold uppercase text-xs border-2 border-ink shadow-[2px_2px_0px_0px_#000]"
          >
            + New Analysis
          </button>
        </div>
      </div>

      {/* ── 2. Highly Customizable Launch Countdown Clock ─────────────────── */}
      <div className="bg-[#141414] text-white border-2 border-ink p-6 md:p-8 shadow-[5px_5px_0px_0px_#000] relative overflow-hidden">
        
        {/* Top Header of Clock */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-green animate-pulse" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-accent-green">
                Dynamic Launch Countdown Engine
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">
              Target Public Launch Countdown
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-white/10 text-xs font-mono font-bold border border-white/20">
              {timelineDays}-Day Horizon ({targetLaunchDate ? new Date(targetLaunchDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Calibrating'})
            </span>
            <button
              onClick={() => setIsEditingTimeline(true)}
              className="px-3 py-1.5 bg-accent-green hover:bg-[#16a34a] text-ink font-black uppercase text-xs border border-black shadow-[2px_2px_0px_0px_#000] transition-all"
            >
              ⚙️ Customize Horizon
            </button>
          </div>
        </div>

        {/* Digital Clock Numbers Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8">
          <div className="bg-white/5 border border-white/10 p-4 text-center">
            <div className="text-4xl md:text-6xl font-black font-mono tracking-tight text-white">
              {String(countdown.days).padStart(2, '0')}
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mt-1 block">
              Days Remaining
            </span>
          </div>

          <div className="bg-white/5 border border-white/10 p-4 text-center">
            <div className="text-4xl md:text-6xl font-black font-mono tracking-tight text-white">
              {String(countdown.hours).padStart(2, '0')}
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mt-1 block">
              Hours
            </span>
          </div>

          <div className="bg-white/5 border border-white/10 p-4 text-center">
            <div className="text-4xl md:text-6xl font-black font-mono tracking-tight text-white">
              {String(countdown.minutes).padStart(2, '0')}
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mt-1 block">
              Minutes
            </span>
          </div>

          <div className="bg-white/5 border border-white/10 p-4 text-center">
            <div className="text-4xl md:text-6xl font-black font-mono tracking-tight text-accent-green">
              {String(countdown.seconds).padStart(2, '0')}
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-accent-green mt-1 block">
              Seconds
            </span>
          </div>
        </div>

        {/* Timeline Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono text-neutral-400">
            <span>Progress: {countdown.progressPct}% time elapsed</span>
            <span>Target: {timelineDays} Days Total</span>
          </div>
          <div className="w-full h-3 bg-white/10 border border-white/20 overflow-hidden">
            <div
              className="h-full bg-accent-green transition-all duration-500 ease-out"
              style={{ width: `${countdown.progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── 3. Modal: Timeline Horizon Customizer ─────────────────────────── */}
      {isEditingTimeline && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-ink border-2 border-ink p-6 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b-2 border-ink">
              <h3 className="font-black uppercase text-base tracking-tight">Customize Launch Timeline Horizon</h3>
              <button onClick={() => setIsEditingTimeline(false)} className="text-sm font-bold">✕</button>
            </div>

            <p className="text-xs text-ink/70">
              Select your venture build duration. Zonek automatically recalibrates sprint milestones and task pacing to fit your exact business type.
            </p>

            {/* Quick Presets */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold uppercase text-ink/50">Fast Presets</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => applyTimelinePreset(30)}
                  className={`p-3 border-2 border-ink text-left font-bold ${timelineDays === 30 ? 'bg-ink text-white' : 'hover:bg-foundation'}`}
                >
                  ⚡ Fast-Track (30 Days)
                  <span className="block text-[10px] font-normal opacity-70">Pop-ups, Kiosks, MVP</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyTimelinePreset(60)}
                  className={`p-3 border-2 border-ink text-left font-bold ${timelineDays === 60 ? 'bg-ink text-white' : 'hover:bg-foundation'}`}
                >
                  🏃 Rapid Sprint (60 Days)
                  <span className="block text-[10px] font-normal opacity-70">Retail, QSR, Tech Beta</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyTimelinePreset(90)}
                  className={`p-3 border-2 border-ink text-left font-bold ${timelineDays === 90 ? 'bg-ink text-white' : 'hover:bg-foundation'}`}
                >
                  🎯 Standard Rollout (90 Days)
                  <span className="block text-[10px] font-normal opacity-70">Cafes, Salons, Clinics</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyTimelinePreset(180)}
                  className={`p-3 border-2 border-ink text-left font-bold ${timelineDays === 180 ? 'bg-ink text-white' : 'hover:bg-foundation'}`}
                >
                  🏗️ Medium Build (180 Days)
                  <span className="block text-[10px] font-normal opacity-70">Gyms, Heavy Capex, SaaS</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyTimelinePreset(365)}
                  className={`p-3 border-2 border-ink text-left font-bold md:col-span-2 ${timelineDays === 365 ? 'bg-ink text-white' : 'hover:bg-foundation'}`}
                >
                  🏛️ Long-Horizon Venture (365 Days / 1 Year)
                  <span className="block text-[10px] font-normal opacity-70">Manufacturing, Regulated Services, Deep Tech</span>
                </button>
              </div>
            </div>

            {/* Custom Exact Date Input */}
            <div className="pt-3 border-t border-ink/20">
              <label className="text-[10px] font-mono font-bold uppercase text-ink/60 block mb-1.5">
                Or Pick Exact Target Launch Date
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customDatePicker}
                  onChange={e => setCustomDatePicker(e.target.value)}
                  className="flex-1 p-2.5 border-2 border-ink text-xs font-mono font-bold"
                />
                <button
                  onClick={() => applyCustomTargetDate(customDatePicker)}
                  disabled={!customDatePicker}
                  className="px-4 py-2.5 bg-ink text-white font-bold uppercase text-xs border-2 border-ink hover:bg-neutral-800 disabled:opacity-30"
                >
                  Apply Date
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Strategic Sprint Phases (Calibrated Dynamically) ───────────── */}
      <div className="bg-white border-2 border-ink p-6 shadow-[4px_4px_0px_0px_#000]">
        <div className="flex items-center justify-between pb-3 border-b-2 border-ink mb-5">
          <div className="flex items-center gap-2">
            <span className="text-xl">🗺️</span>
            <div>
              <h3 className="font-black uppercase text-base tracking-tight">Paced Sprint Roadmap ({timelineDays} Days)</h3>
              <p className="text-xs text-ink/60">Milestone windows dynamically proportioned to your chosen launch horizon.</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-1 bg-ink text-foundation">
            {sprintPhases.filter(p => p.isActive).length > 0 ? sprintPhases.find(p => p.isActive)?.phase : 'Active'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {sprintPhases.map((phase, idx) => (
            <div
              key={idx}
              className={`p-4 border-2 border-ink transition-all ${
                phase.isActive
                  ? 'bg-ink text-white shadow-[3px_3px_0px_0px_#22C55E]'
                  : 'bg-foundation text-ink opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 ${
                  phase.isActive ? 'bg-accent-green text-ink' : 'bg-ink/10 text-ink'
                }`}>
                  {phase.phase} · {phase.window}
                </span>
                {phase.isActive && <span className="text-xs">⚡ Current</span>}
              </div>
              <h4 className="font-black uppercase text-xs mb-1.5">{phase.title}</h4>
              <p className={`text-[11px] leading-relaxed ${phase.isActive ? 'text-neutral-300' : 'text-ink/70'}`}>
                {phase.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. Capital Reality & Live Runway Meter ────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white border-2 border-ink shadow-[3px_3px_0px_0px_#000]">
          <span className="text-[10px] font-mono font-bold uppercase text-ink/50 block mb-1">Total Capital Allocated</span>
          <span className="text-2xl font-black font-mono text-ink">₹{allocatedBudget.toLocaleString('en-IN')}</span>
          <span className="text-[11px] text-ink/60 block mt-1">Founder equity / debt</span>
        </div>

        <div className="p-5 bg-white border-2 border-ink shadow-[3px_3px_0px_0px_#000]">
          <span className="text-[10px] font-mono font-bold uppercase text-ink/50 block mb-1">Estimated Day-0 Capex</span>
          <span className="text-2xl font-black font-mono text-ink">₹{setupCapex.toLocaleString('en-IN')}</span>
          <span className="text-[11px] text-ink/60 block mt-1">Setup & equipment build</span>
        </div>

        <div className="p-5 bg-white border-2 border-ink shadow-[3px_3px_0px_0px_#000]">
          <span className="text-[10px] font-mono font-bold uppercase text-ink/50 block mb-1">Working Capital Buffer</span>
          <span className={`text-2xl font-black font-mono ${capitalBuffer >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {capitalBuffer >= 0 ? '+' : ''}₹{capitalBuffer.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-ink/60 block mt-1">
            {capitalBuffer >= 0 ? 'Comfortable liquidity' : 'Funding deficit warning'}
          </span>
        </div>

        <div className="p-5 bg-white border-2 border-ink shadow-[3px_3px_0px_0px_#000]">
          <span className="text-[10px] font-mono font-bold uppercase text-ink/50 block mb-1">Operating Cash Runway</span>
          <span className="text-2xl font-black font-mono text-accent-green">{runwayMonths} Months</span>
          <span className="text-[11px] text-ink/60 block mt-1">Cash flow neutral buffer</span>
        </div>
      </div>

      {/* ── 6. Checkable Daily & Weekly Execution Tasks ───────────────────── */}
      <div className="bg-white border-2 border-ink p-6 md:p-8 shadow-[4px_4px_0px_0px_#000]">
        
        {/* Task Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-ink mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">✅</span>
              <h3 className="font-black uppercase text-base tracking-tight">
                Venture Launch Execution Checklist
              </h3>
            </div>
            <p className="text-xs text-ink/60 mt-0.5">
              Check off deliverables as you execute. Progress saves automatically to your profile.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-ink">
              {completedTasksCount} / {tasks.length} Completed ({taskProgressPct}%)
            </span>
            <button
              onClick={() => setIsAddingTask(true)}
              className="px-3 py-1.5 bg-ink hover:bg-neutral-800 text-white font-bold uppercase text-xs border border-black shadow-[2px_2px_0px_0px_#000] flex items-center gap-1"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>Add Custom Task</span>
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 no-scrollbar">
          {[
            { id: 'all', label: 'All Tasks' },
            { id: 'pending', label: 'Pending' },
            { id: 'completed', label: 'Completed' },
            { id: 'legal', label: '📜 Legal & Licenses' },
            { id: 'space', label: '🏢 Space & Lease' },
            { id: 'capex', label: '💰 Capex Procurement' },
            { id: 'marketing', label: '🚀 Brand & Marketing' },
            { id: 'operations', label: '📋 Operations SOPs' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setTaskFilter(f.id as any)}
              className={`px-3 py-1 text-xs font-bold uppercase whitespace-nowrap border border-ink transition-all ${
                taskFilter === f.id
                  ? 'bg-ink text-white shadow-sm'
                  : 'bg-foundation text-ink hover:bg-neutral-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Add Custom Task Inline Modal / Form */}
        {isAddingTask && (
          <div className="mb-4 p-4 bg-foundation border-2 border-ink space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase">Create Custom Action Item</span>
              <button onClick={() => setIsAddingTask(false)} className="text-xs font-bold">✕ Close</button>
            </div>
            <div className="flex flex-col md:flex-row gap-2">
              <input
                type="text"
                placeholder="e.g. Schedule commercial kitchen walk-through with contractor"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                className="flex-1 p-2.5 border-2 border-ink text-xs font-bold bg-white"
              />
              <select
                value={newTaskCategory}
                onChange={e => setNewTaskCategory(e.target.value as any)}
                className="p-2.5 border-2 border-ink text-xs font-bold bg-white"
              >
                <option value="legal">Legal & Licenses</option>
                <option value="space">Space & Lease</option>
                <option value="capex">Capex Procurement</option>
                <option value="marketing">Brand & Marketing</option>
                <option value="operations">Operations SOPs</option>
              </select>
              <button
                onClick={addCustomTask}
                disabled={!newTaskTitle.trim()}
                className="px-4 py-2.5 bg-accent-green hover:bg-[#16a34a] text-ink font-bold uppercase text-xs border-2 border-ink disabled:opacity-40"
              >
                Save Task
              </button>
            </div>
          </div>
        )}

        {/* Tasks List */}
        <div className="space-y-2">
          {filteredTasks.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-ink/50 border border-dashed border-ink/30">
              No tasks found in this category.
            </div>
          ) : (
            filteredTasks.map(task => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`p-3.5 border-2 border-ink flex items-center justify-between gap-3 cursor-pointer transition-all ${
                  task.isCompleted ? 'bg-neutral-100 opacity-60' : 'bg-white hover:bg-neutral-50 shadow-[2px_2px_0px_0px_#000]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 border-2 border-ink flex items-center justify-center ${
                    task.isCompleted ? 'bg-accent-green text-ink' : 'bg-white'
                  }`}>
                    {task.isCompleted && <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <span className={`text-xs font-bold ${task.isCompleted ? 'line-through text-ink/60' : 'text-ink'}`}>
                      {task.title}
                    </span>
                    <span className="ml-2 text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 bg-foundation border border-ink/20 text-ink/60">
                      {task.category}
                    </span>
                  </div>
                </div>

                {task.isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTask(task.id);
                    }}
                    className="text-ink/40 hover:text-red-600 p-1"
                    title="Delete custom task"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── 7. Ground Intelligence Quick Widgets ──────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Subsidies Widget */}
        <div className="p-6 bg-white border-2 border-ink shadow-[3px_3px_0px_0px_#000] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono font-bold uppercase text-amber-800">Gov Schemes & Grants</span>
              <span className="text-base">🏛️</span>
            </div>
            <h4 className="font-black text-sm uppercase text-ink mb-1">Central & State MSME Capital Subsidies</h4>
            <p className="text-xs text-ink/70 leading-relaxed mb-3">
              PMEGP offers 15% to 35% capital margin subsidies; Mudra Tarun provides up to ₹10 Lakhs collateral-free credit.
            </p>
          </div>
          <button
            onClick={handleOpenFullDossier}
            className="text-xs font-bold uppercase text-ink hover:underline flex items-center gap-1 self-start pt-2 border-t border-ink/10 w-full"
          >
            <span>Review Full Eligibility →</span>
          </button>
        </div>

        {/* Commercial Rentals Widget */}
        <div className="p-6 bg-white border-2 border-ink shadow-[3px_3px_0px_0px_#000] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono font-bold uppercase text-blue-800">Commercial Lease Benchmark</span>
              <span className="text-base">📍</span>
            </div>
            <h4 className="font-black text-sm uppercase text-ink mb-1">Micro-Market Rent in {displayLocation}</h4>
            <p className="text-xs text-ink/70 leading-relaxed mb-3">
              Verified local commercial spaces benchmark between ₹50–₹110/sqft depending on high-street frontage.
            </p>
          </div>
          <button
            onClick={() => setView(View.RENTAL_LISTINGS)}
            className="text-xs font-bold uppercase text-ink hover:underline flex items-center gap-1 self-start pt-2 border-t border-ink/10 w-full"
          >
            <span>Browse Local Properties →</span>
          </button>
        </div>

        {/* Competitor Attack Angle Widget */}
        <div className="p-6 bg-white border-2 border-ink shadow-[3px_3px_0px_0px_#000] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono font-bold uppercase text-red-800">Competitor Positioning</span>
              <span className="text-base">⚔️</span>
            </div>
            <h4 className="font-black text-sm uppercase text-ink mb-1">Blue Ocean Strategy</h4>
            <p className="text-xs text-ink/70 leading-relaxed mb-3">
              Exploit slow manual competitor turnarounds with instant verified execution and pricing transparency.
            </p>
          </div>
          <button
            onClick={handleOpenFullDossier}
            className="text-xs font-bold uppercase text-ink hover:underline flex items-center gap-1 self-start pt-2 border-t border-ink/10 w-full"
          >
            <span>View ERRC Matrix →</span>
          </button>
        </div>
      </div>

      {/* ── 8. PDF Export Modal (Direct Launch from Dashboard) ─────────────── */}
      {showExportPdf && activeReport && (
        <ExportPdfModal
          report={activeReport}
          businessName={activeReportMeta?.report_title}
          businessType={activeReportMeta?.business_type || 'Venture'}
          location={displayLocation}
          budgetInr={allocatedBudget}
          onClose={() => setShowExportPdf(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
