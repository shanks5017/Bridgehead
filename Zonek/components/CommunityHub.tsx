import React, { useState, useRef, useMemo } from 'react';
import { CommunityPost, MediaItem, User, View } from '../types';
import { 
    UserCircleIcon, 
    XIcon, 
    PlusIcon, 
    ImageIcon, 
    VideoCameraIcon, 
    ChatBubbleLeftIcon, 
    FireIcon, 
    TrophyIcon,
    ArrowRightIcon,
    HeartIcon
} from './icons';
import CommunityPostCard from './CommunityPostCard';
import Footer from './Footer';

interface CommunityHubProps {
    posts: CommunityPost[];
    addPost: (content: string, media: MediaItem[]) => void;
    onLike: (id: string) => void;
    onRepost: (id: string) => void;
    onEditPost: (id: string, content: string, media: MediaItem[]) => void;
    onReply: (postId: string, content: string, media: MediaItem[]) => void;
    currentUser: User | null;
    setView: (view: View) => void;
    onNavigateToAIAssistant: () => void;
}

// ============================================================================
// CONSTANTS & MOCK DATA (Scalable separation)
// ============================================================================

const CHARACTER_LIMIT = 280;

const TRIBES = [
    { id: 'all', name: 'Global Stream', icon: '💬', count: 205 },
    { id: 'startups', name: 'Venture Capital', icon: '🚀', count: 42 },
    { id: 'events', name: 'Local Logistics', icon: '📅', count: 28 },
    { id: 'help', name: 'SOS Protocol', icon: '🆘', count: 15 },
    { id: 'showcase', name: 'Project Alpha', icon: '✨', count: 31 },
    { id: 'general', name: 'Market Intel', icon: '🎯', count: 89 },
];

const MOCK_LEADERBOARD = [
    { id: '1', name: 'Alex Johnson', avatar: 'user1', contributions: 156, rank: 1 },
    { id: '2', name: 'Sarah Chen', avatar: 'user2', contributions: 142, rank: 2 },
    { id: '3', name: 'Mike Ross', avatar: 'user3', contributions: 128, rank: 3 },
];

const TRENDING_TOPICS = [
    { id: 't1', title: 'NEO-BRUTALIST ARCHITECTURE IN RETAIL', replies: 42 },
    { id: 't2', title: 'SUPPLY CHAIN OPTIMIZATION 2024', replies: 31 },
    { id: 't3', title: 'COMMUNITY-LED GROWTH STRATEGIES', replies: 19 },
];

// ============================================================================
// SUB-COMPONENTS (Premium Neo-Brutalist)
// ============================================================================

const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
    <div className="mb-12">
        <h1 className="text-6xl md:text-8xl font-serif-italic font-bold uppercase tracking-tighter leading-none mb-4">
            {title}
        </h1>
        {subtitle && (
            <p className="text-xl font-mono uppercase tracking-widest opacity-40">
                {subtitle}
            </p>
        )}
    </div>
);

const TribeNav: React.FC<{ 
    activeTribe: string; 
    onTribeSelect: (id: string) => void 
}> = ({ activeTribe, onTribeSelect }) => (
    <div className="space-y-4">
        <h4 className="text-[10px] font-mono tracking-[0.3em] uppercase opacity-40 mb-6 font-bold">The Tribes</h4>
        <div className="bg-white border border-ink neo-shadow-sm divide-y divide-ink">
            {TRIBES.map((tribe) => {
                const isActive = activeTribe === tribe.id;
                return (
                    <button
                        key={tribe.id}
                        onClick={() => onTribeSelect(tribe.id)}
                        className={`w-full flex items-center justify-between px-6 py-4 transition-all group ${
                            isActive ? 'bg-ink text-white' : 'bg-white hover:bg-foundation'
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            <span className="text-xl group-hover:scale-110 transition-transform">{tribe.icon}</span>
                            <span className="font-bold uppercase tracking-tight text-sm">{tribe.name}</span>
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-1 border ${
                            isActive ? 'border-white/30 text-white/60' : 'border-ink/10 opacity-40'
                        }`}>
                            {tribe.count}
                        </span>
                    </button>
                );
            })}
        </div>
    </div>
);

