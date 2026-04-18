import React, { useMemo, useState, useEffect } from 'react';
import { config } from '../src/config';
import { DemandPost, RentalPost, CommunityPost, MediaItem, User, View } from '../types';
import DemandCard from './DemandCard';
import RentalCard from './RentalCard';
import CommunityPostCard from './CommunityPostCard';

interface FeedProps {
    demandPosts: DemandPost[];
    rentalPosts: RentalPost[];
    communityPosts: CommunityPost[];
    onPostSelect: (post: DemandPost | RentalPost) => void;
    onDemandUpvote: (id: string) => void;
    savedDemandIds: string[];
    onDemandSaveToggle: (id: string) => void;
    savedRentalIds: string[];
    onRentalSaveToggle: (id: string) => void;
    onCommunityLike: (id: string) => void;
    onCommunityRepost: (id: string) => void;
    onCommunityEdit: (id: string, content: string, media: MediaItem[]) => void;
    onCommunityReply: (postId: string, content: string, media: MediaItem[]) => void;
    currentUser: User | null;
    setView: (view: View) => void;
    onNavigateToAIAssistant: () => void;
    isLoading?: boolean;
}

type FeedItem =
    | { type: 'demand'; post: DemandPost; createdAt: Date }
    | { type: 'rental'; post: RentalPost; createdAt: Date }
    | { type: 'community'; post: CommunityPost; createdAt: Date };

// Import icons locally since they are used
import { PlusIcon, HomeIcon, BookmarkIcon, LightBulbIcon, BuildingOfficeIcon, ArrowRightIcon } from './icons';
import Footer from './Footer';

