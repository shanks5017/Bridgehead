
import React, { useState } from 'react';
import { DemandPost, RentalPost, MatchResult, View } from '../types';
import { findMatches } from '../services/groqService';
import { LoadingState, EmptyState } from './LandingPages';
import DemandCard from './DemandCard';
import RentalCard from './RentalCard';
import { LinkIcon, PlusIcon, SparklesIcon } from './icons';
import PremiumButton from './common/PremiumButton';

interface AIMatchesProps {
    demands: DemandPost[];
    rentals: RentalPost[];
    onPostSelect: (post: DemandPost | RentalPost) => void;
    onDemandUpvote: (id: string) => void;
    onDemandSaveToggle: (id: string) => void;
    onRentalSaveToggle: (id: string) => void;
    savedDemandIds: string[];
    savedRentalIds: string[];
}

const MatchCard: React.FC<{
    match: MatchResult;
    demand: DemandPost;
    rental: RentalPost;
    onPostSelect: (post: DemandPost | RentalPost) => void;
    onDemandUpvote: (id: string) => void;
    onDemandSaveToggle: (id: string) => void;
    onRentalSaveToggle: (id: string) => void;
    isDemandSaved?: boolean;
    isRentalSaved?: boolean;
}> = ({ match, demand, rental, onPostSelect, onDemandUpvote, onDemandSaveToggle, onRentalSaveToggle, isDemandSaved = false, isRentalSaved = false }) => {
    const confidence = Math.round(match.confidenceScore * 100);
    
    return (
        <div className="group relative bg-white border-2 border-ink neo-shadow-md overflow-hidden transition-all hover:neo-shadow-lg animate-slide-up">
            {/* Tactical Header */}
            <div className="bg-ink text-foundation px-6 py-3 flex items-center justify-between border-b-2 border-ink">
                <div className="flex items-center gap-3">
                    <SparklesIcon className="w-4 h-4 text-accent-green animate-pulse" />
                    <span className="text-[10px] font-mono tracking-[0.3em] font-bold uppercase">Signal Match Detected // CONFIDENCE: {confidence}%</span>
                </div>
                <div className="text-[10px] font-mono opacity-40 uppercase">Bridge ID: {match.demandId.substring(0,6)}-{match.rentalId.substring(0,6)}</div>
            </div>

            <div className="p-8 lg:p-12">
                <div className="flex flex-col lg:grid lg:grid-cols-12 items-stretch gap-8 lg:gap-0 relative">
                    {/* Column 1: Demand Signal */}
                    <div className="lg:col-span-5 relative">
                        <div className="absolute -top-4 -left-4 bg-accent-green text-ink px-2 py-0.5 text-[8px] font-mono font-bold z-10 border border-ink uppercase">Source: Demand</div>
                        <DemandCard 
                            post={demand} 
                            onPostSelect={onPostSelect} 
                            onUpvote={onDemandUpvote} 
                            isSaved={isDemandSaved} 
                            onSaveToggle={onDemandSaveToggle} 
                        />
                    </div>

                    {/* Column 2: Matching Core (The Bridge) */}
                    <div className="lg:col-span-2 flex flex-col items-center justify-center py-8 lg:py-0 relative">
                        {/* Connecting Lines (Desktop Only) */}
                        <div className="hidden lg:block absolute left-0 right-0 top-1/2 h-px bg-ink/10 -z-10" />
                        
                        <div className="relative">
                            {/* Circular Confidence Meter */}
                            <div className="w-24 h-24 rounded-full border-4 border-foundation flex items-center justify-center bg-white neo-shadow-sm relative z-10 overflow-hidden">
                                <div 
                                    className="absolute bottom-0 left-0 right-0 bg-accent-green/20 transition-all duration-1000" 
                                    style={{ height: `${confidence}%` }} 
                                />
                                <div className="text-center">
                                    <div className="text-3xl font-serif-italic font-black leading-none">{confidence}</div>
                                    <div className="text-[8px] font-mono font-bold uppercase opacity-40">Score</div>
                                </div>
                            </div>
                            
                            {/* Animated Scanner Ring */}
                            <div className="absolute -inset-2 border border-accent-green/30 rounded-full animate-ping opacity-20" />
                        </div>

                        <div className="mt-4 px-3 py-1 bg-ink text-accent-green text-[8px] font-mono font-bold tracking-widest uppercase rounded-full">
                            Logic Synchronized
                        </div>
                    </div>

                    {/* Column 3: Asset Signal */}
                    <div className="lg:col-span-5 relative">
                        <div className="absolute -top-4 -right-4 bg-accent-green text-ink px-2 py-0.5 text-[8px] font-mono font-bold z-10 border border-ink uppercase">Target: Asset</div>
                        <RentalCard 
                            post={rental} 
                            onPostSelect={onPostSelect} 
                            isSaved={isRentalSaved} 
                            onSaveToggle={onRentalSaveToggle} 
                        />
                    </div>
                </div>

                {/* Intelligence Analysis Output */}
                <div className="mt-12 bg-foundation border border-ink/10 p-6 relative">
                    <div className="absolute -top-2.5 left-6 bg-foundation px-3 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-ink rounded-full" />
                        <span className="text-[9px] font-mono font-black uppercase tracking-[0.2em]">Strategy Reasoning // Output</span>
                    </div>
                    <p className="text-sm font-bold uppercase tracking-tight leading-relaxed opacity-80 pt-2">
                        {match.reasoning}
                    </p>
                </div>

                {/* Operational Actions */}
                <div className="mt-8 pt-8 border-t border-ink/5 flex items-center justify-between gap-4">
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-green/5 border border-accent-green/20">
                            <span className="w-1.5 h-1.5 bg-accent-green rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                            <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-accent-green">Match Verified</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => onPostSelect(demand)}
                        className="bg-ink text-foundation px-8 py-3 text-xs font-bold tracking-widest uppercase hover:bg-accent-green hover:text-ink transition-all active:translate-y-px"
                    >
                        Initiate Connection
                    </button>
                </div>
            </div>
        </div>
    );
}


