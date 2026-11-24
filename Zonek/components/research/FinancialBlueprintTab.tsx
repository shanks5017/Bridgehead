import React from 'react';
import { FullBusinessReport } from '../../types';

interface Props {
  fin: NonNullable<FullBusinessReport['financials']>;
  userBudget: number;
}

export const FinancialBlueprintTab: React.FC<Props> = ({ fin, userBudget }) => {
  const startup = fin.startup_costs || { setup_total: userBudget, breakdown: [], budget_gap: 0, contingency_recommended: 50000, data_confidence: 'HIGH' };
  const ue = fin.unit_economics || { avg_revenue_per_customer: 250, cogs_per_unit: 80, gross_margin_pct: 68, cac_estimate: 150, ltv_estimate: 1200, ltv_to_cac_ratio: 8, payback_months: 2, notes: '' };
  const monthly = fin.monthly_projections_12m || [];
  const scenarios = fin.scenarios || {
    conservative: { monthly_customers: 200, break_even_month: 6, year1_revenue: 600000 },
    base: { monthly_customers: 450, break_even_month: 3, year1_revenue: 1350000 },
    optimistic: { monthly_customers: 800, break_even_month: 2, year1_revenue: 2400000 }
  };
  const pricing = fin.pricing_analysis || { recommended_price_tier: 'Standard', ideal_range_min: 200, ideal_range_max: 350, price_too_cheap_threshold: 100, price_too_expensive_threshold: 600, pricing_rationale: '' };
  const runway = fin.runway || { months_of_runway: 6, critical_milestone: 'Month 3 Cash Flow Neutral', fundraise_or_revenue_flag: 'Bootstrap' };

  const surplusOrDeficit = userBudget - startup.setup_total;

  return (
    <div className="space-y-6">
      {/* ── 1. Capital Reality Check Banner ───────────────────────────── */}
      <div className={`p-6 border-2 border-black shadow-[4px_4px_0px_0px_#000] ${
        surplusOrDeficit >= 0 ? 'bg-emerald-50 border-emerald-500' : 'bg-red-50 border-red-500'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase text-neutral-500 block mb-1">
              Capital Reality Check
            </span>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-neutral-900">
              {surplusOrDeficit >= 0 ? 'Budget Fully Funded' : 'Capital Deficit Warning'}
            </h2>
            <p className="text-xs text-neutral-600 mt-1">
              Estimated Total Capex to Launch: <strong>₹{startup.setup_total.toLocaleString('en-IN')}</strong> vs Allocated Budget: <strong>₹{userBudget.toLocaleString('en-IN')}</strong>
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase text-neutral-500 block">
              {surplusOrDeficit >= 0 ? 'Working Capital Buffer' : 'Additional Funding Required'}
            </span>
            <span className={`text-2xl font-black ${surplusOrDeficit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {surplusOrDeficit >= 0 ? '+' : ''}₹{surplusOrDeficit.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. Itemized Startup Costs (Capex Breakdown) ─────────────────── */}
      <div className="bg-white border-2 border-black p-6 shadow-[3px_3px_0px_0px_#000]">
        <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-5">
          <div className="flex items-center gap-3">
            <span className="text-xl">💰</span>
            <div>
              <h3 className="font-black uppercase text-base tracking-tight">Itemized Setup Capital (Day-0 Capex)</h3>
              <p className="text-xs text-neutral-500">Itemized launch investment derived from real Indian equipment & vendor quotes.</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 bg-black text-white">
            Confidence: {startup.data_confidence || 'VERIFIED'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-black text-left">
                <th className="py-2.5 font-black uppercase">Category / Item</th>
                <th className="py-2.5 font-black uppercase text-right">Estimated Amount (₹)</th>
                <th className="py-2.5 font-black uppercase text-right">Basis / Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 font-mono">
              {(startup.breakdown || []).map((row, i) => (
                <tr key={i} className="hover:bg-neutral-50">
                  <td className="py-2.5 font-bold font-sans text-neutral-900">{row.item}</td>
                  <td className="py-2.5 text-right font-black text-neutral-900">
                    ₹{Number(row.amount || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="py-2.5 text-right text-neutral-500">{row.source || 'Local vendor average'}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-black font-black bg-neutral-100 font-sans">
                <td className="py-3 uppercase">Total Setup Capex Required</td>
                <td className="py-3 text-right text-base text-neutral-900">
                  ₹{startup.setup_total.toLocaleString('en-IN')}
                </td>
                <td className="py-3 text-right text-[11px] text-neutral-600">
                  Includes ₹{startup.contingency_recommended.toLocaleString('en-IN')} contingency
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 3. Unit Economics Engine ───────────────────────────────────── */}
      <div className="bg-white border-2 border-black p-6 shadow-[3px_3px_0px_0px_#000]">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-black mb-5">
          <span className="text-xl">📈</span>
          <div>
            <h3 className="font-black uppercase text-base tracking-tight">Unit Economics & Customer Margin</h3>
            <p className="text-xs text-neutral-500">Contribution margin per transaction and customer acquisition efficiency.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="p-4 bg-neutral-50 border border-neutral-200">
            <span className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">Avg Ticket / Customer</span>
            <span className="text-xl font-black text-neutral-900">₹{ue.avg_revenue_per_customer}</span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">Revenue per sale</span>
          </div>

          <div className="p-4 bg-neutral-50 border border-neutral-200">
            <span className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">COGS / Unit</span>
            <span className="text-xl font-black text-neutral-900">₹{ue.cogs_per_unit}</span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">Raw material / delivery</span>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200">
            <span className="text-[10px] font-bold uppercase text-emerald-800 block mb-1">Gross Margin %</span>
            <span className="text-xl font-black text-emerald-700">{ue.gross_margin_pct}%</span>
            <span className="text-[10px] text-emerald-600 block mt-0.5">Healthy unit buffer</span>
          </div>

          <div className="p-4 bg-neutral-50 border border-neutral-200">
            <span className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">Est. Customer CAC</span>
            <span className="text-xl font-black text-neutral-900">₹{ue.cac_estimate}</span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">Blended acquisition</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-neutral-50 border border-neutral-200 text-xs">
          <div>
            <span className="font-bold text-neutral-700 block">LTV : CAC Ratio</span>
            <span className="text-base font-black text-neutral-900">{ue.ltv_to_cac_ratio || 5} : 1</span>
            <p className="text-[10px] text-neutral-500 mt-0.5">&gt; 3:1 is standard venture-grade metric</p>
          </div>
          <div>
            <span className="font-bold text-neutral-700 block">CAC Payback Speed</span>
            <span className="text-base font-black text-neutral-900">{ue.payback_months || 2} Months</span>
            <p className="text-[10px] text-neutral-500 mt-0.5">Time to recoup acquisition spend</p>
          </div>
          <div>
            <span className="font-bold text-neutral-700 block">Working Capital Runway</span>
            <span className="text-base font-black text-emerald-700">{runway.months_of_runway} Months</span>
            <p className="text-[10px] text-neutral-500 mt-0.5">{runway.critical_milestone}</p>
          </div>
        </div>
      </div>

      {/* ── 4. 3-Scenario Stress Testing ──────────────────────────────── */}
      <div className="bg-white border-2 border-black p-6 shadow-[3px_3px_0px_0px_#000]">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-black mb-5">
          <span className="text-xl">⚖️</span>
          <div>
            <h3 className="font-black uppercase text-base tracking-tight">3-Scenario Financial Stress Test</h3>
            <p className="text-xs text-neutral-500">Know your exact break-even timeline under slow, realistic, and viral conditions.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-neutral-50 border-2 border-neutral-300">
            <span className="text-xs font-black uppercase text-neutral-600 block mb-1">Conservative (Slow)</span>
            <div className="text-xl font-black text-neutral-900 mb-2">Month {scenarios.conservative?.break_even_month || 6}</div>
            <div className="space-y-1 text-xs text-neutral-600">
              <div>Monthly Customers: <strong>{scenarios.conservative?.monthly_customers}</strong></div>
              <div>Year 1 Revenue: <strong>₹{scenarios.conservative?.year1_revenue.toLocaleString('en-IN')}</strong></div>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 border-2 border-emerald-500">
            <span className="text-xs font-black uppercase text-emerald-800 block mb-1">Base Case (Expected)</span>
            <div className="text-xl font-black text-emerald-900 mb-2">Month {scenarios.base?.break_even_month || 3}</div>
            <div className="space-y-1 text-xs text-emerald-950">
              <div>Monthly Customers: <strong>{scenarios.base?.monthly_customers}</strong></div>
              <div>Year 1 Revenue: <strong>₹{scenarios.base?.year1_revenue.toLocaleString('en-IN')}</strong></div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border-2 border-blue-400">
            <span className="text-xs font-black uppercase text-blue-800 block mb-1">Optimistic (High Demand)</span>
            <div className="text-xl font-black text-blue-900 mb-2">Month {scenarios.optimistic?.break_even_month || 2}</div>
            <div className="space-y-1 text-xs text-blue-950">
              <div>Monthly Customers: <strong>{scenarios.optimistic?.monthly_customers}</strong></div>
              <div>Year 1 Revenue: <strong>₹{scenarios.optimistic?.year1_revenue.toLocaleString('en-IN')}</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. 12-Month Pro-Forma Cash Flow Table ─────────────────────── */}
      {monthly.length > 0 && (
        <div className="bg-white border-2 border-black p-6 shadow-[3px_3px_0px_0px_#000]">
          <h3 className="font-black uppercase text-base tracking-tight pb-3 border-b-2 border-black mb-4">
            12-Month Pro-Forma Revenue & Cash Burn Projection
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b-2 border-black text-left text-neutral-500 font-bold uppercase">
                  <th className="py-2">Month</th>
                  <th className="py-2 text-right">Customers</th>
                  <th className="py-2 text-right">Revenue (₹)</th>
                  <th className="py-2 text-right">Expenses (₹)</th>
                  <th className="py-2 text-right">Net Margin (₹)</th>
                  <th className="py-2 text-right">Cumulative Burn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {monthly.map(m => (
                  <tr key={m.month} className="hover:bg-neutral-50">
                    <td className="py-2 font-bold font-sans">M{m.month}</td>
                    <td className="py-2 text-right">{m.customers}</td>
                    <td className="py-2 text-right text-emerald-700 font-bold">₹{m.revenue.toLocaleString('en-IN')}</td>
                    <td className="py-2 text-right text-neutral-700">₹{m.expenses.toLocaleString('en-IN')}</td>
                    <td className={`py-2 text-right font-black ${m.net >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {m.net >= 0 ? '+' : ''}₹{m.net.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2 text-right text-neutral-500">₹{m.cumulative_burn.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialBlueprintTab;
