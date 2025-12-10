
import React, { useState } from 'react';
import { DemandPost, RentalPost, MatchResult, View } from '../types';
import { findMatches } from '../services/geminiService';
import { LoadingState, EmptyState } from './LandingPages';
import DemandCard from './DemandCard';
import RentalCard from './RentalCard';
import { LinkIcon, PlusIcon, SparklesIcon } from './icons';

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
    isDemandSaved: boolean;
    isRentalSaved: boolean;
}> = ({ match, demand, rental, onPostSelect, onDemandUpvote, onDemandSaveToggle, onRentalSaveToggle, isDemandSaved, isRentalSaved }) => {
    return (
        <div className="bg-[--card-color] border border-[--border-color] rounded-xl p-6">
            <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="w-full lg:w-80 flex-shrink-0">
                    <DemandCard post={demand} onPostSelect={onPostSelect} onUpvote={onDemandUpvote} isSaved={isDemandSaved} onSaveToggle={onDemandSaveToggle} />
                </div>
                <div className="text-white text-4xl font-bold p-4 rounded-full bg-[--primary-color]">
                    <PlusIcon className="w-8 h-8"/>
                </div>
                <div className="w-full lg:w-80 flex-shrink-0">
                    <RentalCard post={rental} onPostSelect={onPostSelect} isSaved={isRentalSaved} onSaveToggle={onRentalSaveToggle} />
                </div>
            </div>
            <div className="mt-6 border-t border-[--border-color] pt-6">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-yellow-400"/> AI Analysis</h3>
                    <div className="text-right">
                        <div className="font-bold text-lg">{(match.confidenceScore * 100).toFixed(0)}%</div>
                        <div className="text-xs text-[--text-secondary]">Confidence</div>
                    </div>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2.5 mb-4">
                    <div className="bg-[--primary-color] h-2.5 rounded-full" style={{ width: `${match.confidenceScore * 100}%` }}></div>
                </div>
                <p className="text-[--text-secondary]">{match.reasoning}</p>
            </div>
        </div>
    );
}


const AIMatches: React.FC<AIMatchesProps> = ({ demands, rentals, onPostSelect, onDemandUpvote, onDemandSaveToggle, onRentalSaveToggle, savedDemandIds, savedRentalIds }) => {
    const [matches, setMatches] = useState<MatchResult[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

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
             <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center px-4">
                <LinkIcon className="w-16 h-16 mx-auto text-[--primary-color] mb-4" />
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter mb-4">AI Opportunity Matchmaker</h1>
                <p className="text-lg text-[--text-secondary] max-w-2xl mx-auto mb-8">
                    Discover which available properties are the best fit for community demands. Let our AI connect the dots for you.
                </p>
                <button
                    onClick={handleFindMatches}
                    className="px-8 py-4 rounded-lg text-lg font-semibold bg-[--primary-color] text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-3 mx-auto"
                >
                    <SparklesIcon className="w-6 h-6" />
                    Find Matches Now
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12">
            <div className="container mx-auto max-w-5xl px-4">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold">AI Match Results</h1>
                    <p className="text-[--text-secondary] mt-2">Here are the top matches between community needs and available properties.</p>
                </div>

                {matches.length === 0 ? (
                    <EmptyState title="No Strong Matches Found" message="The AI couldn't find any high-confidence matches right now. Check back when more demands or rentals are added!" />
                ) : (
                    <div className="space-y-8">
                        {matches.map(match => {
                            const demand = demands.find(d => d.id === match.demandId);
                            const rental = rentals.find(r => r.id === match.rentalId);
                            if (!demand || !rental) return null;

                            return <MatchCard 
                                key={`${match.demandId}-${match.rentalId}`}
                                match={match}
                                demand={demand}
                                rental={rental}
                                onPostSelect={onPostSelect}
                                onDemandUpvote={onDemandUpvote}
                                onDemandSaveToggle={onDemandSaveToggle}
                                onRentalSaveToggle={onRentalSaveToggle}
                                isDemandSaved={savedDemandIds.includes(demand.id)}
                                isRentalSaved={savedRentalIds.includes(rental.id)}
                            />
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIMatches;