const Feed: React.FC<FeedProps> = ({
    demandPosts, rentalPosts, communityPosts,
    onPostSelect, onDemandUpvote, savedDemandIds, onDemandSaveToggle,
    savedRentalIds, onRentalSaveToggle, onCommunityLike,
    onCommunityRepost, onCommunityReply,
    currentUser, setView, onNavigateToAIAssistant, isLoading,
    onRentalUpvote, userId
}) => {
    const [activeNav, setActiveNav] = useState('home');
    const [trending, setTrending] = useState<{ tag: string; posts: number }[]>([]);
    const [suggestedShops, setSuggestedShops] = useState<{ name: string; category: string }[]>([]);
    const [userStats, setUserStats] = useState({
        demandPosts: 0,
        rentalListings: 0,
        communityContributions: 0,
    });
    const [visibleItemsCount, setVisibleItemsCount] = useState(20);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(`${config.api.baseUrl}/stats/trending`);
                if (response.ok) {
                    const data = await response.json();
                    setTrending(data.trending || []);
                    setSuggestedShops(data.suggestedShops || []);
                }
            } catch (error) {
                console.error('Error fetching trending stats:', error);
            }
        };
        fetchStats();

        if (currentUser?.id) {
            const fetchUserStats = async () => {
                try {
                    const response = await fetch(`${config.api.baseUrl}/stats/user/${currentUser.id}`);
                    if (response.ok) {
                        const data = await response.json();
                        setUserStats(data);
                    }
                } catch (error) {
                    console.error('Error fetching user stats:', error);
                }
            };
            fetchUserStats();
        }
    }, [currentUser]);

    const combinedFeed = useMemo(() => {
        const demands: FeedItem[] = demandPosts.map(p => ({ type: 'demand', post: p, createdAt: new Date(p.createdAt) }));
        const rentals: FeedItem[] = rentalPosts.map(p => ({ type: 'rental', post: p, createdAt: new Date(p.createdAt) }));
        const community: FeedItem[] = communityPosts.map(p => ({ type: 'community', post: p, createdAt: new Date(p.createdAt) }));

        return [...demands, ...rentals, ...community].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }, [demandPosts, rentalPosts, communityPosts]);

    if (isLoading) {
        return (
            <div className="p-8">
                <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="col-span-1 h-96 bg-white border border-ink" />
                        <div className="col-span-2 space-y-8">
                            <div className="h-[400px] bg-white border border-ink" />
                            <div className="h-[400px] bg-white border border-ink" />
                        </div>
                        <div className="col-span-1 h-96 bg-white border border-ink" />
                    </div>
                </div>
            </div>
        );
    }

    if (combinedFeed.length === 0) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="max-w-md w-full bg-white border border-ink neo-shadow-md p-12 text-center">
                    <h2 className="text-4xl font-serif-italic font-bold tracking-tight uppercase leading-none">THE FEED IS SILENT</h2>
                    <p className="mt-4 opacity-70 leading-relaxed font-medium">No signals detected in the network.</p>
                    <button onClick={() => setView(View.POST_DEMAND)} className="neo-button neo-button-primary mt-8">INITIATE DEMAND</button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-foundation flex flex-col">
            <div 
                className="flex-1"
            >
                <div className="max-w-7xl mx-auto px-6 md:px-12 pt-6">
                    <div className="lg:grid lg:grid-cols-4 lg:gap-12 pb-20">
                        {/* LEFT SIDEBAR - User Info & Nav */}
                        <aside className="hidden lg:flex flex-col gap-8 col-span-1 sticky top-28 self-start">
                            {/* Profile Box */}
                            <div className="bg-white border border-ink p-6 neo-shadow-sm hover:neo-shadow-md transition-all">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-16 h-16 neo-border bg-foundation overflow-hidden cursor-pointer"
                                            onClick={() => setView(View.PROFILE)}
                                        >
                                            {currentUser?.profilePicture ? (
                                                <img src={currentUser.profilePicture} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center font-bold text-2xl font-serif-italic italic opacity-20">
                                                    {currentUser?.name?.[0] || 'G'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-serif-italic font-bold truncate uppercase tracking-tight leading-none text-lg">{currentUser?.name || 'Guest User'}</h3>
                                            <p className="text-[10px] font-mono opacity-50 truncate">@{currentUser?.username || 'guest_system'}</p>
                                        </div>
                                    </div>

                                    {currentUser && (
                                        <div className="grid grid-cols-2 gap-px bg-ink border border-ink">
                                            <div className="bg-white p-4">
                                                <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest leading-none mb-2">Score</p>
                                                <p className="text-2xl font-serif-italic font-bold leading-none text-accent-green">{userStats.reputationScore}</p>
                                            </div>
                                            <div className="bg-white p-4">
                                                <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest leading-none mb-2">Active</p>
                                                <p className="text-2xl font-serif-italic font-bold leading-none">{userStats.demandPosts + userStats.rentalListings}</p>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => setView(View.POST_DEMAND)}
                                        className="neo-button neo-button-primary w-full"
                                    >
                                        <PlusIcon className="w-4 h-4 mr-2" />
                                        Emit Signal
                                    </button>
                                </div>
                            </div>

                            {/* Internal Navigation */}
                            <nav className="bg-white border border-ink flex flex-col divide-y divide-ink">
                                <button
                                    onClick={() => setActiveNav('home')}
                                    className={`flex items-center gap-4 px-6 py-4 transition-colors font-bold uppercase tracking-tight text-sm ${activeNav === 'home' ? 'bg-ink text-white' : 'hover:bg-foundation'}`}
                                >
                                    <HomeIcon className="w-5 h-5 font-bold" />
                                    Global Stream
                                </button>
                                <button
                                    onClick={() => setView(View.DEMAND_FEED)}
                                    className={`flex items-center gap-4 px-6 py-4 transition-colors font-bold uppercase tracking-tight text-sm ${activeNav === 'demands' ? 'bg-ink text-white' : 'hover:bg-foundation'}`}
                                >
                                    <LightBulbIcon className="w-5 h-5" />
                                    Demand Only
                                </button>
                                <button
                                    onClick={() => setView(View.RENTAL_LISTINGS)}
                                    className={`flex items-center gap-4 px-6 py-4 transition-colors font-bold uppercase tracking-tight text-sm ${activeNav === 'rentals' ? 'bg-ink text-white' : 'hover:bg-foundation'}`}
                                >
                                    <BuildingOfficeIcon className="w-5 h-5" />
                                    Rental Hub
                                </button>
                                <button
                                    onClick={() => setView(View.SAVED_POSTS)}
                                    className={`flex items-center gap-4 px-6 py-4 transition-colors font-bold uppercase tracking-tight text-sm ${activeNav === 'saved' ? 'bg-ink text-white' : 'hover:bg-foundation'}`}
                                >
                                    <BookmarkIcon className="w-5 h-5" />
                                    Indexed Archive
                                </button>
                            </nav>
                        </aside>

                        {/* CENTER COLUMN - Main Stream (DYNAMIC SCROLL) */}
                        <div
                            className="col-span-1 lg:col-span-2 space-y-8 px-2"
                        >
                            <div className="space-y-8">
                                {combinedFeed.slice(0, visibleItemsCount).map(item => {
                                    switch (item.type) {
                                        case 'demand':
                                            return (
                                                <DemandCard
                                                    key={`demand-${item.post.id}`}
                                                    post={item.post as DemandPost}
                                                    onPostSelect={onPostSelect}
                                                    onUpvote={onDemandUpvote}
                                                    isSaved={savedDemandIds.includes(item.post.id)}
                                                    onSaveToggle={onDemandSaveToggle}
                                                    layout="feed"
                                                    setView={setView}
                                                    userId={userId}
                                                />
                                            );
                                        case 'rental':
                                            return (
                                                <RentalCard
                                                    key={`rental-${item.post.id}`}
                                                    post={item.post as RentalPost}
                                                    onPostSelect={onPostSelect}
                                                    isSaved={savedRentalIds.includes(item.post.id)}
                                                    onSaveToggle={onRentalSaveToggle}
                                                    layout="feed"
                                                    setView={setView}
                                                    userId={userId}
                                                    onUpvote={onRentalUpvote}
                                                />
                                            );
                                        case 'community':
                                            return (
                                                <CommunityPostCard
                                                    key={`community-${item.post.id}`}
                                                    post={item.post as CommunityPost}
                                                    onLike={onCommunityLike}
                                                    onRepost={onCommunityRepost}
                                                    onEdit={() => { }}
                                                    onReply={onCommunityReply}
                                                    onVideoReply={() => { }}
                                                    currentUser={currentUser}
                                                    setView={setView}
                                                />
                                            );
                                    }
                                    return null;
                                })}

                                {combinedFeed.length > visibleItemsCount && (
                                    <button
                                        onClick={() => setVisibleItemsCount(prev => prev + 20)}
                                        className="neo-button w-full py-6 text-lg font-bold mt-8"
                                    >
                                        LOAD MORE SIGNALS ({combinedFeed.length - visibleItemsCount} REMAINING)
                                    </button>
                                )}

                                <div className="mt-20 border-t border-ink pt-12">
                                    <Footer setView={setView} onNavigateToAIAssistant={onNavigateToAIAssistant} />
                                </div>
                            </div>
                        </div>

                        {/* RIGHT SIDEBAR - Trending & Suggested */}
                        <aside className="hidden lg:flex flex-col gap-8 col-span-1 sticky top-28 self-start">
                            {/* Trending Box */}
                            <div className="bg-white border border-ink p-6 neo-shadow-sm hover:neo-shadow-md transition-all">
                                <h4 className="text-[10px] font-mono tracking-[0.3em] uppercase opacity-50 mb-6 font-bold">Market Intelligence</h4>
                                <div className="divide-y divide-ink/10 border-t border-ink/10">
                                    {trending.map((item, index) => (
                                        <div key={index} className="py-4 group cursor-pointer hover:bg-foundation/30 transition-colors -mx-6 px-6">
                                            <p className="text-sm font-bold uppercase tracking-tight group-hover:text-accent-blue transition-colors">{item.tag}</p>
                                            <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest mt-1">{item.posts.toLocaleString()} DATA POINTS</p>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full mt-6 text-[10px] font-mono tracking-widest uppercase opacity-40 hover:opacity-100 hover:text-accent-blue flex items-center justify-between transition-all pt-6 border-t border-ink">
                                    Expand Index
                                    <ArrowRightIcon className="w-3 h-3" />
                                </button>
                            </div>

                            {/* Suggestions */}
                            <div className="bg-white border border-ink p-6 neo-shadow-sm hover:neo-shadow-md transition-all">
                                <h4 className="text-[10px] font-mono tracking-[0.3em] uppercase opacity-50 mb-6 font-bold">Suggested Nodes</h4>
                                <div className="divide-y divide-ink/10 border-t border-ink/10">
                                    {suggestedShops.slice(0, 3).map((shop, index) => (
                                        <div key={index} className="py-4 flex items-center justify-between">
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold uppercase tracking-tight truncate leading-none mb-1">{shop.name}</p>
                                                <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest">{shop.category}</p>
                                            </div>
                                            <button className="text-[10px] font-bold font-mono tracking-widest uppercase border border-ink px-2 py-1 hover:bg-ink hover:text-white transition-all">
                                                Track
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(Feed);