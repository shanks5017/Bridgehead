
import React, { useState } from 'react';
import { generateBusinessIdeas } from '../services/groqService';
import { DemandPost } from '../types';
import { LoadingSpinner, LocationPinIcon, SparklesIcon, SearchIcon } from './icons';
import { LoadingState } from './LandingPages';

interface AISuggestionsProps {
    demands: DemandPost[];
}

const markdownToHtml = (text: string) => {
    if (!text) return '';
    let html = text;
    // Headings
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-serif-italic font-black text-ink uppercase mt-8 mb-4 border-b border-ink/10 pb-1">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-serif-italic font-black text-ink uppercase mt-10 mb-5 pb-2 border-b-2 border-ink">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-serif-italic font-black text-ink uppercase mt-12 mb-6">$1</h1>');
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-accent-green font-black tracking-tight bg-ink/5 px-1 rounded-sm">$1</strong>');
    // List items
    html = html.replace(/^\* (.*$)/gim, '<li class="flex items-start gap-3 mb-2 font-mono text-[11px] font-bold uppercase opacity-80"><span class="w-1.5 h-1.5 bg-accent-green flex-shrink-0 mt-1" /> $1</li>');
    html = html.replace(/^\d+\. (.*$)/gim, '<li class="flex items-start gap-3 mb-2 font-mono text-[11px] font-bold uppercase opacity-80"><span class="text-accent-green">$1.</span> $1</li>');
    // Group list items
    html = html.replace(/<\/li>\n<li/g, '</li><li');
    html = html.replace(/(<li.*<\/li>)/gs, '<ul class="my-6 space-y-2">$1</ul>');
    html = html.replace(/<\/ul>\s*<ul>/g, ''); // Fix consecutive lists
    // Paragraphs
    html = html.split('\n').map(line => line.trim() === '' ? '' : (line.startsWith('<') ? line : `<p class="text-sm font-bold uppercase tracking-tight leading-relaxed opacity-70 mb-4">${line}</p>`)).join('');

    return html;
};

