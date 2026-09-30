import React, { useState } from 'react';
import ScraperTester from './ScraperTester';
import GovDashboard from './GovDashboard';

type PlatformId = 'olx' | 'nobroker' | '99acres' | 'magicbricks' | 'housing' | 'proptiger' | 'gov';

const PLATFORMS = [
    { id: 'olx', name: 'OLX' },
    { id: 'nobroker', name: 'NoBroker' },
    { id: '99acres', name: '99acres' },
    { id: 'magicbricks', name: 'MagicBricks' },
    { id: 'housing', name: 'Housing.com' },
    { id: 'proptiger', name: 'PropTiger' },
    { id: 'gov', name: 'Gov Data' }
];

const TestingView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<PlatformId>('olx');

    const activePlatform = PLATFORMS.find(p => p.id === activeTab);

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold font-mono tracking-tight text-ink uppercase">Scraper Testing Engine</h1>
                <p className="mt-2 text-ink/60 font-mono text-sm max-w-2xl">
                    Direct interface to test backend scraper microservices, inspect raw data output, and bypass caches. Limit set to 100 for comprehensive testing.
                </p>
            </div>

            <div className="flex border-b border-ink/10 mb-8 overflow-x-auto whitespace-nowrap">
                {PLATFORMS.map((platform) => (
                    <button
                        key={platform.id}
                        onClick={() => setActiveTab(platform.id as PlatformId)}
                        className={`py-3 px-6 font-mono text-sm uppercase tracking-wider font-bold transition-colors ${
                            activeTab === platform.id
                                ? 'text-accent-green border-b-2 border-accent-green bg-ink/5'
                                : 'text-ink/50 hover:text-ink hover:bg-ink/5'
                        }`}
                    >
                        {platform.name}
                    </button>
                ))}
            </div>

            <div className="bg-white neo-border p-6 shadow-sm">
                {activePlatform && activePlatform.id === 'gov' ? (
                    <GovDashboard />
                ) : activePlatform ? (
                    <ScraperTester
                        platformId={activePlatform.id}
                        platformName={activePlatform.name}
                    />
                ) : null}
            </div>
        </div>
    );
};

export default TestingView;
