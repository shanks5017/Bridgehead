import React, { useState, useEffect } from 'react';

// All 12 government modules mapped to their DB table names + fetcher IDs
const MODULES = [
    { id: 'weather', fetcherId: 'Weather', tableName: 'gov_weather', name: 'Weather' },
    { id: 'crop_prices', fetcherId: 'Crop Prices', tableName: 'gov_crop_prices', name: 'Crop Prices' },
    { id: 'infrastructure_news', fetcherId: 'Infrastructure News', tableName: 'gov_infrastructure_news', name: 'Infrastructure News' },
    { id: 'schemes', fetcherId: 'Schemes', tableName: 'gov_schemes', name: 'Schemes' },
    { id: 'jjm', fetcherId: 'JJM', tableName: 'gov_jjm', name: 'JJM (Water)' },
    { id: 'pmay', fetcherId: 'PMAY', tableName: 'gov_pmay', name: 'PMAY Housing' },
    { id: 'courts', fetcherId: 'Courts', tableName: 'gov_courts', name: 'Courts' },
    { id: 'schools', fetcherId: 'Schools', tableName: 'gov_schools', name: 'Schools (UDISE+)' },
    { id: 'elections', fetcherId: 'Elections', tableName: 'gov_elections', name: 'Elections' },
    { id: 'crimes', fetcherId: 'Crimes', tableName: 'gov_crimes', name: 'Crime / Safety' },
    { id: 'budgets', fetcherId: 'Budget', tableName: 'gov_budgets', name: 'Budget' },
    { id: 'population', fetcherId: 'Population', tableName: 'gov_population', name: 'Population' }
];

const GovDataTester: React.FC = () => {
    const [activeModuleId, setActiveModuleId] = useState<string>('budgets');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [triggerLoading, setTriggerLoading] = useState(false);
    const [triggerLog, setTriggerLog] = useState('');

    const activeModule = MODULES.find(m => m.id === activeModuleId) || MODULES[0];

    useEffect(() => {
        fetchData();
    }, [activeModuleId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
            const response = await fetch(`${apiUrl}/api/gov/data/${activeModule.tableName}?limit=100`);
            const result = await response.json();
            if (result.success) {
                setData(result.data || []);
            } else {
                setData([]);
            }
        } catch (err) {
            console.error('Error:', err);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRunScraper = async () => {
        setTriggerLoading(true);
        setTriggerLog('Triggering scraper pipeline...\n');
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
            const response = await fetch(`${apiUrl}/api/gov/scrape`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ moduleId: activeModule.fetcherId })
            });
            const result = await response.json();
            if (result.success) {
                setTriggerLog(prev => prev + 'Success!\n' + result.output);
                fetchData();
            } else {
                setTriggerLog(prev => prev + 'Error!\n' + result.error + '\n' + result.stderr);
            }
        } catch (err: any) {
            setTriggerLog(prev => prev + 'Fetch failed!\n' + err.message);
        } finally {
            setTriggerLoading(false);
        }
    };

    return (
        <div className="flex flex-col space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                <div className="flex space-x-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
                    {MODULES.map(m => (
                        <button
                            key={m.id}
                            onClick={() => setActiveModuleId(m.id)}
                            className={`px-4 py-2 text-sm font-mono uppercase tracking-wider rounded-md transition-colors ${
                                activeModuleId === m.id
                                    ? 'bg-accent-green text-white font-bold'
                                    : 'bg-ink/5 text-ink/70 hover:bg-ink/10'
                            }`}
                        >
                            {m.name}
                        </button>
                    ))}
                </div>
                <button
                    onClick={handleRunScraper}
                    disabled={triggerLoading}
                    className="px-4 py-2 bg-black text-white font-mono uppercase tracking-wider rounded-md hover:bg-black/80 transition-colors disabled:opacity-50"
                >
                    {triggerLoading ? 'Running...' : 'Run Gov Scraper'}
                </button>
            </div>

            {triggerLog && (
                <div className="bg-ink text-white p-4 rounded-md font-mono text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                    {triggerLog}
                </div>
            )}

            <div className="bg-ink/5 p-4 rounded-md flex justify-between items-center">
                <span className="font-mono text-sm uppercase text-ink/70">Total Records Displayed</span>
                <span className="font-mono text-xl font-bold">{data.length}</span>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-green"></div>
                </div>
            ) : data.length === 0 ? (
                <div className="text-center py-12 text-ink/50 font-mono">
                    No data found for {activeModule.name}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.map((item, index) => (
                        <div key={index} className="bg-white border border-ink/10 rounded-md p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-ink uppercase text-xs">
                                    {item.station_name || item.market_name || item.scheme_name || item.habitation_name || item.school_name || item.constituency_name || item.title || item.commodity_name || item.district_name || item.state_name || item.district || item.state || 'Data Record'}
                                </span>
                                <span className="text-[10px] text-ink/50 font-mono bg-ink/5 px-2 py-1 rounded">
                                    {item.year || item.census_year || item.fiscal_year || item.sanction_year || (item.observed_at ? new Date(item.observed_at).getFullYear() : item.price_date ? new Date(item.price_date).getFullYear() : item.published_at ? new Date(item.published_at).getFullYear() : item.last_updated ? new Date(item.last_updated).getFullYear() : 'Record')}
                                </span>
                            </div>
                            <div className="space-y-2 mt-3 max-h-64 overflow-y-auto pr-1">
                                {Object.entries(item)
                                    .filter(([k]) => !['id'].includes(k)) // Only hide the raw PK
                                    .map(([key, value]) => {
                                        let displayValue = String(value);
                                        if (value === null || value === undefined) {
                                            displayValue = 'null';
                                        } else if (typeof value === 'object') {
                                            displayValue = JSON.stringify(value);
                                        } else if (typeof value === 'boolean') {
                                            displayValue = value ? 'true' : 'false';
                                        }
                                        return (
                                            <div key={key} className="flex flex-col text-sm border-b border-ink/5 pb-1">
                                                <span className="text-ink/60 font-semibold text-xs uppercase">{key.replace(/_/g, ' ')}</span>
                                                <span className="font-mono text-ink text-sm break-words whitespace-pre-wrap">{displayValue}</span>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GovDataTester;
