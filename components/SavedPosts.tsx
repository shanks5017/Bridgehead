
import React from 'react';
import { DemandPost, RentalPost } from '../types';
import DemandCard from './DemandCard';
import RentalCard from './RentalCard';
import { EmptyState } from './LandingPages';

interface SavedPostsProps {
    demandPosts: DemandPost[];
    rentalPosts: RentalPost[];
    savedDemandIds: string[];
    savedRentalIds: string[];
    onDemandSaveToggle: (id: string) => void;
    onRentalSaveToggle: (id: string) => void;
    onDemandUpvote: (id: string) => void;
    onPostSelect: (post: DemandPost | RentalPost) => void;
}

const SavedPosts: React.FC<SavedPostsProps> = ({ 
    demandPosts,
    rentalPosts,
    savedDemandIds,
    savedRentalIds,
    onDemandSaveToggle,
    onRentalSaveToggle,
    onDemandUpvote,
    onPostSelect
}) => {
    const savedDemands = demandPosts.filter(p => savedDemandIds.includes(p.id));
    const savedRentals = rentalPosts.filter(p => savedRentalIds.includes(p.id));

    if (savedDemands.length === 0 && savedRentals.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <EmptyState 
                    title="No Saved Items Yet" 
                    message="Click the bookmark icon on any demand or rental listing to save it here." 
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold mb-8">Saved Items</h1>
                
                {savedDemands.length > 0 && (
                    <section className="mb-12">
                        <h2 className="text-3xl font-bold mb-4">Saved Demands</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {savedDemands.map(post => (
                                <DemandCard 
                                    key={post.id} 
                                    post={post} 
                                    onPostSelect={onPostSelect} 
                                    onUpvote={onDemandUpvote} 
                                    isSaved={savedDemandIds.includes(post.id)}
                                    onSaveToggle={onDemandSaveToggle}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {savedRentals.length > 0 && (
                    <section>
                        <h2 className="text-3xl font-bold mb-4">Saved Rentals</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {savedRentals.map(post => (
                                <RentalCard 
                                    key={post.id} 
                                    post={post} 
                                    onPostSelect={onPostSelect} 
                                    isSaved={savedRentalIds.includes(post.id)}
                                    onSaveToggle={onRentalSaveToggle}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
};

export default SavedPosts;