const HallOfFame: React.FC = () => (
    <div className="space-y-6">
        <h4 className="text-[10px] font-mono tracking-[0.3em] uppercase opacity-40 mb-6 font-bold">Hall of Fame</h4>
        <div className="space-y-4">
            {MOCK_LEADERBOARD.map((leader) => (
                <div 
                    key={leader.id} 
                    className="bg-white border border-ink p-4 flex items-center gap-4 hover:neo-shadow-sm transition-all cursor-pointer"
                >
                    <div className={`w-10 h-10 border border-ink flex items-center justify-center font-bold text-xl ${
                        leader.rank === 1 ? 'bg-yellow-400' : 
                        leader.rank === 2 ? 'bg-slate-300' : 
                        'bg-orange-300'
                    }`}>
                        {leader.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-serif-italic font-bold uppercase truncate leading-none mb-1">{leader.name}</p>
                        <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest">{leader.contributions} CONTRIBUTIONS</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const CreatePostBox: React.FC<{
    currentUser: User;
    onSubmit: (content: string, media: MediaItem[]) => void;
}> = ({ currentUser, onSubmit }) => {
    const [content, setContent] = useState('');
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [isFocused, setIsFocused] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (content.trim() || media.length > 0) {
            onSubmit(content, media);
            setContent('');
            setMedia([]);
            setIsFocused(false);
        }
    };

    return (
        <div className={`bg-white border-2 border-ink p-8 transition-all mb-12 ${isFocused ? 'neo-shadow-md' : 'neo-shadow-sm hover:neo-shadow-md'}`}>
            <form onSubmit={handleSubmit}>
                <div className="flex gap-6">
                    <div className="w-16 h-16 border-2 border-ink bg-foundation overflow-hidden shrink-0">
                        {currentUser.profilePicture ? (
                            <img src={currentUser.profilePicture} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-2xl font-serif-italic italic opacity-20">
                                {currentUser.name?.[0] || 'G'}
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            placeholder="INITIALIZE DISCUSSION... WHAT IS THE CURRENT SIGNAL?"
                            className="w-full bg-transparent text-xl font-bold uppercase placeholder:opacity-20 focus:outline-none resize-none min-h-[80px]"
                            rows={3}
                        />
                    </div>
                </div>
                
                <div className="mt-8 pt-8 border-t-2 border-foundation flex items-center justify-between">
                    <div className="flex gap-4">
                        <button type="button" onClick={() => imageInputRef.current?.click()} className="p-3 border border-ink hover:bg-foundation transition-all"><ImageIcon className="w-5 h-5" /></button>
                        <button type="button" onClick={() => videoInputRef.current?.click()} className="p-3 border border-ink hover:bg-foundation transition-all"><VideoCameraIcon className="w-5 h-5" /></button>
                        <input type="file" ref={imageInputRef} hidden accept="image/*" multiple />
                        <input type="file" ref={videoInputRef} hidden accept="video/*" multiple />
                    </div>
                    <button 
                        type="submit" 
                        disabled={!content.trim()}
                        className="neo-button neo-button-primary px-12 py-3"
                    >
                        POST SIGNAL
                    </button>
                </div>
            </form>
        </div>
    );
};

const AuthGate: React.FC<{ setView: (view: View) => void }> = ({ setView }) => (
    <div className="bg-white border-2 border-ink p-12 text-center mb-12 neo-shadow-sm">
        <h3 className="text-3xl font-serif-italic font-bold uppercase mb-4 italic">AUTHENTICATION REQUIRED</h3>
        <p className="font-mono text-sm opacity-50 uppercase tracking-widest mb-8">IDENTITY VERIFICATION NEEDED TO PROTOCOL DISCUSSIONS</p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button onClick={() => setView(View.SIGN_IN)} className="neo-button px-12">DECRYPT SESSION (SIGN IN)</button>
            <button onClick={() => setView(View.SIGN_UP)} className="neo-button neo-button-primary px-12">CREATE IDENTITY (SIGN UP)</button>
        </div>
    </div>
);

// ============================================================================
// MAIN COMMUNITY HUB
// ============================================================================

const CommunityHub: React.FC<CommunityHubProps> = ({
    posts,
    addPost,
    onLike,
    onRepost,
    onEditPost,
    onReply,
    currentUser,
    setView,
    onNavigateToAIAssistant
}) => {
    const [activeTribe, setActiveTribe] = useState('all');

    const filteredPosts = useMemo(() => {
        // Future: Filter by tribe
        return [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [posts, activeTribe]);

    return (
        <div className="bg-foundation min-h-screen">
            <div className="max-w-7xl mx-auto px-6 md:px-12 pt-12 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* LEFT SIDEBAR - Community Navigation (Sticky) */}
                    <aside className="hidden lg:block col-span-1 space-y-8 sticky top-24 self-start">
                        <TribeNav activeTribe={activeTribe} onTribeSelect={setActiveTribe} />
                        <HallOfFame />
                    </aside>

                    {/* CENTER FEED - Main Stream (Dynamic) */}
                    <main className="col-span-1 lg:col-span-2 space-y-8 px-2">
                        {currentUser ? (
                            <CreatePostBox currentUser={currentUser} onSubmit={addPost} />
                        ) : (
                            <AuthGate setView={setView} />
                        )}

                        <div className="space-y-8 pb-32">
                            {filteredPosts.length === 0 ? (
                                <div className="bg-white border border-ink p-16 text-center neo-shadow-sm italic font-serif-italic text-2xl opacity-40 uppercase">
                                    THE STREAM IS SILENT
                                </div>
                            ) : (
                                filteredPosts.map(post => (
                                    <CommunityPostCard
                                        key={post.id}
                                        post={post}
                                        onLike={onLike}
                                        onRepost={onRepost}
                                        onEdit={() => onEditPost(post.id, post.content, post.media || [])}
                                        onReply={(postId, content, media) => onReply(postId, content, media)}
                                        onVideoReply={() => {}}
                                        currentUser={currentUser}
                                        setView={setView}
                                    />
                                ))
                            )}
                            
                            <button className="neo-button w-full py-6 text-xl font-bold bg-white hover:bg-ink hover:text-white transition-all">
                                LOAD PREVIOUS SIGNALS
                            </button>
                        </div>
                    </main>

                    {/* RIGHT SIDEBAR - Contextual Intel (Sticky) */}
                    <aside className="hidden lg:block col-span-1 space-y-8 sticky top-24 self-start">
                        <div className="bg-white border border-ink p-8 neo-shadow-sm">
                            <h4 className="text-[10px] font-mono tracking-[0.3em] uppercase opacity-40 mb-8 font-bold">Trending Intelligence</h4>
                            <div className="space-y-8">
                                {TRENDING_TOPICS.map((topic) => (
                                    <div key={topic.id} className="group cursor-pointer">
                                        <p className="text-xs font-mono opacity-30 mb-2">#INTEL_CORE</p>
                                        <h5 className="font-bold uppercase tracking-tight group-hover:text-accent-green transition-colors leading-tight">
                                            {topic.title}
                                        </h5>
                                        <div className="mt-4 flex items-center justify-between text-[10px] font-mono opacity-40">
                                            <span>{topic.replies} RESPONSES</span>
                                            <ArrowRightIcon className="w-3 h-3 group-hover:translate-x-2 transition-transform" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-accent-green border border-ink p-8 neo-shadow-sm group cursor-pointer hover:neo-shadow-md transition-all">
                            <FireIcon className="w-8 h-8 mb-6" />
                            <h3 className="text-2xl font-serif-italic font-bold uppercase leading-tight mb-4">WANT TO SCALE YOUR PROJECT?</h3>
                            <p className="text-xs font-mono uppercase tracking-widest mb-6 opacity-80 font-bold">INITIATE COLLABORATION PROTOCOL NOW</p>
                            <button className="w-full bg-ink text-white font-bold py-3 uppercase tracking-widest text-[10px] hover:invert transition-all">
                                START SYSTEM
                            </button>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default React.memo(CommunityHub);
