import React, { useRef, useState } from 'react';
import { CommunityPost, MediaItem, User, View } from '../types';
import { 
    UserCircleIcon, 
    ReplyIcon, 
    RepostIcon, 
    HeartIcon, 
    VideoCameraIcon, 
    PencilIcon, 
    PlusIcon, 
    ImageIcon, 
    XIcon 
} from './icons';

interface CommunityPostCardProps {
    post: CommunityPost;
    onLike: (id: string) => void;
    onRepost: (id: string) => void;
    onEdit: (id: string) => void;
    onVideoReply: (postId: string, media: MediaItem) => void;
    onReply: (postId: string, content: string, media: MediaItem[]) => void;
    currentUser: User | null;
    setView: (view: View) => void;
}

const CHARACTER_LIMIT = 280;

const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}S`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}M`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}H`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
};

const ActionButton: React.FC<{
    icon: React.ReactNode;
    count: number;
    onClick: () => void;
    activeColor?: string;
    isActive?: boolean;
}> = ({ icon, count, onClick, activeColor, isActive }) => {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 group px-4 py-2 border border-ink transition-all ${
                isActive ? activeColor : 'bg-white hover:bg-foundation'
            }`}
        >
            <div className="transform transition-transform group-hover:scale-110">
                {icon}
            </div>
            {count > 0 && <span className="text-[10px] font-bold font-mono tracking-widest">{count}</span>}
        </button>
    );
};

const MediaGrid: React.FC<{ media: CommunityPost['media'] }> = ({ media }) => {
    if (!media || media.length === 0) return null;

    return (
        <div className="mt-6 grid grid-cols-2 gap-px bg-ink border border-ink overflow-hidden neo-shadow-sm">
            {media.map((item, index) => (
                <div 
                    key={index} 
                    className={`relative bg-white overflow-hidden ${media.length === 1 ? 'col-span-2 aspect-[16/9]' : 'aspect-square'}`}
                >
                    {item.type === 'image' ? (
                        <img 
                            src={item.url} 
                            alt="" 
                            className="w-full h-full object-cover transition-all duration-700 hover:scale-[1.05]" 
                        />
                    ) : (
                        <video src={item.url} className="w-full h-full object-cover bg-black" />
                    )}
                </div>
            ))}
        </div>
    );
};

const CommunityPostCard: React.FC<CommunityPostCardProps> = ({ 
    post, onLike, onRepost, onEdit, onVideoReply, onReply, currentUser, setView 
}) => {
    const isCurrentUserPost = currentUser?.name === post.author;
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [replyMedia, setReplyMedia] = useState<MediaItem[]>([]);
    const replyImageInputRef = useRef<HTMLInputElement>(null);

    const handleReplySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (replyContent.trim() || replyMedia.length > 0) {
            onReply(post.id, replyContent, replyMedia);
            setIsReplying(false);
            setReplyContent('');
            setReplyMedia([]);
        }
    };

    return (
        <div className="bg-white border-2 border-ink p-8 transition-all hover:neo-shadow-md animate-slide-up group">
            <div className="flex gap-6">
                {/* Author Identity Block */}
                <div 
                    className="w-16 h-16 border-2 border-ink flex-shrink-0 bg-foundation overflow-hidden cursor-pointer hover:neo-shadow-sm transition-all"
                    onClick={() => {
                        localStorage.setItem('viewingUsername', post.username?.replace('@', '') || '');
                        setView(View.PROFILE);
                    }}
                >
                    {post.avatar ? (
                        <img src={post.avatar} alt={post.author} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-2xl font-serif-italic italic opacity-20">
                            {post.author?.[0]}
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    {/* Post Metadata Protocol */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <span 
                                className="font-serif-italic font-bold text-2xl uppercase tracking-tighter hover:text-accent-green cursor-pointer transition-colors leading-none"
                                onClick={() => {
                                    localStorage.setItem('viewingUsername', post.username?.replace('@', '') || '');
                                    setView(View.PROFILE);
                                }}
                            >
                                {post.author}
                            </span>
                            <span className="text-[10px] font-mono opacity-40 uppercase tracking-[0.2em]">{post.username}</span>
                            <span className="text-[10px] font-mono opacity-20">—</span>
                            <span className="text-[10px] font-mono opacity-40 uppercase tracking-[0.2em]">{timeAgo(post.createdAt)}</span>
                        </div>
                        {isCurrentUserPost && (
                            <button onClick={() => onEdit(post.id)} className="p-2 border border-ink hover:bg-foundation transition-all">
                                <PencilIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Discussion Content */}
                    <p className="text-xl leading-snug font-bold uppercase tracking-tight opacity-90 break-words mb-6">
                        {post.content}
                    </p>

                    <MediaGrid media={post.media} />

                    {/* Interaction Array */}
                    <div className="mt-8 flex flex-wrap items-center gap-4">
                        <ActionButton 
                            icon={<ReplyIcon className="w-4 h-4" />} 
                            count={post.replies} 
                            onClick={() => setIsReplying(!isReplying)} 
                        />
                        <ActionButton 
                            icon={<RepostIcon className="w-4 h-4" />} 
                            count={post.reposts} 
                            onClick={() => onRepost(post.id)}
                            isActive={post.isReposted}
                            activeColor="bg-ink text-white"
                        />
                        <ActionButton 
                            icon={<HeartIcon className="w-4 h-4" isFilled={post.isLiked} />} 
                            count={post.likes} 
                            onClick={() => onLike(post.id)}
                            isActive={post.isLiked}
                            activeColor="bg-accent-green text-ink"
                        />
                        <button className="ml-auto text-[10px] font-mono tracking-widest uppercase opacity-40 hover:opacity-100 hover:text-accent-green transition-all pb-1 border-b border-transparent hover:border-accent-green">
                            REPLICATE INTEL
                        </button>
                    </div>

                    {/* Inline Communication Protocol */}
                    {isReplying && (
                        <div className="mt-8 p-6 bg-foundation/30 border-2 border-ink animate-slide-up">
                            <form onSubmit={handleReplySubmit}>
                                <textarea
                                    value={replyContent}
                                    onChange={e => setReplyContent(e.target.value)}
                                    placeholder={`RESPOND TO ${post.username}...`}
                                    className="w-full bg-transparent border-none focus:ring-0 resize-none text-lg font-bold uppercase placeholder:opacity-20 translate-y-1"
                                    rows={2}
                                    autoFocus
                                />
                                <div className="mt-6 flex items-center justify-between border-t border-ink/10 pt-6">
                                    <div className="flex gap-2">
                                        <input type="file" ref={replyImageInputRef} hidden accept="image/*" multiple />
                                        <button type="button" onClick={() => replyImageInputRef.current?.click()} className="p-3 border border-ink hover:bg-white transition-all"><ImageIcon className="w-4 h-4" /></button>
                                        <button type="button" className="p-3 border border-ink hover:bg-white transition-all"><VideoCameraIcon className="w-4 h-4" /></button>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className={`text-[10px] font-mono tracking-widest ${CHARACTER_LIMIT - replyContent.length < 0 ? 'text-red-600' : 'opacity-40'}`}>
                                            {CHARACTER_LIMIT - replyContent.length} BITS
                                        </span>
                                        <button type="submit" className="neo-button neo-button-primary py-2 px-8 text-xs font-bold">EMIT REPLY</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default React.memo(CommunityPostCard);