import React, { useMemo, useState, useRef, useEffect } from 'react';
import { DemandPost, RentalPost, CommunityPost, MediaItem, User, View } from '../types';
import DemandCard from './DemandCard';
import RentalCard from './RentalCard';
import CommunityPostCard from './CommunityPostCard';
import { EmptyState } from './LandingPages';
import { XIcon, PlusIcon, ImageIcon, VideoCameraIcon, HomeIcon, UserCircleIcon, BookmarkIcon, LightBulbIcon, BuildingOfficeIcon } from './icons';

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
}

type FeedItem =
    | { type: 'demand'; post: DemandPost; createdAt: Date }
    | { type: 'rental'; post: RentalPost; createdAt: Date }
    | { type: 'community'; post: CommunityPost; createdAt: Date };

const CHARACTER_LIMIT = 280;

// Mock Data for Sidebars
const MOCK_TRENDING = [
    { tag: '#BridgeHead', posts: 3241 },
    { tag: '#LocalDeals', posts: 1856 },
    { tag: '#MumbaiStartups', posts: 1124 },
    { tag: '#CommunityFirst', posts: 892 },
];

const MOCK_SUGGESTED_SHOPS = [
    { name: 'Urban Coffee House', category: 'Food & Beverages' },
    { name: 'TechHub Coworking', category: 'Workspace' },
    { name: 'EcoMart Groceries', category: 'Retail' },
];

