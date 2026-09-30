import React, { useState, useEffect } from 'react';
import {
  Building2,
  ChevronRight,
  Search,
  Layers,
  MapPin,
  Eye,
  ArrowUpDown,
  Database
} from 'lucide-react';

interface StateAnalytics {
  id: string;
  name: string;
  total: number;
  modules: Record<string, number>;
}

const MODULES = [
  { id: 'weather', name: 'Weather' },
  { id: 'crop_prices', name: 'Crop Prices' },
  { id: 'infrastructure', name: 'Infra' },
  { id: 'jjm', name: 'JJM Water' },
  { id: 'pmay', name: 'PMAY' },
  { id: 'courts', name: 'Courts' },
  { id: 'schools', name: 'Schools' },
  { id: 'elections', name: 'Elections' },
  { id: 'crimes', name: 'Crimes' },
  { id: 'budgets', name: 'Budgets' },
  { id: 'population', name: 'Population' }
];

const GovDashboard: React.FC = () => {
  const [states, setStates] = useState<StateAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drill-down State
  const [selectedState, setSelectedState] = useState<StateAnalytics | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [moduleData, setModuleData] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Search/Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'name' | 'total'>('total');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    fetchStateAnalytics();
  }, []);

  const fetchStateAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const response = await fetch(`${apiUrl}/api/gov/state-analytics`);
      const result = await response.json();
      if (result.success) {
        setStates(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to load states analytics');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to database');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectState = (state: StateAnalytics) => {
    setSelectedState(state);
    setSelectedModule(null);
    setModuleData([]);
  };

  const handleFetchModuleData = async (moduleId: string) => {
    if (!selectedState) return;
    setSelectedModule(moduleId);
    setDataLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const response = await fetch(`${apiUrl}/api/gov/data/gov_${moduleId}?limit=100`);
      const result = await response.json();
      if (result.success) {
        // Filter rows belonging to the state if applicable
        const filtered = (result.data || []).filter((row: any) =>
          !row.state_id || row.state_id === selectedState.id
        );
        setModuleData(filtered);
      }
    } catch (err) {
      console.error('Error fetching module data:', err);
    } finally {
      setDataLoading(false);
    }
  };

  // Filter & Sort States
  const filteredStates = states
    .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortField === 'name') {
        return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      } else {
        return sortAsc ? a.total - b.total : b.total - a.total;
      }
    });

  const totalRecordsAllStates = states.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="space-y-6">
      {/* Top Header Metrics */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-ink/5 p-4 rounded-md border border-ink/10">
        <div>
          <h2 className="text-xl font-bold font-mono tracking-tight text-ink uppercase flex items-center gap-2">
            <Database className="w-5 h-5 text-accent-green" />
            National Dataset Analytics
          </h2>
          <p className="text-sm font-mono text-ink/60 mt-1">
            Complete database footprint mapped across Indian States & Territories
          </p>
        </div>

        <div className="flex gap-4">
          <div className="bg-white px-4 py-2 rounded border border-ink/10 text-center">
            <span className="block text-xs font-mono text-ink/50 uppercase">States Loaded</span>
            <span className="text-lg font-bold font-mono text-ink">{states.length}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded border border-ink/10 text-center">
            <span className="block text-xs font-mono text-ink/50 uppercase">Total Data Rows</span>
            <span className="text-lg font-bold font-mono text-accent-green">{totalRecordsAllStates}</span>
          </div>
        </div>
      </div>

      {/* Main Content Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: All States Table */}
        <div className={`space-y-4 ${selectedState ? 'lg:col-span-6' : 'lg:col-span-12'}`}>
          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink/40" />
              <input
                type="text"
                placeholder="Search states..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-ink/20 rounded-md font-mono text-sm focus:outline-none focus:border-accent-green"
              />
            </div>
            <button
              onClick={() => {
                if (sortField === 'total') setSortAsc(!sortAsc);
                else { setSortField('total'); setSortAsc(false); }
              }}
              className="flex items-center gap-1 px-3 py-2 bg-white border border-ink/20 rounded-md text-xs font-mono uppercase hover:bg-ink/5"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              Sort: {sortField} ({sortAsc ? 'Asc' : 'Desc'})
            </button>
          </div>

          <div className="bg-white border border-ink/10 rounded-md overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead className="bg-ink/5 sticky top-0 border-b border-ink/10">
                  <tr>
                    <th className="p-3">State / UT</th>
                    <th className="p-3 text-right">Available Records</th>
                    <th className="p-3">Modules Tracked</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center p-8 text-ink/50">
                        Gathering real-time database counts...
                      </td>
                    </tr>
                  ) : filteredStates.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center p-8 text-ink/50">
                        No states matching search query.
                      </td>
                    </tr>
                  ) : (
                    filteredStates.map((s) => {
                      const isSelected = selectedState?.id === s.id;
                      const activeModulesCount = Object.values(s.modules).filter(v => v > 0).length;
                      return (
                        <tr
                          key={s.id}
                          onClick={() => handleSelectState(s)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-accent-green/10 font-bold'
                              : s.total > 0
                                ? 'hover:bg-ink/5'
                                : 'opacity-40 hover:bg-ink/5'
                          }`}
                        >
                          <td className="p-3 flex items-center gap-2">
                            <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-accent-green' : 'text-ink/40'}`} />
                            {s.name}
                          </td>
                          <td className="p-3 text-right">
                            <span className={`px-2 py-0.5 rounded text-[11px] ${
                              s.total > 0 ? 'bg-ink/5 text-ink' : 'text-ink/40'
                            }`}>
                              {s.total}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] text-ink/60">
                              {activeModulesCount} / {MODULES.length} categories
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <ChevronRight className="w-4 h-4 mx-auto text-ink/40" />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Drilldown for Selected State */}
        {selectedState && (
          <div className="lg:col-span-6 space-y-4 animate-fade-in">
            <div className="bg-white border border-ink/10 rounded-md p-4">
              <div className="flex justify-between items-start border-b border-ink/10 pb-3 mb-4">
                <div>
                  <h3 className="text-lg font-bold font-mono text-ink flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-accent-green" />
                    {selectedState.name}
                  </h3>
                  <span className="text-xs font-mono text-ink/50">UUID: {selectedState.id}</span>
                </div>
                <button
                  onClick={() => setSelectedState(null)}
                  className="text-xs font-mono text-ink/40 hover:text-ink"
                >
                  Close Detail
                </button>
              </div>

              {/* Module Grid Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {MODULES.map((m) => {
                  const count = selectedState.modules[m.id] || 0;
                  const isActive = selectedModule === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleFetchModuleData(m.id)}
                      className={`p-3 rounded border text-left transition-all ${
                        isActive
                          ? 'border-accent-green bg-accent-green/5'
                          : count > 0
                            ? 'border-ink/10 hover:border-ink/30 bg-white'
                            : 'border-dashed border-ink/10 opacity-50 bg-ink/2'
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="font-semibold text-ink/80">{m.name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          count > 0 ? 'bg-ink/5 font-bold' : 'text-ink/40'
                        }`}>
                          {count}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Module Data Table */}
              {selectedModule && (
                <div className="mt-4 border-t border-ink/10 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-ink">
                      Raw Records: gov_{selectedModule}
                    </h4>
                    <span className="text-[10px] font-mono text-ink/50">
                      {moduleData.length} records shown
                    </span>
                  </div>

                  {dataLoading ? (
                    <div className="text-center p-8 text-xs font-mono text-ink/50">
                      Fetching database rows...
                    </div>
                  ) : moduleData.length === 0 ? (
                    <div className="text-center p-8 border border-dashed border-ink/10 rounded font-mono text-xs text-ink/40">
                      No matching records found in this table for {selectedState.name}.
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-[350px] border border-ink/10 rounded">
                      <table className="w-full text-left border-collapse font-mono text-[11px]">
                        <thead className="bg-ink/5 sticky top-0">
                          <tr>
                            {Object.keys(moduleData[0] || {})
                              .filter(k => !['id', 'state_id'].includes(k))
                              .map(key => (
                                <th key={key} className="p-2 border-b border-ink/10 uppercase">
                                  {key.replace(/_/g, ' ')}
                                </th>
                              ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ink/5">
                          {moduleData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-ink/5">
                              {Object.entries(row)
                                .filter(([k]) => !['id', 'state_id'].includes(k))
                                .map(([k, val], cIdx) => (
                                  <td key={cIdx} className="p-2 truncate max-w-[200px]">
                                    {val === null ? '-' : typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                  </td>
                                ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default GovDashboard;