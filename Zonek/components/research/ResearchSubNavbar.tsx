import React from 'react';

export type ResearchTabId = 'overview' | 'location' | 'competitors' | 'financials' | 'compliance';

interface TabItem {
  id: ResearchTabId;
  label: string;
  badge?: string;
  badgeColor?: string;
  icon: string;
}

interface Props {
  activeTab: ResearchTabId;
  onTabChange: (tab: ResearchTabId) => void;
  verdict?: 'GO' | 'CAUTION' | 'STOP';
  rentalsCount?: number;
  competitorsCount?: number;
  schemesCount?: number;
  onExportPdf?: () => void;
  onBackToForm?: () => void;
}

export const ResearchSubNavbar: React.FC<Props> = ({
  activeTab,
  onTabChange,
  verdict = 'CAUTION',
  rentalsCount = 0,
  competitorsCount = 0,
  schemesCount = 0,
  onExportPdf,
  onBackToForm,
}) => {
  const tabs: TabItem[] = [
    {
      id: 'overview',
      label: 'Overview & Feasibility',
      icon: '🎯',
      badge: verdict,
      badgeColor:
        verdict === 'GO' ? 'bg-[#22C55E] text-white' :
        verdict === 'CAUTION' ? 'bg-[#FBBF24] text-[#141414]' :
        'bg-[#EF4444] text-white',
    },
    {
      id: 'location',
      label: 'Location & Rentals',
      icon: '📍',
      badge: rentalsCount > 0 ? `${rentalsCount} Spaces` : undefined,
      badgeColor: 'bg-[#3B82F6] text-white',
    },
    {
      id: 'competitors',
      label: 'Competitors & Longevity',
      icon: '⚔️',
      badge: competitorsCount > 0 ? `${competitorsCount} Analyzed` : undefined,
      badgeColor: 'bg-purple-600 text-white',
    },
    {
      id: 'financials',
      label: 'Financial Blueprint',
      icon: '📊',
      badge: '12m P&L',
      badgeColor: 'bg-emerald-600 text-white',
    },
    {
      id: 'compliance',
      label: 'Gov Schemes & SOPs',
      icon: '🏛️',
      badge: schemesCount > 0 ? `${schemesCount} Schemes` : 'Verified',
      badgeColor: 'bg-amber-600 text-white',
    },
  ];

  return (
    <div className="sticky top-16 md:top-20 z-30 bg-[#141414] border-b-2 border-black text-white px-3 md:px-6 py-2.5 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 md:gap-2 overflow-x-auto w-full md:w-auto no-scrollbar py-0.5">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs md:text-sm font-bold uppercase whitespace-nowrap transition-all rounded-none border-2 ${
                  isActive
                    ? 'bg-white text-[#141414] border-white shadow-[2px_2px_0px_0px_#22C55E]'
                    : 'bg-transparent text-white/70 border-transparent hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 leading-none ${tab.badgeColor || 'bg-white/20'}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {onExportPdf && (
            <button
              onClick={onExportPdf}
              className="px-3.5 py-1.5 bg-[#22C55E] text-white hover:bg-[#16a34a] font-bold uppercase text-xs border-2 border-black flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px]"
            >
              <span>📄</span>
              <span>Investor PDF</span>
            </button>
          )}
          {onBackToForm && (
            <button
              onClick={onBackToForm}
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold uppercase text-xs border border-white/20"
            >
              ← Edit Inputs
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResearchSubNavbar;