const AIMatches: React.FC<AIMatchesProps> = ({ 
    demands = [], 
    rentals = [], 
    onPostSelect, 
    onDemandUpvote, 
    onDemandSaveToggle, 
    onRentalSaveToggle, 
    savedDemandIds = [], 
    savedRentalIds = [] 
}) => {
    const [matches, setMatches] = useState<MatchResult[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [visibleMatchesCount, setVisibleMatchesCount] = useState(5);

    const handleFindMatches = async () => {
        setIsLoading(true);
        setError('');
        try {
            const results = await findMatches(demands, rentals);
            // Sort by confidence score descending
            results.sort((a, b) => b.confidenceScore - a.confidenceScore);
            setMatches(results);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="min-h-screen"><LoadingState message="Our AI is playing matchmaker, analyzing the best fits..." /></div>
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
                <EmptyState title="An Error Occurred" message={error} />
                <button
                    onClick={handleFindMatches}
                    className="mt-8 px-6 py-3 rounded-lg text-lg font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                    Try Again
                </button>
            </div>
        )
    }

    if (!matches) {
        return (
            <div className="min-h-screen bg-foundation">
                {/* Tactical Hero Landing */}
                <div className="bg-ink text-foundation pt-32 pb-20 px-6 overflow-hidden relative">
                    {/* Animated Grid Background */}
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent-green/20 blur-[120px] rounded-full animate-pulse" />
                    
                    <div className="container mx-auto max-w-5xl relative z-10">
                        <div className="flex items-center gap-4 mb-8 animate-slide-up">
                            <div className="p-3 bg-accent-green text-ink neo-border shadow-[4px_4px_0px_rgba(255,255,255,1)]">
                                <LinkIcon className="w-8 h-8" />
                            </div>
                            <div className="text-[10px] font-mono font-bold tracking-[0.4em] uppercase text-accent-green">Operational Terminal // v2.0</div>
                        </div>

                        <h1 className="text-6xl md:text-8xl font-serif-italic font-black tracking-tighter uppercase leading-[0.85] mb-8 animate-slide-up stagger-1">
                            AI Opportunity <br/> 
                            <span className="text-accent-green italic">Matchmaker</span>
                        </h1>

                        <p className="text-xl md:text-2xl font-bold uppercase tracking-tight max-w-2xl mb-12 opacity-80 animate-slide-up stagger-2">
                            Discover high-confidence connections between active community demands and available commercial assets.
                        </p>

                        <div className="flex flex-wrap gap-6 animate-slide-up stagger-3">
                            <button
                                onClick={handleFindMatches}
                                className="group relative bg-accent-green text-ink px-10 py-5 text-lg font-black uppercase tracking-widest border-2 border-foundation hover:translate-x-1 hover:-translate-y-1 transition-all"
                            >
                                <span className="relative z-10 flex items-center gap-3">
                                    <SparklesIcon className="w-6 h-6 animate-spin-slow" />
                                    Initiate Match Sequence
                                </span>
                                <div className="absolute -bottom-2 -left-2 w-full h-full bg-white -z-10 group-hover:bottom-0 group-hover:left-0 transition-all border-2 border-foundation" />
                            </button>

                            <div className="flex-1 flex flex-col justify-center border-l-2 border-foundation/20 pl-8">
                                <div className="text-[10px] font-mono tracking-widest uppercase opacity-40 mb-1">Processing Capacity</div>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 h-1 bg-foundation/10 max-w-[200px]">
                                        <div className="h-full bg-accent-green w-[88%] shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                    </div>
                                    <span className="text-xs font-mono font-bold">1.2 TFLOPS</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tactical Features Section */}
                <div className="container mx-auto max-w-7xl px-6 py-20">
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { title: "Heuristic Linkage", desc: "Advanced semantic analysis and category cross-referencing." },
                            { title: "Locational Intelligence", desc: "Proximity-based matching within precise coordinate bounds." },
                            { title: "Strategic Rationale", desc: "Neural explanation of every suggested business partnership." }
                        ].map((f, i) => (
                            <div key={i} className="p-8 border-2 border-ink bg-white neo-shadow-sm hover:neo-shadow-md transition-all animate-slide-up" style={{ animationDelay: `${i * 100 + 400}ms` }}>
                                <div className="text-[10px] font-mono font-bold uppercase text-accent-green mb-4">Protocol: 0{i+1}</div>
                                <h3 className="text-xl font-serif-italic font-black uppercase mb-3">{f.title}</h3>
                                <p className="text-sm font-bold opacity-60 uppercase leading-tight">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-5rem)] mt-20 bg-foundation/50 flex flex-col overflow-hidden">
            {/* Control Center Header */}
            <div className="bg-white border-b-2 border-ink shrink-0 px-6 md:px-12 py-3 overflow-hidden relative z-30">
                <div className="absolute top-0 right-0 w-64 h-full bg-ink/5 skew-x-[-20deg] translate-x-32" />
                <div className="container mx-auto max-w-7xl flex flex-col md:flex-row md:items-end justify-between relative z-10">
                    <div>
                        <h1 className="text-xl md:text-2xl font-serif-italic font-black tracking-tighter uppercase leading-none">Match <span className="text-accent-green">Results</span></h1>
                        <p className="text-[9px] font-mono font-bold opacity-40 uppercase tracking-widest mt-1.5 px-1 border-l border-accent-green/30">Strategic linkage: {demands.length} signals // {rentals.length} assets</p>
                    </div>
                    <div className="mt-8 md:mt-0 flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <div className="text-[10px] font-mono opacity-40 uppercase">Operational Logic</div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-green">RE-ANALYZE NETWORK</div>
                        </div>
                        <button 
                            onClick={handleFindMatches}
                            className="bg-ink text-foundation p-3 neo-border hover:bg-accent-green hover:text-ink transition-all active:translate-y-px"
                        >
                            <SparklesIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 md:px-12 py-16 scrollbar-thin scrollbar-thumb-ink/10">
                <div className="container mx-auto max-w-7xl">
                    {matches.length === 0 ? (
                        <div className="bg-white border-2 border-ink p-12 text-center neo-shadow-sm">
                            <LinkIcon className="w-16 h-16 mx-auto opacity-10 mb-6" />
                            <h2 className="text-2xl font-serif-italic font-black uppercase mb-4">No High-Confidence Linkages Found</h2>
                            <p className="text-sm font-bold opacity-40 uppercase tracking-widest max-w-md mx-auto">The heuristic engine has not detected strong alignment between current signals. Re-scan as new demands enter the network.</p>
                        </div>
                    ) : (
                        <div className="space-y-16">
                            {matches.slice(0, visibleMatchesCount).map((match, i) => {
                                const demand = demands.find(d => d.id === match.demandId);
                                const rental = rentals.find(r => r.id === match.rentalId);
                                if (!demand || !rental) return null;

                                return (
                                    <div key={match.demandId + '-' + match.rentalId} className="relative">
                                        {/* Iteration Counter */}
                                        <div className="absolute -left-12 top-0 hidden xl:flex flex-col items-center">
                                            <div className="text-[10px] font-mono font-bold text-ink opacity-20 rotate-90 origin-left translate-y-8 uppercase">STRAT_LINK_0{i+1}</div>
                                            <div className="w-px h-24 bg-ink/10 mt-16" />
                                        </div>
                                        
                                        <MatchCard
                                            match={match}
                                            demand={demand}
                                            rental={rental}
                                            onPostSelect={onPostSelect}
                                            onDemandUpvote={onDemandUpvote}
                                            onDemandSaveToggle={onDemandSaveToggle}
                                            onRentalSaveToggle={onRentalSaveToggle}
                                            isDemandSaved={savedDemandIds?.includes(demand.id)}
                                            isRentalSaved={savedRentalIds?.includes(rental.id)}
                                        />
                                    </div>
                                );
                            })}

                            {matches.length > visibleMatchesCount && (
                                <div className="flex justify-center pt-8 pb-12">
                                    <button
                                        onClick={() => setVisibleMatchesCount(prev => prev + 5)}
                                        className="group relative bg-white border-2 border-ink px-12 py-5 text-sm font-black uppercase tracking-[0.3em] overflow-hidden transition-all hover:bg-ink hover:text-white"
                                    >
                                        <span className="relative z-10 flex items-center gap-4">
                                            <PlusIcon className="w-5 h-5 transition-transform group-hover:rotate-90" />
                                            Load Next Intelligence Set
                                        </span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIMatches;