// EditPostForm is copied from CommunityFeed to allow editing directly from the main feed
const EditPostForm: React.FC<{
    post: CommunityPost;
    onSave: (id: string, content: string, media: MediaItem[]) => void;
    onCancel: () => void;
}> = ({ post, onSave, onCancel }) => {
    const [content, setContent] = useState(post.content);
    const [media, setMedia] = useState<MediaItem[]>(post.media || []);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const [mediaOptionsOpen, setMediaOptionsOpen] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        Array.from(files).forEach((file: File) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const url = e.target?.result as string;
                const type = file.type.startsWith('image/') ? 'image' : 'video';
                if (type === 'image' || type === 'video') {
                    setMedia(prev => [...prev, { type, url }]);
                }
            };
            reader.readAsDataURL(file);
        });
        if (imageInputRef.current) imageInputRef.current.value = "";
        if (videoInputRef.current) videoInputRef.current.value = "";
        setMediaOptionsOpen(false);
    };

    const removeMedia = (index: number) => {
        setMedia(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if ((content.trim() || media.length > 0) && content.length <= CHARACTER_LIMIT) {
            onSave(post.id, content, media);
        }
    };

    const remainingChars = CHARACTER_LIMIT - content.length;

    return (
        <div className="bg-[--card-color] border border-[--border-color] rounded-xl p-4">
            <form onSubmit={handleSave}>
                <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="What's on your mind?"
                    className="w-full bg-transparent text-lg text-[--text-primary] placeholder-[--text-secondary] focus:outline-none resize-none"
                    rows={3}
                    autoFocus
                />

                {media.length > 0 && (
                    <div className="mt-4 grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                        {media.map((item, index) => (
                            <div key={index} className="relative aspect-square">
                                {item.type === 'image' ? (
                                    <img src={item.url} alt={`Preview ${index}`} className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    <div className="w-full h-full relative">
                                        <video src={item.url} className="w-full h-full object-cover rounded-lg" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30"><VideoCameraIcon className="w-8 h-8 text-white" /></div>
                                    </div>
                                )}
                                <button type="button" onClick={() => removeMedia(index)} className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white z-10"><XIcon className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-between mt-2">
                    <div className="relative">
                        <input type="file" ref={imageInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
                        <input type="file" ref={videoInputRef} onChange={handleFileChange} accept="video/*" multiple className="hidden" />
                        <button type="button" onClick={() => setMediaOptionsOpen(!mediaOptionsOpen)} className="text-[--primary-color] p-2 rounded-full hover:bg-[--primary-color]/10 transition-colors" title="Add Photo or Video"><PlusIcon className="w-6 h-6" /></button>
                        {mediaOptionsOpen && (
                            <div className="absolute bottom-full left-0 mb-2 w-40 bg-[--card-color] border border-[--border-color] rounded-lg shadow-lg z-10" onMouseLeave={() => setMediaOptionsOpen(false)}>
                                <button type="button" onClick={() => imageInputRef.current?.click()} className="w-full flex items-center gap-3 px-4 py-2 text-left text-[--text-secondary] hover:bg-white/10 hover:text-white"><ImageIcon className="w-5 h-5" /><span>Photo</span></button>
                                <button type="button" onClick={() => videoInputRef.current?.click()} className="w-full flex items-center gap-3 px-4 py-2 text-left text-[--text-secondary] hover:bg-white/10 hover:text-white"><VideoCameraIcon className="w-5 h-5" /><span>Video</span></button>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className={`text-sm ${remainingChars < 0 ? 'text-red-500' : 'text-[--text-secondary]'}`}>{remainingChars}</span>
                        <button type="button" onClick={onCancel} className="px-5 py-2 rounded-full text-sm font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors">Cancel</button>
                        <button type="submit" disabled={(!content.trim() && media.length === 0) || remainingChars < 0} className="px-5 py-2 rounded-full text-sm font-semibold bg-[--primary-color] text-white hover:opacity-90 transition-opacity disabled:opacity-50">Save</button>
                    </div>
                </div>
            </form>
        </div>
    );
};

const Feed: React.FC<FeedProps> = ({
    demandPosts, rentalPosts, communityPosts,
    onPostSelect, onDemandUpvote, savedDemandIds, onDemandSaveToggle,
    savedRentalIds, onRentalSaveToggle, onCommunityLike,
    onCommunityRepost, onCommunityEdit, onCommunityReply,
    currentUser, setView
}) => {
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [activeNav, setActiveNav] = useState('home');
    const [trending, setTrending] = useState(MOCK_TRENDING);
    const [suggestedShops, setSuggestedShops] = useState(MOCK_SUGGESTED_SHOPS);
    const [userStats, setUserStats] = useState({
        demandPosts: 0,
        rentalListings: 0,
        communityContributions: 0,
        reputationScore: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('http://localhost:5001/api/stats/trending');
                if (response.ok) {
                    const data = await response.json();
                    setTrending(data.trending);
                    setSuggestedShops(data.suggestedShops);
                }
            } catch (error) {
                console.error('Error fetching trending stats:', error);
            }
        };
        fetchStats();

        if (currentUser?.id) {
            const fetchUserStats = async () => {
                try {
                    const response = await fetch(`http://localhost:5001/api/stats/user/${currentUser.id}`);
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

    const handleSaveEdit = (id: string, content: string, media: MediaItem[]) => {
        onCommunityEdit(id, content, media);
        setEditingPostId(null);
    };

    const handleVideoReply = (postId: string, mediaItem: MediaItem) => {
        const originalPost = communityPosts.find(p => p.id === postId);
        if (originalPost) {
            const replyContent = `Replying to ${originalPost.username}`;
            onCommunityReply(postId, replyContent, [mediaItem]);
        }
    };

    if (combinedFeed.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <EmptyState
                    title="The Feed is Quiet"
                    message="No new demands, rentals, or community posts yet. Be the first to start something!"
                />
            </div>
        );
    }

    const [scrollProgress, setScrollProgress] = useState(0);

    const handleScroll = (e: React.UIEvent<HTMLElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const windowHeight = scrollHeight - clientHeight;
        if (windowHeight > 0) {
            const progress = (scrollTop / windowHeight) * 100;
            setScrollProgress(progress);
        }
    };

    return (
        <div className="h-screen bg-[#000000] overflow-hidden flex flex-col pt-16 relative">
            {/* Reading Progress Bar (Slidebar) */}
            <div
                className="fixed top-0 right-0 z-50 w-[2px] md:w-[4px] bg-[#FF0000] transition-all duration-150 ease-out shadow-[0_0_10px_rgba(255,0,0,0.5)]"
                style={{ height: `${scrollProgress}%` }}
            />

            {/* 3-Column Holy Grail Layout: Mobile (1-col) | Desktop (3-col grid) */}
            <div className="max-w-7xl mx-auto w-full lg:grid lg:grid-cols-4 lg:gap-6 lg:px-4 h-full">

                {/* LEFT SIDEBAR - 25% (col-span-1) - Hidden on Mobile */}
                <aside className="hidden lg:block lg:col-span-1 h-full overflow-y-auto hide-scrollbar py-6 space-y-6">
                    {/* Mini Profile Card */}
                    <div className="bg-[#121212] rounded-xl p-6 border border-white/10 shadow-[0_4px_20px_rgba(255,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(255,0,0,0.12)] transition-all duration-300">
                        <div className="flex flex-col items-center text-center">
                            {currentUser?.profilePicture ? (
                                <img
                                    src={currentUser.profilePicture}
                                    alt={currentUser.name}
                                    className="w-16 h-16 rounded-full object-cover mb-3 border-2 border-[#FF0000]/30"
                                />
                            ) : (
                                <UserCircleIcon className="w-16 h-16 text-white/70 mb-3" />
                            )}
                            <h3 className="font-bold text-white text-base mb-1">
                                {currentUser?.name || 'Guest User'}
                            </h3>
                            <p className="text-xs text-white/50 mb-4">
                                @{currentUser?.name?.toLowerCase().replace(' ', '_') || 'guest'}
                            </p>

                            {/* User Stats Display */}
                            {currentUser && (
                                <div className="grid grid-cols-3 gap-2 w-full mb-4 text-center">
                                    <div className="bg-white/5 rounded-lg p-2">
                                        <p className="text-xs text-white/50">Score</p>
                                        <p className="font-bold text-[#FF0000] text-sm">{userStats.reputationScore}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-2">
                                        <p className="text-xs text-white/50">Needs</p>
                                        <p className="font-bold text-white text-sm">{userStats.demandPosts}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-2">
                                        <p className="text-xs text-white/50">Rentals</p>
                                        <p className="font-bold text-white text-sm">{userStats.rentalListings}</p>
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={() => setView(View.POST_DEMAND)}
                                className="w-full py-2 px-4 bg-[#FF0000] text-white rounded-full font-semibold hover:bg-[#FF0000]/90 transition-all"
                            >
                                Post
                            </button>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="bg-[#121212] rounded-xl p-4 border border-white/10 shadow-[0_4px_20px_rgba(255,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(255,0,0,0.12)] transition-all duration-300">
                        <nav className="space-y-1">
                            <button
                                onClick={() => { setActiveNav('home'); setView(View.FEED); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${activeNav === 'home' ? 'bg-[#FF0000]/20 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <HomeIcon className="w-5 h-5" />
                                <span className="font-semibold">Home</span>
                            </button>
                            <button
                                onClick={() => { setActiveNav('demands'); setView(View.DEMAND_FEED); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${activeNav === 'demands' ? 'bg-[#FF0000]/20 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <LightBulbIcon className="w-5 h-5" />
                                <span className="font-semibold">Explore</span>
                            </button>
                            <button
                                onClick={() => { setActiveNav('notifications'); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${activeNav === 'notifications' ? 'bg-[#FF0000]/20 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <BuildingOfficeIcon className="w-5 h-5" />
                                <span className="font-semibold">Notifications</span>
                            </button>
                            <button
                                onClick={() => { setActiveNav('saved'); setView(View.SAVED_POSTS); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${activeNav === 'saved' ? 'bg-[#FF0000]/20 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <BookmarkIcon className="w-5 h-5" />
                                <span className="font-semibold">Saved</span>
                            </button>
                        </nav>
                    </div>
                </aside>

                {/* CENTER COLUMN - 50% (col-span-2) - Full Width on Mobile */}
                <main
                    className="col-span-1 lg:col-span-2 h-full overflow-y-auto hide-scrollbar px-4 lg:px-0 py-6"
                    onScroll={handleScroll}
                >
                    <div className="space-y-6 pb-20 lg:pb-0">
                        <h1 className="text-3xl font-bold text-white text-center lg:text-left">Latest Activity</h1>
                        {combinedFeed.map(item => {
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
                                        />
                                    );
                                case 'community':
                                    const post = item.post as CommunityPost;
                                    return editingPostId === post.id ? (
                                        <EditPostForm
                                            key={`edit-${post.id}`}
                                            post={post}
                                            onSave={handleSaveEdit}
                                            onCancel={() => setEditingPostId(null)}
                                        />
                                    ) : (
                                        <CommunityPostCard
                                            key={`community-${post.id}`}
                                            post={post}
                                            onLike={onCommunityLike}
                                            onRepost={onCommunityRepost}
                                            onEdit={setEditingPostId}
                                            onReply={onCommunityReply}
                                            onVideoReply={handleVideoReply}
                                            currentUser={currentUser}
                                            setView={setView}
                                        />
                                    );
                            }
                            return null;
                        })}
                    </div>
                </main>

                {/* RIGHT SIDEBAR - 25% (col-span-1) - Hidden on Mobile */}
                <aside className="hidden lg:block lg:col-span-1 h-full overflow-y-auto hide-scrollbar py-6 space-y-6 pr-2">
                    {/* Trending Section */}
                    <div className="bg-[#121212] rounded-xl p-5 border border-white/10 shadow-[0_4px_20px_rgba(255,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(255,0,0,0.12)] transition-all duration-300">
                        <h4 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#FF0000]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            Trending Now
                        </h4>
                        <div className="space-y-3">
                            {trending.map((item, index) => (
                                <button
                                    key={index}
                                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all group"
                                >
                                    <p className="font-semibold text-white text-sm group-hover:text-[#FF0000] transition-colors">
                                        {item.tag}
                                    </p>
                                    <p className="text-xs text-white/50 mt-0.5">{item.posts.toLocaleString()} posts</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Suggested Shops */}
                    <div className="bg-[#121212] rounded-xl p-5 border border-white/10 shadow-[0_4px_20px_rgba(255,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(255,0,0,0.12)] transition-all duration-300">
                        <h4 className="font-bold text-white text-sm mb-4">Suggested Shops</h4>
                        <div className="space-y-3">
                            {suggestedShops.map((shop, index) => (
                                <div
                                    key={index}
                                    className="flex items-start justify-between px-2 py-2 rounded-lg hover:bg-white/5 transition-all"
                                >
                                    <div className="flex-1">
                                        <p className="font-semibold text-white text-sm mb-0.5">{shop.name}</p>
                                        <p className="text-xs text-white/50">{shop.category}</p>
                                    </div>
                                    <button className="ml-2 px-3 py-1 text-xs font-semibold rounded-full bg-[#FF0000]/10 text-[#FF0000] hover:bg-[#FF0000] hover:text-white transition-all">
                                        Follow
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-4 text-sm text-[#FF0000] hover:text-white font-semibold transition-colors">
                            Show more →
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Feed;