const AISuggestions: React.FC<AISuggestionsProps> = ({ demands }) => {
    const [response, setResponse] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [isDeepDive, setIsDeepDive] = useState(false);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError('');

        const getLocation = new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
            if (location) return resolve(location);
            if (!navigator.geolocation) {
                reject(new Error("Geolocation is not supported by your browser."));
                return;
            }
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    setLocation({ latitude, longitude });
                    resolve({ latitude, longitude });
                },
                () => {
                    reject(new Error("Unable to retrieve your location. Please enable location services."));
                }
            );
        });

        try {
            const userLocation = await getLocation;
            const result = await generateBusinessIdeas(userLocation, demands, isDeepDive);
            setResponse(result);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegenerate = () => {
        setResponse(null);
        handleGenerate();
    };

    // Initial, pre-generation view
    if (!response && !isLoading) {
        return (
            <div className="h-[calc(100vh-5rem)] mt-20 bg-foundation flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-ink/10">
                    {/* Tactical Scan Terminal */}
                    <div className="bg-ink text-foundation pt-32 pb-20 px-6 overflow-hidden relative">
                        {/* Animated Radar/Grid Background */}
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-accent-green/20 rounded-full animate-ping-slow pointer-events-none" />
                        
                        <div className="container mx-auto max-w-5xl relative z-10">
                            <div className="flex items-center gap-4 mb-8 animate-slide-up">
                                <div className="p-3 bg-accent-green text-ink neo-border shadow-[4px_4px_0px_rgba(255,255,255,1)]">
                                    <SparklesIcon className="w-8 h-8" />
                                </div>
                                <div className="text-[10px] font-mono font-bold tracking-[0.4em] uppercase text-accent-green">Operational Scanner // ACTIVE SIGNAL</div>
                            </div>

                            <h1 className="text-6xl md:text-8xl font-serif-italic font-black tracking-tighter uppercase leading-[0.85] mb-8 animate-slide-up stagger-1">
                                Market Intelligence <br/> 
                                <span className="text-accent-green italic">Scanner</span>
                            </h1>

                            <p className="text-xl md:text-2xl font-bold uppercase tracking-tight max-w-2xl mb-12 opacity-80 animate-slide-up stagger-2">
                                Deploy heuristic analysis over your local coordinate bounds to identify high-probability business opportunities.
                            </p>

                            <div className="flex flex-col md:flex-row items-center gap-8 animate-slide-up stagger-3">
                                <button
                                    onClick={handleGenerate}
                                    className="group relative bg-accent-green text-ink px-10 py-5 text-lg font-black uppercase tracking-widest border-2 border-foundation hover:translate-x-1 hover:-translate-y-1 transition-all"
                                >
                                    <span className="relative z-10 flex items-center gap-3">
                                        <LocationPinIcon className="w-6 h-6 animate-pulse" />
                                        Scan My Location
                                    </span>
                                    <div className="absolute -bottom-2 -left-2 w-full h-full bg-white -z-10 group-hover:bottom-0 group-hover:left-0 transition-all border-2 border-foundation" />
                                </button>

                                <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setIsDeepDive(!isDeepDive)}>
                                    <div className={`w-12 h-6 border-2 border-foundation rounded-full relative transition-all ${isDeepDive ? 'bg-accent-green' : 'bg-transparent'}`}>
                                        <div className={`absolute top-0.5 w-4 h-4 bg-foundation rounded-full transition-all ${isDeepDive ? 'left-6.5' : 'left-0.5'}`} />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-[10px] font-mono font-bold uppercase text-accent-green">Diagnostic Mode</div>
                                        <div className="text-xs font-bold uppercase tracking-widest text-foundation/60">Full Heuristic Deep Dive</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scan Directives Section */}
                    <div className="container mx-auto max-w-7xl px-6 py-20">
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { title: "Spatial Analysis", desc: "Coordinates derived from real-time geolocation protocols." },
                                { title: "Demand Aggregation", desc: `{'signals': '${demands.length}', 'source': 'Community Hub'}` },
                                { title: "Opportunity Engine", desc: "Strategy formulation via advanced business logic models." }
                            ].map((f, i) => (
                                <div key={i} className="p-8 border-2 border-ink bg-white neo-shadow-sm hover:neo-shadow-md transition-all animate-slide-up" style={{ animationDelay: `${i * 100 + 400}ms` }}>
                                    <div className="text-[10px] font-mono font-bold uppercase text-accent-green mb-4">Diagnostic: 0{i+1}</div>
                                    <h3 className="text-xl font-serif-italic font-black uppercase mb-3">{f.title}</h3>
                                    <p className="text-sm font-bold opacity-60 uppercase leading-tight">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Loading and Results View
    return (
        <div className="h-[calc(100vh-5rem)] mt-20 bg-foundation/50 flex flex-col overflow-hidden">
            {/* Intel Dashboard Header */}
            <div className="bg-white border-b-2 border-ink shrink-0 px-6 md:px-12 py-3 overflow-hidden relative z-30">
                <div className="absolute top-0 right-0 w-64 h-full bg-ink/5 skew-x-[-20deg] translate-x-32" />
                <div className="container mx-auto max-w-7xl flex flex-col md:flex-row md:items-end justify-between relative z-10">
                    <div>
                        <h1 className="text-xl md:text-2xl font-serif-italic font-black tracking-tighter uppercase leading-none">Market <span className="text-accent-green">Intelligence</span></h1>
                        <p className="text-[9px] font-mono font-bold opacity-40 uppercase tracking-widest mt-1.5 px-1 border-l border-accent-green/30">Analysis Profile: {isDeepDive ? 'FULL HEURISTIC SCAN' : 'SWIFT SCAN'} // {demands.length} Signals</p>
                    </div>
                    <div className="mt-8 md:mt-0 flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <div className="text-[10px] font-mono opacity-40 uppercase">Operational Logic</div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-green">RE-SCAN LOCATION</div>
                        </div>
                        <button 
                            onClick={handleRegenerate}
                            disabled={isLoading}
                            className="bg-ink text-foundation p-3 neo-border hover:bg-accent-green hover:text-ink transition-all active:translate-y-px disabled:opacity-50"
                        >
                            {isLoading ? <div className="w-5 h-5 border-2 border-foundation border-t-transparent rounded-full animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-12 scrollbar-thin scrollbar-thumb-ink/10">
                <div className="container mx-auto max-w-5xl">
                    {isLoading && !response ? (
                        <div className="py-20 animate-pulse">
                            <div className="flex flex-col items-center justify-center text-center">
                                <div className="w-32 h-1 bg-ink/10 relative overflow-hidden mb-8">
                                    <div className="absolute inset-0 bg-accent-green animate-loading-slide" />
                                </div>
                                <div className="text-[10px] font-mono font-bold uppercase tracking-[0.5em] opacity-40">Scanning Network Signal Layer...</div>
                                <p className="text-xs font-bold uppercase mt-4">{isDeepDive ? "HEURISTIC DEEP DIVE IN PROGRESS [STABLE]" : "SWIFT SCAN INITIATED [PENDING]"}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-slide-up">
                            {/* Scanner Output Viewport */}
                            <div className="bg-white border-2 border-ink neo-shadow-md overflow-hidden relative">
                                {/* Visual Scanner Accents */}
                                <div className="absolute top-0 left-0 w-2 h-full bg-accent-green opacity-20" />
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <SparklesIcon className="w-24 h-24" />
                                </div>

                                <div className="p-8 md:p-12">
                                    <div className="flex items-center gap-3 mb-10 border-b border-ink/5 pb-6">
                                        <div className="w-1.5 h-1.5 bg-accent-green rounded-full shadow-[0_0_8px_rgba(34,197,94,0.3)]" />
                                        <span className="text-[9px] font-mono font-black uppercase tracking-[0.3em]">INTELLIGENCE OUTPUT // DECODED_DATA.LOG</span>
                                    </div>
                                    
                                    <div 
                                        className="prose-neo-brutalist"
                                        dangerouslySetInnerHTML={{ __html: markdownToHtml(typeof response === 'string' ? response : response?.text || '') }}
                                    />
                                    
                                    <div className="mt-12 pt-10 border-t border-ink/10 flex flex-col md:flex-row items-center justify-between gap-6">
                                        <div className="text-[9px] font-mono font-bold uppercase opacity-40 px-4 py-2 bg-foundation border border-ink/10">
                                            End of Strategy Manifest // Secure Connection
                                        </div>
                                        <div className="flex gap-4">
                                            <button className="text-[10px] font-bold uppercase tracking-widest px-6 py-3 border border-ink hover:bg-foundation transition-all">Export Log</button>
                                            <button className="text-[10px] font-black uppercase tracking-widest px-6 py-3 bg-ink text-foundation hover:bg-accent-green hover:text-ink transition-all">Verify All Points</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="mt-8 p-6 bg-red-50 border-2 border-red-500 text-red-600 font-bold uppercase text-xs tracking-widest text-center animate-shake">
                            System Interruption // {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AISuggestions;
