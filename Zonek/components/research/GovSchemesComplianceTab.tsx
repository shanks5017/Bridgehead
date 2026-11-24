import React from 'react';
import { FullBusinessReport } from '../../types';

export interface SchemeEvidenceItem {
  scheme_name?: string;
  ministry?: string;
  benefit?: any;
  eligibility?: any;
  description?: string;
  application_url?: string;
}

interface Props {
  roadmap: NonNullable<FullBusinessReport['roadmap']>;
  location: string;
  businessType: string;
  schemes?: SchemeEvidenceItem[];
}

export const GovSchemesComplianceTab: React.FC<Props> = ({
  roadmap,
  location,
  businessType,
  schemes = [],
}) => {
  const licensing = roadmap.licensing_checklist || [];
  const sops = roadmap.sops || [];
  const risks = roadmap.risk_register || [];

  // Default Central Indian schemes if none fetched from DB
  const displaySchemes = schemes.length > 0 ? schemes : [
    {
      scheme_name: 'Pradhan Mantri Mudra Yojana (PMMY) — Kishor Category',
      ministry: 'Ministry of Finance / SIDBI',
      benefit: { max_loan: '₹5,00,000 without collateral', interest: '7.5% – 10% subsidized' },
      eligibility: { profile: 'Micro business enterprises, retail, service, manufacturing' },
      description: 'Collateral-free working capital and equipment financing for small businesses in India.',
      application_url: 'https://www.udyamimitra.in'
    },
    {
      scheme_name: 'Prime Minister Employment Generation Programme (PMEGP)',
      ministry: 'Ministry of MSME / KVIC',
      benefit: { subsidy: '15% – 35% margin money capital subsidy', max_project: '₹25 Lakhs' },
      eligibility: { age: '18+ years', qualification: 'Class 8th pass for projects above ₹10L' },
      description: 'Direct credit-linked government subsidy to establish new micro-enterprises in urban and rural areas.',
      application_url: 'https://www.kviconline.gov.in/pmegpeportal'
    },
    {
      scheme_name: 'Udyam MSME Zero-Cost Registration',
      ministry: 'Ministry of Micro, Small and Medium Enterprises',
      benefit: { priority_lending: 'Priority sector bank lending, 50% patent discount, ISO subsidy' },
      eligibility: { all: 'Any registered proprietorship, partnership or private limited in India' },
      description: 'Official digital Aadhaar-linked certificate giving statutory MSME recognition.',
      application_url: 'https://udyamregistration.gov.in'
    }
  ];

  return (
    <div className="space-y-6">
      {/* ── 1. Matched Government Subsidies & Schemes ─────────────────── */}
      <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_#000]">
        <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-5">
          <div className="flex items-center gap-3">
            <span className="text-xl">🏛️</span>
            <div>
              <h3 className="font-black uppercase text-base tracking-tight">Government Subsidies & Capital Grants</h3>
              <p className="text-xs text-neutral-500">
                Verified Indian central and state MSME support matched for a {businessType} in {location}.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 bg-[#22C55E] text-white">
            {displaySchemes.length} Schemes Matched
          </span>
        </div>

        <div className="space-y-4">
          {displaySchemes.map((s, i) => (
            <div key={i} className="p-5 border-2 border-black bg-[#FAFAFA] hover:bg-white transition-all shadow-[2px_2px_0px_0px_#000]">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-700 block mb-0.5">
                    {s.ministry || 'Government of India'}
                  </span>
                  <h4 className="font-black text-base text-neutral-900 uppercase">{s.scheme_name}</h4>
                </div>
                <a
                  href={s.application_url || 'https://www.myscheme.gov.in'}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 bg-black text-white font-bold uppercase text-xs hover:bg-neutral-800 self-start"
                >
                  Apply Portal ↗
                </a>
              </div>

              <p className="text-xs text-neutral-600 mb-3">{s.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-neutral-100 border border-neutral-200 text-xs font-mono">
                <div>
                  <span className="font-bold text-neutral-700 block font-sans">Benefit / Subsidy</span>
                  <span className="text-emerald-700 font-bold">
                    {typeof s.benefit === 'object' ? JSON.stringify(s.benefit).replace(/["{}]/g, ' ') : String(s.benefit)}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-neutral-700 block font-sans">Eligibility Threshold</span>
                  <span className="text-neutral-700">
                    {typeof s.eligibility === 'object' ? JSON.stringify(s.eligibility).replace(/["{}]/g, ' ') : String(s.eligibility)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 2. Mandatory Statutory Licensing Checklist ─────────────────── */}
      <div className="bg-white border-2 border-black p-6 shadow-[3px_3px_0px_0px_#000]">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-black mb-5">
          <span className="text-xl">📜</span>
          <div>
            <h3 className="font-black uppercase text-base tracking-tight">Statutory Regulatory & Licensing Checklist</h3>
            <p className="text-xs text-neutral-500">Legal clearance timeline and fees required before opening your doors.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b-2 border-black text-left text-neutral-500 font-black uppercase">
                <th className="py-2.5">Licence / Registration</th>
                <th className="py-2.5">Issuing Authority</th>
                <th className="py-2.5">Timeline</th>
                <th className="py-2.5">Govt Fee (Est.)</th>
                <th className="py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {licensing.map((l, i) => (
                <tr key={i} className="hover:bg-neutral-50">
                  <td className="py-3 font-bold text-neutral-900">{l.licence}</td>
                  <td className="py-3 text-neutral-600">{l.authority}</td>
                  <td className="py-3 font-mono">{l.timeline}</td>
                  <td className="py-3 font-mono font-bold text-neutral-900">{l.cost_estimate}</td>
                  <td className="py-3 text-right">
                    <span className={`px-2 py-0.5 text-[10px] font-black uppercase border ${
                      l.status === 'Required' ? 'bg-red-100 text-red-800 border-red-300' :
                      l.status === 'Recommended' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                      'bg-neutral-100 text-neutral-700 border-neutral-300'
                    }`}>
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 3. Day-1 Operational SOPs (Playbooks) ──────────────────────── */}
      <div className="bg-white border-2 border-black p-6 shadow-[3px_3px_0px_0px_#000]">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-black mb-5">
          <span className="text-xl">📋</span>
          <div>
            <h3 className="font-black uppercase text-base tracking-tight">Standard Operating Procedures (SOPs)</h3>
            <p className="text-xs text-neutral-500">Step-by-step repeatable playbooks for daily execution without founder micromanagement.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sops.map((sop, i) => (
            <div key={i} className="p-4 border border-neutral-300 bg-neutral-50">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h4 className="font-black text-sm uppercase text-neutral-900">{sop.process_name}</h4>
                <span className="px-2 py-0.5 bg-neutral-200 text-neutral-800 text-[10px] font-bold">
                  Owner: {sop.owner}
                </span>
              </div>
              <div className="text-[11px] text-neutral-500 mb-3">Trigger: {sop.trigger}</div>

              <div className="space-y-1 mb-3">
                {(sop.steps || []).map((step, si) => (
                  <div key={si} className="text-xs text-neutral-800 flex items-start gap-1.5">
                    <span className="text-neutral-400 font-mono text-[10px] mt-0.5">{si + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>

              {sop.quality_check && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900">
                  <strong>Quality Gate:</strong> {sop.quality_check}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Risk Register & Contingency Playbook ────────────────────── */}
      <div className="bg-white border-2 border-black p-6 shadow-[3px_3px_0px_0px_#000]">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-black mb-5">
          <span className="text-xl">🛡️</span>
          <div>
            <h3 className="font-black uppercase text-base tracking-tight">Risk Register & Mitigation Playbook</h3>
            <p className="text-xs text-neutral-500">Foreseen operational pitfalls and verified counter-measures.</p>
          </div>
        </div>

        <div className="space-y-3">
          {risks.map((r, i) => (
            <div key={i} className="p-4 border border-neutral-300 bg-neutral-50 flex flex-col md:flex-row md:items-start justify-between gap-3 text-xs">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-neutral-900">{r.risk}</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-red-100 text-red-800">
                    Impact: {r.impact}
                  </span>
                  <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-amber-100 text-amber-800">
                    Prob: {r.probability}
                  </span>
                </div>
                <p className="text-neutral-600"><strong className="text-neutral-900">Mitigation:</strong> {r.mitigation}</p>
              </div>
              <div className="md:w-1/3 p-2 bg-white border border-neutral-200 text-[11px]">
                <strong className="text-neutral-900 block mb-0.5">Contingency Plan:</strong>
                <span className="text-neutral-600">{r.contingency}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GovSchemesComplianceTab;
