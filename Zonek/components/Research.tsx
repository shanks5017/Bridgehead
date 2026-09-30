import React, { useState, useEffect, useRef } from 'react';
import { ResearchInput, FeasibilityReport, SSEEvent } from '../types';
import { SparklesIcon, CheckCircleIcon, LoadingSpinner, ChartBarIcon, BuildingOfficeIcon, UsersIcon, SearchIcon, RocketIcon } from './icons';

type ResearchStage = 'input' | 'analyzing' | 'results';

export default function Research() {
  const [stage, setStage] = useState<ResearchStage>('input');
  const [input, setInput] = useState<ResearchInput>({
    businessType: '', location: '', budget: 1000000, spaceReq: '500-1000', businessFormat: 'Brick & Mortar'
  });
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [report, setReport] = useState<FeasibilityReport | null>(null);
  const [packet, setPacket] = useState<any>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const eventsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (stage === 'analyzing') {
      eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events, stage]);

  const startAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setStage('analyzing');
    setEvents([]);
    setReport(null);
    setPacket(null);
    setJobId(null);

    try {
      const response = await fetch('http://localhost:8002/api/v1/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });

      if (!response.body) throw new Error('No readable stream available');
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        let currentEvent = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.substring(7).trim();
          } else if (line.startsWith('data: ')) {
            const dataStr = line.substring(6).trim();
            if (!dataStr) continue;
            try {
              const data = JSON.parse(dataStr);
              if (currentEvent === 'pipeline_started' && data.jobId) {
                setJobId(data.jobId);
                setEvents(prev => [...prev, { stage: 'system', message: data.message }]);
              } else if (currentEvent === 'report_ready') {
                setReport(data.report);
                setPacket(data.packet);
                setStage('results');
              } else {
                setEvents(prev => [...prev, { stage: data.stage || currentEvent, status: data.status, message: data.message, url: data.url }]);
              }
            } catch (err) {
              console.error('Failed to parse SSE data', dataStr);
            }
          }
        }
      }
    } catch (error) {
      console.error('Pipeline error:', error);
      setEvents(prev => [...prev, { stage: 'error', message: 'Connection failed. Ensure orchestrator is running on port 8002.' }]);
    }
  };

  const renderInputForm = () => (
    <div className="max-w-2xl mx-auto animate-slide-up">
      <div className="bg-white neo-border neo-shadow-lg p-8">
        <div className="flex items-center gap-3 mb-8 pb-4 border-b-2 border-ink">
          <SparklesIcon className="w-8 h-8 text-accent-green" />
          <h1 className="text-3xl font-bold uppercase tracking-tight">Market Intelligence Engine</h1>
        </div>
        
        <form onSubmit={startAnalysis} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase">Business Type</label>
              <input required type="text" placeholder="e.g. Cafe, Gym, Pharmacy" className="w-full p-3 neo-border bg-foundation"
                value={input.businessType} onChange={e => setInput({...input, businessType: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase">Location</label>
              <input required type="text" placeholder="e.g. RS Puram, Coimbatore" className="w-full p-3 neo-border bg-foundation"
                value={input.location} onChange={e => setInput({...input, location: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase">Budget (₹)</label>
              <input required type="number" min="50000" step="50000" className="w-full p-3 neo-border bg-foundation"
                value={input.budget} onChange={e => setInput({...input, budget: Number(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase">Space Needed (SqFt)</label>
              <select className="w-full p-3 neo-border bg-foundation" value={input.spaceReq} onChange={e => setInput({...input, spaceReq: e.target.value})}>
                <option value="<500">&lt; 500 sqft (Kiosk/Small)</option>
                <option value="500-1000">500 - 1000 sqft (Standard)</option>
                <option value=">1000">&gt; 1000 sqft (Large)</option>
              </select>
            </div>
          </div>
          
          <button type="submit" className="w-full mt-8 neo-button neo-button-primary py-4 text-lg flex items-center justify-center gap-2 group">
            <SearchIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
            Generate Intelligence Report
          </button>
        </form>
      </div>
    </div>
  );

  const renderAnalyzing = () => (
    <div className="max-w-3xl mx-auto animate-slide-up">
      <div className="bg-white neo-border neo-shadow-lg p-6">
        <div className="flex items-center gap-4 mb-6 pb-4 border-b-2 border-ink">
          <LoadingSpinner className="w-8 h-8 text-accent-green" />
          <div>
            <h2 className="text-2xl font-bold uppercase">Analyzing Market</h2>
            <p className="text-sm font-mono opacity-60">{input.businessType} in {input.location}</p>
          </div>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar font-mono text-sm p-4 bg-foundation neo-border">
          {events.length === 0 && <div className="text-ink/50">Initializing engine...</div>}
          {events.map((ev, i) => (
            <div key={i} className="flex gap-3 items-start animate-slide-up border-b border-ink/10 pb-2">
              <span className="text-accent-green opacity-80 mt-1">▶</span>
              <div className="flex-1">
                <div className="font-bold text-ink/80">[{ev.stage.toUpperCase()}] {ev.status && `<${ev.status.toUpperCase()}>`}</div>
                <div className="opacity-90">{ev.message}</div>
                {ev.url && <div className="text-xs text-accent-blue truncate max-w-lg mt-1 overflow-hidden opacity-70">↳ {ev.url}</div>}
              </div>
            </div>
          ))}
          <div ref={eventsEndRef} />
        </div>
        <div className="mt-4 text-center text-xs font-mono opacity-50 animate-pulse">Running deterministic models. Please wait...</div>
      </div>
    </div>
  );

  const renderResults = () => {
    if (!report || !packet) return null;
    
    const v00 = report['00_verdict_bar'];
    const v01 = report['01_money_reality'];
    const v02 = report['02_competitor_landscape'];
    const v03 = report['03_demand_signals'];
    const v04 = report['04_startup_cost_reality'];
    const v05 = report['05_govt_and_civic'];
    const v06 = report['06_risk_register'];
    const v07 = report['07_final_verdict_and_action_plan'];

    const getScoreColor = (score: number) => {
      if (score >= 75) return 'bg-accent-green text-white';
      if (score >= 40) return 'bg-[#FBBF24] text-ink';
      return 'bg-[#EF4444] text-white';
    };

    return (
      <div className="max-w-6xl mx-auto space-y-10 animate-slide-up pb-32">
        <div className={`bg-white neo-border neo-shadow-lg p-8 flex flex-col md:flex-row gap-8 items-center justify-between relative overflow-hidden`}>
          <div className={`absolute top-0 left-0 w-2 h-full ${getScoreColor(v00.score.value)}`} />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <span className={`px-4 py-1 neo-border font-bold text-sm uppercase ${getScoreColor(v00.score.value)}`}>{v00.label}</span>
              <span className="text-sm font-mono opacity-50">SCORE: {v00.score.value}/100</span>
            </div>
            <h1 className="text-3xl font-bold uppercase tracking-tight">{input.businessType} in {input.location}</h1>
            <p className="text-xl font-serif-italic text-ink/80">"{v00.brutal_honesty}"</p>
          </div>
          <div className="text-right">
             <div className="text-sm font-mono opacity-50 mb-1">Logic: {v00.score.logic}</div>
             <p className="font-bold text-sm text-accent-green">↳ {v00._verdict}</p>
          </div>
        </div>

        {report._firewall?.violations_corrected ? (
          <div className="bg-[#FEF3C7] border-l-4 border-[#F59E0B] p-4 text-sm font-mono text-[#92400E] neo-border">
            ⚠️ FIREWALL: {report._firewall.violations_corrected} AI claim(s) corrected to match raw packet data.
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white neo-border p-6 space-y-6">
            <h2 className="text-xl font-bold uppercase flex items-center gap-2 border-b-2 border-ink pb-2">
              <BuildingOfficeIcon className="w-6 h-6" /> 01 - Money Reality
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-foundation p-4 neo-border">
                <div className="text-[10px] font-bold opacity-50 uppercase">Avg Rent</div>
                <div className="text-lg font-bold">₹{v01.avg_rent.value.toLocaleString('en-IN')}/mo</div>
                <div className="text-[10px] font-mono opacity-40">{v01.avg_rent.tag}</div>
              </div>
              <div className="bg-foundation p-4 neo-border">
                <div className="text-[10px] font-bold opacity-50 uppercase">Budget Runway</div>
                <div className="text-lg font-bold">{v01.budget_runway_months.value} Months</div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-sm font-bold uppercase">Strategic Cheaper Zones</div>
              {v01.cheaper_zones.map((zone, i) => (
                <div key={i} className="flex justify-between items-center text-sm p-2 border-b border-ink/10">
                  <div>
                    <span className="font-bold">{zone.area}</span>
                    <p className="text-[10px] opacity-60">{zone.reason}</p>
                  </div>
                  <span className="font-mono font-bold text-accent-green">{zone.est_rent}</span>
                </div>
              ))}
            </div>
            <p className="text-sm font-bold border-l-2 border-accent-green pl-3 mt-4">↳ {v01._verdict}</p>
          </div>

          <div className="bg-white neo-border p-6 space-y-6">
            <h2 className="text-xl font-bold uppercase flex items-center gap-2 border-b-2 border-ink pb-2">
              <UsersIcon className="w-6 h-6" /> 02 - Competitor Landscape
            </h2>
            <div className="flex justify-between text-center gap-2">
              <div className="flex-1 p-2 bg-foundation neo-border">
                <div className="text-[10px] font-bold opacity-50 uppercase">1KM</div>
                <div className="text-xl font-bold">{v02.density.radius_1km}</div>
              </div>
              <div className="flex-1 p-2 bg-foundation neo-border">
                <div className="text-[10px] font-bold opacity-50 uppercase">3KM</div>
                <div className="text-xl font-bold">{v02.density.radius_3km}</div>
              </div>
              <div className="flex-1 p-2 bg-foundation neo-border">
                <div className="text-[10px] font-bold opacity-50 uppercase">5KM</div>
                <div className="text-xl font-bold">{v02.density.radius_5km}</div>
              </div>
            </div>
            <div className="bg-accent-blue/10 p-3 neo-border text-sm">
               <b>Gap Analysis:</b> {v02.gap_analysis}
            </div>
            <p className="text-sm font-bold border-l-2 border-accent-green pl-3">↳ {v02._verdict}</p>
          </div>

          <div className="bg-white neo-border p-6 space-y-6">
            <h2 className="text-xl font-bold uppercase flex items-center gap-2 border-b-2 border-ink pb-2">
              <ChartBarIcon className="w-6 h-6" /> 03 - Demand Signals
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-[10px] font-bold opacity-50 uppercase">Zone Type</div>
                <div className="text-sm font-bold">{v03.zone_type}</div>
              </div>
              <div className="space-y-1 text-right">
                <div className="text-[10px] font-bold opacity-50 uppercase">Search Trends</div>
                <div className="text-sm font-bold text-accent-green">{v03.search_trend}</div>
              </div>
            </div>
            <div className="bg-foundation p-4 neo-border">
               <div className="text-[10px] font-bold opacity-50 uppercase mb-1">Addressable Market</div>
               <div className="text-2xl font-bold">{v03.addressable_market.estimate.toLocaleString()} <span className="text-xs font-normal opacity-60">est. customers</span></div>
            </div>
            <p className="text-sm font-bold border-l-2 border-accent-green pl-3">↳ {v03._verdict}</p>
          </div>

          <div className="bg-white neo-border p-6 space-y-6">
            <h2 className="text-xl font-bold uppercase flex items-center gap-2 border-b-2 border-ink pb-2">
              <RocketIcon className="w-6 h-6" /> 04 - Startup Cost Reality
            </h2>
            <div className="space-y-4">
               <div className="pt-4 flex justify-between items-end">
                  <div>
                    <div className="text-[10px] font-bold opacity-50 uppercase">Total Setup Cost</div>
                    <div className="text-2xl font-bold">₹{v04.total_setup_cost.value.toLocaleString()}</div>
                  </div>
                  {v04.budget_gap.value > 0 && (
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-[#EF4444] uppercase">Budget Gap</div>
                      <div className="text-lg font-bold text-[#EF4444]">₹{v04.budget_gap.value.toLocaleString()}</div>
                    </div>
                  )}
               </div>
               <div className="bg-ink text-white p-3 neo-border flex justify-between items-center">
                  <span className="text-xs uppercase font-bold">Breakeven Members</span>
                  <span className="text-xl font-bold">{v04.breakeven_members}</span>
               </div>
            </div>
            <p className="text-sm font-bold border-l-2 border-accent-green pl-3">↳ {v04._verdict}</p>
          </div>

          <div className="bg-white neo-border p-6 space-y-6">
            <h2 className="text-xl font-bold uppercase flex items-center gap-2 border-b-2 border-ink pb-2">
              <SparklesIcon className="w-6 h-6" /> 05 - Govt & Civic
            </h2>
            <p className="text-sm font-mono leading-relaxed bg-foundation p-3 neo-border">
               <b>IMPACT:</b> {v05.civic_impact}
            </p>
            <div className="space-y-4">
               <div className="text-sm font-bold uppercase">Available Schemes</div>
               {v05.schemes.map((s, i) => (
                 <div key={i} className="p-3 bg-accent-green/5 border-l-4 border-accent-green">
                    <div className="font-bold text-sm uppercase">{s.name}</div>
                    <div className="text-xs mt-1">Benefit: {s.max_amount}</div>
                 </div>
               ))}
            </div>
            <p className="text-sm font-bold border-l-2 border-accent-green pl-3">↳ {v05._verdict}</p>
          </div>

          <div className="bg-white neo-border p-6 space-y-6">
            <h2 className="text-xl font-bold uppercase flex items-center gap-2 border-b-2 border-ink pb-2">
              <ChartBarIcon className="w-6 h-6" /> 06 - Risk Register
            </h2>
            <div className="space-y-4">
               {v06.map((risk, i) => (
                 <div key={i} className="neo-border p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold uppercase text-xs">{risk.title}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold neo-border ${risk.severity === 'HIGH' ? 'bg-[#EF4444] text-white' : risk.severity === 'MEDIUM' ? 'bg-[#FBBF24] text-ink' : 'bg-accent-green text-white'}`}>
                        {risk.severity}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-accent-blue">↳ Mitigation: {risk.mitigation}</div>
                 </div>
               ))}
            </div>
          </div>
        </div>

        <div className="bg-white neo-border neo-shadow-lg p-8 space-y-8">
           <h2 className="text-2xl font-bold uppercase border-b-2 border-ink pb-4">07 - 30-Day Execution Plan</h2>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {v07.action_plan.map((step, i) => (
                <div key={i} className="relative p-6 bg-foundation neo-border space-y-3">
                   <div className="absolute -top-3 -left-3 w-8 h-8 bg-ink text-white flex items-center justify-center font-bold neo-border">W{step.week}</div>
                   <div className="font-bold uppercase text-sm pt-2">{step.task}</div>
                </div>
              ))}
           </div>
           <p className="text-sm font-bold border-l-4 border-accent-green pl-4">{v07._verdict}</p>
        </div>

        <button onClick={() => setStage('input')} className="neo-button w-full justify-center py-6 text-xl">
          Run Another Analysis
        </button>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 min-h-screen">
      {stage === 'input' && renderInputForm()}
      {stage === 'analyzing' && renderAnalyzing()}
      {stage === 'results' && renderResults()}
    </div>
  );
}
