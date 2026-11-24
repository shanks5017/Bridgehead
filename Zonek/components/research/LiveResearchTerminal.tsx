import React, { useEffect, useRef } from 'react';
import { BusinessResearchSSEEvent } from '../../types';

interface Props {
  businessType: string;
  location: string;
  budgetInr: number;
  progressPct: number;
  events: BusinessResearchSSEEvent[];
}

export const LiveResearchTerminal: React.FC<Props> = ({
  businessType,
  location,
  budgetInr,
  progressPct,
  events,
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [events]);

  const stages = [
    { key: 'evidence_fetch', label: 'Local Market & Civic Telemetry', pct: 20 },
    { key: 'business_plan', label: 'Monopoly Moat & JTBD Synthesis', pct: 40 },
    { key: 'financials', label: 'Unit Economics & 12m P&L Stress Test', pct: 60 },
    { key: 'competitive', label: 'Competitor Density & Blue Ocean Grid', pct: 75 },
    { key: 'marketing', label: 'StoryBrand Script & Acquisition Channels', pct: 90 },
    { key: 'roadmap', label: 'Statutory Licencing & 90-Day SOPs', pct: 100 },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="bg-[#0f1117] border-2 border-black shadow-[6px_6px_0px_0px_#000] rounded-none overflow-hidden text-white font-mono">
        {/* Terminal Header Bar */}
        <div className="bg-[#1a1d27] border-b-2 border-black px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#EF4444]" />
            <span className="w-3 h-3 rounded-full bg-[#FBBF24]" />
            <span className="w-3 h-3 rounded-full bg-[#22C55E]" />
            <span className="text-xs font-bold text-white/70 ml-2 uppercase tracking-wider">
              ZONEK_TELEMETRY_ENGINE // V1.0-PRO
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="animate-pulse w-2 h-2 rounded-full bg-[#22C55E]" />
            <span className="text-[11px] text-[#22C55E] uppercase font-bold">LIVE RESEARCH ACTIVE</span>
          </div>
        </div>

        {/* Query Context Bar */}
        <div className="px-5 py-4 border-b border-white/10 bg-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-white/40 uppercase block text-[10px]">Target Venture</span>
            <strong className="text-white font-bold uppercase">{businessType}</strong>
          </div>
          <div>
            <span className="text-white/40 uppercase block text-[10px]">Location</span>
            <strong className="text-white font-bold">{location}</strong>
          </div>
          <div>
            <span className="text-white/40 uppercase block text-[10px]">Allocated Capital</span>
            <strong className="text-emerald-400 font-bold">₹{budgetInr.toLocaleString('en-IN')}</strong>
          </div>
          <div>
            <span className="text-white/40 uppercase block text-[10px]">Synthesizer</span>
            <strong className="text-purple-400">GPT-OSS-120B (Groq LPU)</strong>
          </div>
        </div>

        {/* Progress Bar & Stages */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-white/60 font-bold uppercase">Synthesis Completion</span>
            <span className="text-emerald-400 font-bold text-sm">{Math.round(progressPct)}%</span>
          </div>
          <div className="w-full bg-white/10 h-2 border border-white/20">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-[#22C55E] transition-all duration-300"
              style={{ width: `${Math.min(progressPct, 100)}%` }}
            />
          </div>

          {/* Stepper Dots */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mt-4 text-[10px]">
            {stages.map((st, i) => {
              const isDone = progressPct >= st.pct;
              const isCurrent = progressPct < st.pct && (i === 0 || progressPct >= stages[i - 1].pct);
              return (
                <div
                  key={st.key}
                  className={`p-2 border ${
                    isDone
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                      : isCurrent
                      ? 'border-[#FBBF24] bg-amber-500/10 text-amber-200 animate-pulse'
                      : 'border-white/10 bg-white/5 text-white/30'
                  }`}
                >
                  <div className="font-bold mb-0.5">{isDone ? '✓ DONE' : isCurrent ? '▶ RUN' : '○ WAIT'}</div>
                  <div className="truncate font-sans text-[11px] leading-tight">{st.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Terminal Log Stream */}
        <div
          ref={terminalRef}
          className="p-5 h-64 md:h-72 overflow-y-auto no-scrollbar space-y-2 text-xs font-mono bg-black/50"
        >
          <div className="text-white/40">// Initializing Zonek multi-agent reasoning pipeline...</div>
          <div className="text-white/40">// Pulling Ground Evidence packet (Commercial Rentals, Competitors, Mudra/PMEGP)...</div>

          {events.map((ev, i) => {
            const isError = ev.type === 'error';
            const isComplete = ev.type === 'section_complete';
            return (
              <div
                key={i}
                className={`flex items-start gap-2 leading-relaxed ${
                  isError ? 'text-red-400' : isComplete ? 'text-emerald-300' : 'text-neutral-300'
                }`}
              >
                <span className="text-white/30 text-[10px] select-none">
                  [{new Date().toLocaleTimeString('en-US', { hour12: false })}]
                </span>
                <span className="font-bold">
                  {isComplete ? '✓' : isError ? '✗' : '➜'}
                </span>
                <div>
                  {ev.label && <span className="text-[#22C55E] font-bold">[{ev.label}] </span>}
                  <span>{ev.message}</span>
                </div>
              </div>
            );
          })}

          <div className="flex items-center gap-2 text-emerald-400 text-xs animate-pulse pt-2">
            <span>_</span>
            <span>Synthesizing deep evidence-backed verdict and models...</span>
          </div>
        </div>

        {/* Terminal Footer */}
        <div className="px-5 py-3 bg-[#1a1d27] border-t border-white/10 flex items-center justify-between text-[11px] text-white/40">
          <span>Speed: ~2-4s per section · Zero-Hallucination Firewall Active</span>
          <span>Press ESC or switch tabs safely</span>
        </div>
      </div>
    </div>
  );
};

export default LiveResearchTerminal;
