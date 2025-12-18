import React, { useState, useRef } from 'react';
import { CommunityPost, MediaItem, User, View } from '../types';
import { UserCircleIcon, XIcon, PlusIcon, ImageIcon, VideoCameraIcon, ChatBubbleLeftIcon, FireIcon, TrophyIcon } from './icons';

interface CommunityHubProps {
    posts: CommunityPost[];
    addPost: (content: string, media: MediaItem[]) => void;
    onLike: (id: string) => void;
    onRepost: (id: string) => void;
    onEditPost: (id: string, content: string, media: MediaItem[]) => void;
    onReply: (postId: string, content: string, media: MediaItem[]) => void;
    currentUser: User | null;
    setView: (view: View) => void;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_TOPICS = [
    { id: 'all', name: 'All Topics', icon: '💬', count: 205 },
    { id: 'startups', name: 'Startups', icon: '🚀', count: 42 },
    { id: 'events', name: 'Local Events', icon: '📅', count: 28 },
    { id: 'help', name: 'Help & Support', icon: '🆘', count: 15 },
    { id: 'showcase', name: 'Showcase', icon: '✨', count: 31 },
    { id: 'general', name: 'General', icon: '🎯', count: 89 },
];

const MOCK_LEADERBOARD = [
    { id: '1', name: 'Alex Johnson', avatar: 'user1', contributions: 156, rank: 1 },
    { id: '2', name: 'Sarah Chen', avatar: 'user2', contributions: 142, rank: 2 },
    { id: '3', name: 'Mike Ross', avatar: 'user3', contributions: 128, rank: 3 },
    { id: '4', name: 'Emma Davis', avatar: 'user4', contributions: 98, rank: 4 },
    { id: '5', name: 'James Wilson', avatar: 'user5', contributions: 87, rank: 5 },
];

const CHARACTER_LIMIT = 280;

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

const SignInToPost: React.FC<{ setView: (view: View) => void }> = ({ setView }) => (
    <div className="bg-[#121212] border border-[#333333] rounded-xl p-6 mb-6 text-center">
        <p className="text-lg font-semibold text-white mb-2">Join the conversation!</p>
        <p className="text-[#A0A0A0] mb-4">Sign in or create an account to start discussions.</p>
        <div className="flex items-center justify-center gap-4">
            <button
                onClick={() => setView(View.SIGN_IN)}
                className="px-6 py-2 rounded-lg text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all duration-200"
            >
                Sign In
            </button>
            <button
                onClick={() => setView(View.SIGN_UP)}
                className="px-6 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#FF0000] to-[#8B0000] text-white hover:opacity-90 transition-all duration-200 shadow-[0_0_15px_rgba(255,0,0,0.3)]"
            >
                Sign Up
            </button>
        </div>
    </div>
);

// ============================================================================
// LEFT SIDEBAR: TOPIC NAVIGATION
// ============================================================================

const TopicSidebar: React.FC<{
    topics: typeof MOCK_TOPICS;
    activeTopic: string;
    onTopicSelect: (topicId: string) => void;
}> = ({ topics, activeTopic, onTopicSelect }) => {
    return (
        <div className="h-fit">
            <div className="bg-[#121212]/80 backdrop-blur-md border border-white/10 rounded-xl p-4">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-2xl">🏛️</span>
                    <span>The Tribes</span>
                </h2>
                <div className="space-y-2">
                    {topics.map((topic) => {
                        const isActive = activeTopic === topic.id;
                        return (
                            <button
                                key={topic.id}
                                onClick={() => onTopicSelect(topic.id)}
                                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-full
                  transition-all duration-300 text-left group
                  ${isActive
                                        ? 'bg-gradient-to-r from-[#FF0000] to-[#8B0000] text-white shadow-[0_0_20px_rgba(255,0,0,0.5)]'
                                        : 'bg-[#050505] text-[#A0A0A0] hover:bg-[#1a1a1a] hover:text-white border border-[#333333]'
                                    }
                `}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{topic.icon}</span>
                                    <span className="font-medium">{topic.name}</span>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${isActive ? 'bg-white/20' : 'bg-[#1a1a1a] group-hover:bg-[#222222]'}`}>
                                    {topic.count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// RIGHT SIDEBAR: LEADERBOARD
// ============================================================================

const Leaderboard: React.FC<{
    leaders: typeof MOCK_LEADERBOARD;
    trendingPosts: Array<{ id: string; title: string; replies: number }>;
}> = ({ leaders, trendingPosts }) => {
    const getRankBorder = (rank: number) => {
        if (rank === 1) return 'border-2 border-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.3)]';
        if (rank === 2) return 'border-2 border-[#C0C0C0] shadow-[0_0_15px_rgba(192,192,192,0.3)]';
        if (rank === 3) return 'border-2 border-[#CD7F32] shadow-[0_0_15px_rgba(205,127,50,0.3)]';
        return 'border border-[#333333]';
    };

    const getRankEmoji = (rank: number) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return '🏅';
    };

    return (
        <div className="h-fit space-y-6">
            {/* Top Contributors */}
            <div className="bg-[#121212]/80 backdrop-blur-md border border-white/10 rounded-xl p-4">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <TrophyIcon className="w-6 h-6 text-[#FFD700]" />
                    <span>Hall of Fame</span>
                </h2>
                <div className="space-y-3">
                    {leaders.map((leader) => (
                        <div
                            key={leader.id}
                            className={`
                flex items-center gap-3 p-3 rounded-lg bg-[#050505]
                transition-all duration-200 hover:bg-[#1a1a1a]
                ${getRankBorder(leader.rank)}
              `}
                        >
                            <span className="text-2xl">{getRankEmoji(leader.rank)}</span>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF0000] to-[#8B0000] flex items-center justify-center text-white font-bold">
                                {(leader.name || 'U').charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-semibold text-sm truncate">{leader.name}</p>
                                <p className="text-[#A0A0A0] text-xs">{leader.contributions} contributions</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Trending This Week */}
            <div className="bg-[#121212]/80 backdrop-blur-md border border-white/10 rounded-xl p-4">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <FireIcon className="w-6 h-6 text-[#FF0000]" />
                    <span>Trending</span>
                </h2>
                <div className="space-y-3">
                    {trendingPosts.map((post, index) => (
                        <div
                            key={post.id}
                            className="p-3 rounded-lg bg-[#050505] border border-[#333333] hover:border-[#FF0000]/50 transition-all duration-200 cursor-pointer group"
                        >
                            <div className="flex items-start gap-2">
                                <span className="text-[#FF0000] font-bold text-sm">#{index + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium line-clamp-2 group-hover:text-[#FF0000] transition-colors">
                                        {post.title}
                                    </p>
                                    <p className="text-[#A0A0A0] text-xs mt-1">{post.replies} replies</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// CENTER: DISCUSSION CARD
// ============================================================================

const DiscussionCard: React.FC<{
    post: CommunityPost;
    onLike: (id: string) => void;
    onReply: () => void;
}> = ({ post, onLike, onReply }) => {
    // Generate avatar pile (show up to 3 recent repliers)
    const recentRepliers = ['user2', 'user3', 'user4'].slice(0, Math.min(3, post.replies));

    const timeAgo = (dateString: string) => {
        const now = new Date();
        const past = new Date(dateString);
        const diffMs = now.getTime() - past.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    return (
        <div className="discussion-card bg-[#121212] border border-[#333333] rounded-xl p-5 hover:border-[#FF0000]/50 transition-all duration-300 cursor-pointer group">
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF0000] to-[#8B0000] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {(post.author || 'A').charAt(0)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-white font-semibold">{post.author}</span>
                        <span className="text-[#A0A0A0] text-sm">{post.username}</span>
                        <span className="text-[#666666]">•</span>
                        <span className="text-[#A0A0A0] text-sm">{timeAgo(post.createdAt)}</span>
                    </div>

                    {/* Discussion Title/Content */}
                    <h3 className="text-white text-lg font-bold mb-2 group-hover:text-[#FF0000] transition-colors">
                        {post.content}
                    </h3>

                    {/* Media Preview (if exists) */}
                    {post.media && post.media.length > 0 && (
                        <div className="mt-3 mb-3">
                            <img
                                src={post.media[0].url}
                                alt="Discussion media"
                                className="rounded-lg max-h-64 object-cover border border-[#333333]"
                            />
                        </div>
                    )}

                    {/* Footer: Stats and Actions */}
                    <div className="flex items-center gap-6 mt-4">
                        {/* Reply Count */}
                        <button
                            onClick={(e) => { e.stopPropagation(); onReply(); }}
                            className="flex items-center gap-2 text-[#A0A0A0] hover:text-[#FF0000] transition-colors group/btn"
                        >
                            <ChatBubbleLeftIcon className="w-5 h-5" />
                            <span className="text-sm font-medium">{post.replies}</span>
                        </button>

                        {/* Like Count */}
                        <button
                            onClick={(e) => { e.stopPropagation(); onLike(post.id); }}
                            className={`flex items-center gap-2 transition-colors group/btn ${post.isLiked ? 'text-[#FF0000]' : 'text-[#A0A0A0] hover:text-[#FF0000]'
                                }`}
                        >
                            <svg className="w-5 h-5" fill={post.isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span className="text-sm font-medium">{post.likes}</span>
                        </button>

                        {/* Avatar Pile */}
                        {post.replies > 0 && (
                            <div className="flex items-center gap-2 ml-auto">
                                <div className="flex -space-x-2">
                                    {recentRepliers.map((avatar, idx) => (
                                        <div
                                            key={idx}
                                            className="w-6 h-6 rounded-full bg-gradient-to-br from-[#666666] to-[#333333] border-2 border-[#121212] flex items-center justify-center text-white text-xs font-bold"
                                        >
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                    ))}
                                </div>
                                {post.replies > 3 && (
                                    <span className="text-[#A0A0A0] text-xs">+{post.replies - 3} more</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// CENTER: CREATE POST BOX
// ============================================================================

const CreatePostBox: React.FC<{
    currentUser: User;
    onSubmit: (content: string, media: MediaItem[]) => void;
}> = ({ currentUser, onSubmit }) => {
    const [content, setContent] = useState('');
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [isFocused, setIsFocused] = useState(false);
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if ((content.trim() || media.length > 0) && content.length <= CHARACTER_LIMIT) {
            onSubmit(content, media);
            setContent('');
            setMedia([]);
            setIsFocused(false);
        }
    };

    const remainingChars = CHARACTER_LIMIT - content.length;

    return (
        <div
            className={`
        bg-[#121212] border rounded-xl p-5 mb-6 transition-all duration-300
        ${isFocused
                    ? 'border-[#FF0000] shadow-[0_0_20px_rgba(255,0,0,0.3)]'
                    : 'border-[#333333] hover:border-[#FF0000]/50'
                }
      `}
        >
            <form onSubmit={handleSubmit}>
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF0000] to-[#8B0000] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {(currentUser.name || 'G').charAt(0)}
                    </div>
                    <div className="flex-1">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => !content && !media.length && setIsFocused(false)}
                            placeholder="What's on your mind? Start a discussion..."
                            className="w-full bg-transparent text-white text-lg placeholder-[#666666] focus:outline-none resize-none"
                            rows={isFocused ? 4 : 2}
                        />
                    </div>
                </div>

                {/* Media Preview */}
                {media.length > 0 && (
                    <div className="mt-4 grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                        {media.map((item, index) => (
                            <div key={index} className="relative aspect-square">
                                {item.type === 'image' ? (
                                    <img src={item.url} alt={`Preview ${index}`} className="w-full h-full object-cover rounded-lg border border-[#333333]" />
                                ) : (
                                    <div className="w-full h-full relative">
                                        <video src={item.url} className="w-full h-full object-cover rounded-lg border border-[#333333]" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                            <VideoCameraIcon className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={() => removeMedia(index)}
                                    className="absolute top-1 right-1 bg-black/80 rounded-full p-1 text-white hover:bg-[#FF0000] transition-colors"
                                >
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Actions */}
                {(isFocused || content || media.length > 0) && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#333333]">
                        <div className="relative flex items-center gap-2">
                            <input
                                type="file"
                                ref={imageInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                multiple
                                className="hidden"
                            />
                            <input
                                type="file"
                                ref={videoInputRef}
                                onChange={handleFileChange}
                                accept="video/*"
                                multiple
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => setMediaOptionsOpen(!mediaOptionsOpen)}
                                className="text-[#A0A0A0] p-2 rounded-full hover:bg-[#FF0000]/10 hover:text-[#FF0000] transition-all"
                                title="Add Media"
                            >
                                <PlusIcon className="w-5 h-5" />
                            </button>
                            {mediaOptionsOpen && (
                                <div
                                    className="absolute bottom-full left-0 mb-2 w-40 bg-[#1a1a1a] border border-[#333333] rounded-lg shadow-lg z-10"
                                    onMouseLeave={() => setMediaOptionsOpen(false)}
                                >
                                    <button
                                        type="button"
                                        onClick={() => imageInputRef.current?.click()}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-left text-[#A0A0A0] hover:bg-[#FF0000]/10 hover:text-white transition-colors"
                                    >
                                        <ImageIcon className="w-5 h-5" />
                                        <span>Photo</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => videoInputRef.current?.click()}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-left text-[#A0A0A0] hover:bg-[#FF0000]/10 hover:text-white transition-colors"
                                    >
                                        <VideoCameraIcon className="w-5 h-5" />
                                        <span>Video</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            <span className={`text-sm ${remainingChars < 0 ? 'text-[#FF0000]' : 'text-[#666666]'}`}>
                                {remainingChars}
                            </span>
                            <button
                                type="submit"
                                disabled={(!content.trim() && media.length === 0) || remainingChars < 0}
                                className="px-6 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#FF0000] to-[#8B0000] text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(255,0,0,0.3)]"
                            >
                                Post
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const CommunityHub: React.FC<CommunityHubProps> = ({
    posts,
    addPost,
    onLike,
    onRepost,
    onEditPost,
    onReply,
    currentUser,
    setView
}) => {
    const [activeTopic, setActiveTopic] = useState('all');

    // Filter posts by active topic (for now, show all since we don't have topic field in posts)
    const filteredPosts = activeTopic === 'all' ? posts : posts;

    // Mock trending posts
    const trendingPosts = [
        { id: '1', title: 'Looking for co-founder for coffee shop startup', replies: 24 },
        { id: '2', title: 'Best locations for retail space in downtown?', replies: 18 },
        { id: '3', title: 'How to get business permits quickly?', replies: 15 },
    ];

    return (

        <div className="h-screen bg-[#050505] flex flex-col overflow-hidden">
            {/* Page Header - Fixed at Top */}
            <div className="shrink-0 bg-[#050505]/95 backdrop-blur-sm z-10 border-b border-[#333333]">
                <div className="container mx-auto max-w-7xl px-4 py-2">
                    <h1 className="text-4xl font-bold text-white mb-2">Community Hub</h1>
                    <p className="text-[#A0A0A0]">Connect, discuss, and collaborate with fellow entrepreneurs</p>
                </div>
            </div>

            {/* Main Content Area - Fixed Height with Internal Scroll */}
            <div className="flex-1 overflow-hidden container mx-auto max-w-7xl w-full">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">

                    {/* LEFT SIDEBAR - Fixed Container */}
                    <div className="hidden lg:block lg:col-span-1 h-full py-6 pr-2 overflow-y-auto hide-scrollbar">
                        <TopicSidebar
                            topics={MOCK_TOPICS}
                            activeTopic={activeTopic}
                            onTopicSelect={setActiveTopic}
                        />
                    </div>

                    {/* CENTER - Scrollable Container */}
                    {/* id="scrollable-center" allows capturing scroll events specifically here if needed */}
                    <div className="lg:col-span-2 h-full overflow-y-auto hide-scrollbar py-6 px-1">
                        {/* Create Post */}
                        {currentUser ? (
                            <CreatePostBox currentUser={currentUser} onSubmit={addPost} />
                        ) : (
                            <SignInToPost setView={setView} />
                        )}

                        {/* Discussion List */}
                        <div className="space-y-4 pb-20">
                            {filteredPosts.length === 0 ? (
                                <div className="bg-[#121212] border border-[#333333] rounded-xl p-12 text-center">
                                    <p className="text-[#666666] text-lg">No discussions yet. Start the conversation!</p>
                                </div>
                            ) : (
                                filteredPosts.map(post => (
                                    <DiscussionCard
                                        key={post.id}
                                        post={post}
                                        onLike={onLike}
                                        onReply={() => onReply(post.id, '', [])}
                                    />
                                ))
                            )}

                            {/* DEMO CONTENT: Extra cards to demonstrate scroll behavior */}
                            {Array.from({ length: 8 }).map((_, index) => (
                                <DiscussionCard
                                    key={`demo-${index}`}
                                    post={{
                                        id: `demo-${index}`,
                                        author: ['Alex Johnson', 'Sarah Chen', 'Mike Ross', 'Emma Davis'][index % 4],
                                        username: `@user${index + 1}`,
                                        content: [
                                            'Looking for co-founder for coffee shop startup in downtown area',
                                            'Best locations for retail space? Need advice on lease negotiations',
                                            'How to get business permits quickly? Any tips from experienced entrepreneurs?',
                                            'Seeking feedback on my new restaurant concept - fusion cuisine',
                                            'Anyone interested in partnering for a co-working space?',
                                            'What are the most in-demand services in your neighborhood?',
                                            'Tips for first-time business owners? Share your experiences!',
                                            'Looking for investors for tech startup - AI-powered solutions'
                                        ][index % 8],
                                        createdAt: new Date(Date.now() - index * 3600000).toISOString(),
                                        likes: Math.floor(Math.random() * 50) + 5,
                                        replies: Math.floor(Math.random() * 30) + 2,
                                        reposts: 0,
                                        isLiked: false,
                                        isReposted: false,
                                        media: []
                                    }}
                                    onLike={onLike}
                                    onReply={() => { }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* RIGHT SIDEBAR - Fixed Container */}
                    <div className="hidden lg:block lg:col-span-1 h-full py-6 pl-2 overflow-y-auto hide-scrollbar">
                        <Leaderboard
                            leaders={MOCK_LEADERBOARD}
                            trendingPosts={trendingPosts}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommunityHub;
