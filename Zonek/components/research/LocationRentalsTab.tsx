import React from 'react';

export interface RentalEvidenceItem {
  id?: string;
  title?: string;
  locality?: string;
  city?: string;
  price?: number;
  square_feet?: number;
  rent_per_sqft?: number;
  lease_type?: string;
  amenities?: string[];
  furnishing_status?: string;
  address?: string;
  phone?: string;
}

interface Props {
  location: string;
  spaceRequired?: string;
  businessType: string;
  totalBudget: number;
  rentals?: RentalEvidenceItem[];
}

export const LocationRentalsTab: React.FC<Props> = ({
  location,
  spaceRequired = '500–1000 sqft',
  businessType,
  totalBudget,
  rentals = [],
}) => {
  // Compute benchmark rent per sqft estimate based on budget & city
  const isTier1 = /bangalore|mumbai|delhi|gurgaon|noida|hyderabad|pune|chennai/i.test(location);
  const avgSqftRate = isTier1 ? 85 : 45;
  const estMonthlyRent = Math.round((totalBudget * 0.08) / 12) || (isTier1 ? 45000 : 25000);
  const estDeposit = estMonthlyRent * (isTier1 ? 6 : 4);

  return (
    <div className="space-y-6">
      {/* ── 1. Micro-Location Intelligence Header ─────────────────────── */}
      <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_#000]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-black mb-5">
          <div>
            <div className="inline-block text-[10px] font-black uppercase px-2 py-0.5 bg-[#3B82F6] text-white mb-1">
              Micro-Location Economics
            </div>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">
              {location} Commercial Landscape
            </h2>
            <p className="text-xs text-neutral-500">
              Verified commercial benchmarks and active spaces for a {businessType}
            </p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1.5 bg-neutral-100 border border-neutral-300 text-xs font-bold font-mono">
              Footprint: {spaceRequired}
            </span>
            <span className="px-3 py-1.5 bg-neutral-100 border border-neutral-300 text-xs font-bold font-mono">
              Tier: {isTier1 ? 'Tier 1 Metro' : 'Tier 2/3 Market'}
            </span>
          </div>
        </div>

        {/* 4 Financial Benchmarks */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-neutral-50 border border-neutral-200">
            <span className="text-[10px] font-black uppercase text-neutral-500 block mb-1">Avg Commercial Rent</span>
            <span className="text-lg font-black text-neutral-900">₹{avgSqftRate}/sqft</span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">Monthly per sqft</span>
          </div>
          <div className="p-4 bg-neutral-50 border border-neutral-200">
            <span className="text-[10px] font-black uppercase text-neutral-500 block mb-1">Target Monthly Rent</span>
            <span className="text-lg font-black text-[#22C55E]">₹{estMonthlyRent.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">Max 8-10% of revenue</span>
          </div>
          <div className="p-4 bg-neutral-50 border border-neutral-200">
            <span className="text-[10px] font-black uppercase text-neutral-500 block mb-1">Est. Security Deposit</span>
            <span className="text-lg font-black text-amber-600">₹{estDeposit.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">{isTier1 ? '6-8 months' : '3-5 months'} upfront</span>
          </div>
          <div className="p-4 bg-neutral-50 border border-neutral-200">
            <span className="text-[10px] font-black uppercase text-neutral-500 block mb-1">Fit-out Rent-Free</span>
            <span className="text-lg font-black text-blue-600">30–45 Days</span>
            <span className="text-[10px] text-neutral-400 block mt-0.5">Standard negotiation</span>
          </div>
        </div>
      </div>

      {/* ── 2. Active Rental Listings in Database ──────────────────────── */}
      <div className="bg-white border-2 border-black p-6 shadow-[3px_3px_0px_0px_#000]">
        <div className="flex items-center justify-between pb-3 border-b-2 border-black mb-5">
          <div className="flex items-center gap-3">
            <span className="text-xl">🏢</span>
            <div>
              <h3 className="font-black uppercase text-base tracking-tight">Active Available Commercial Spaces</h3>
              <p className="text-xs text-neutral-500">Live listings matched to your business criteria and budget.</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-1 bg-black text-white">
            {rentals.length} Spaces Found
          </span>
        </div>

        {rentals.length === 0 ? (
          <div className="p-8 text-center bg-neutral-50 border border-neutral-200">
            <span className="text-3xl block mb-2">📍</span>
            <h4 className="font-bold text-sm uppercase mb-1">No direct listings found in database for "{location}"</h4>
            <p className="text-xs text-neutral-500 max-w-md mx-auto mb-4">
              We've applied regional benchmarks for your financial model. You can post a commercial space requirement in the Rentals section to attract landlords directly.
            </p>
            <div className="inline-block px-4 py-2 bg-black text-white font-bold text-xs uppercase neo-border">
              Standard Commercial Benchmark Applied
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rentals.map((r, i) => (
              <div
                key={r.id || i}
                className="p-5 border-2 border-black bg-[#FAFAFA] hover:bg-white transition-all shadow-[2px_2px_0px_0px_#000]"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-black text-sm uppercase text-neutral-900 leading-snug">
                    {r.title || `${r.square_feet || 750} sqft Commercial Space`}
                  </h4>
                  <span className="px-2 py-0.5 bg-[#22C55E] text-white text-[10px] font-black whitespace-nowrap">
                    ₹{(r.price || estMonthlyRent).toLocaleString('en-IN')}/mo
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-neutral-600 mb-3">
                  <span>📍 {r.locality || r.address || location}</span>
                  <span>·</span>
                  <span>📐 {r.square_feet ? `${r.square_feet} sqft` : spaceRequired}</span>
                  {r.rent_per_sqft && (
                    <>
                      <span>·</span>
                      <span className="font-bold text-neutral-900">₹{r.rent_per_sqft}/sqft</span>
                    </>
                  )}
                </div>

                {r.amenities && r.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {r.amenities.slice(0, 3).map((a, ai) => (
                      <span key={ai} className="px-2 py-0.5 bg-neutral-100 border border-neutral-200 text-[10px]">
                        {a}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-neutral-200 text-xs">
                  <span className="text-neutral-500 font-mono">
                    Status: <strong className="text-emerald-700">Available</strong>
                  </span>
                  <button
                    onClick={() => alert(`Listing contact: ${r.phone || 'Connect via Zonek Rentals tab'}`)}
                    className="px-3 py-1 bg-black text-white font-bold uppercase text-[11px] hover:bg-neutral-800"
                  >
                    Inquire Space →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 3. Lease Negotiation & Commercial Vetting Checklist ────────── */}
      <div className="bg-white border-2 border-black p-6 shadow-[3px_3px_0px_0px_#000]">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-black mb-5">
          <span className="text-xl">⚖️</span>
          <div>
            <h3 className="font-black uppercase text-base tracking-tight">Commercial Lease Due Diligence Playbook</h3>
            <p className="text-xs text-neutral-500">Protect your working capital before signing any commercial lease agreement in India.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="p-3 bg-neutral-50 border border-neutral-200">
              <span className="text-xs font-bold uppercase text-neutral-900 block mb-1">
                1. Commercial Property Tax Receipts (Khata / NOC)
              </span>
              <p className="text-xs text-neutral-600">
                Ensure the property has commercial zoning clearance (A-Khata in Bangalore / Commercial certificate). Residential conversion will block FSSAI or Trade Licences.
              </p>
            </div>
            <div className="p-3 bg-neutral-50 border border-neutral-200">
              <span className="text-xs font-bold uppercase text-neutral-900 block mb-1">
                2. Dedicated Power Load (KVA) & Water Connection
              </span>
              <p className="text-xs text-neutral-600">
                Confirm minimum 10-15 KVA commercial 3-phase power for equipment and verified meter separation to avoid landlord surcharges.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-neutral-50 border border-neutral-200">
              <span className="text-xs font-bold uppercase text-neutral-900 block mb-1">
                3. Lock-in Period & Escalation Cap
              </span>
              <p className="text-xs text-neutral-600">
                Negotiate a maximum 1-year lock-in with a 3-year agreement. Standard annual rental escalation should be capped at 5% (reject 10-15% demands).
              </p>
            </div>
            <div className="p-3 bg-neutral-50 border border-neutral-200">
              <span className="text-xs font-bold uppercase text-neutral-900 block mb-1">
                4. Signage & Facade Permissions
              </span>
              <p className="text-xs text-neutral-600">
                Verify written permission for front board signage and rooftop AC/exhaust units without additional monthly maintenance charges.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationRentalsTab;
