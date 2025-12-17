import React, { useRef, useState } from 'react';
import { CommunityPost, MediaItem, User, View } from '../types';
import { UserCircleIcon, ReplyIcon, RepostIcon, HeartIcon, VideoCameraIcon, PencilIcon, PlusIcon, ImageIcon, XIcon } from './icons';
import ImageContainer from './common/ImageContainer';

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
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};


const ActionButton: React.FC<{
    icon: React.ReactNode;
    count: number;
    onClick: () => void;
    hoverColor: string;
    activeColor?: string;
    isActive?: boolean;
}> = ({ icon, count, onClick, hoverColor, activeColor, isActive }) => {
    const activeClass = isActive ? activeColor : 'text-[--text-secondary]';

    return (
        <button
            onClick={onClick}
            className={`flex items-center space-x-2 ${activeClass} ${hoverColor} transition-colors group`}
        >
            <div className="p-2 rounded-full group-hover:bg-[--primary-color]/10 transition-colors">
                {icon}
            </div>
            <span className="text-sm">{count > 0 ? count : ''}</span>
        </button>
    );
};

const MediaGrid: React.FC<{ media: CommunityPost['media'] }> = ({ media }) => {
    if (!media || media.length === 0) return null;

    const gridClasses = {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-2', // Will handle with spans
        4: 'grid-cols-2',
    }[media.length] || 'grid-cols-2';

    return (
        <div className={`mt-3 grid ${gridClasses} gap-1.5 rounded-xl overflow-hidden border border-[--border-color]`}>
            {media.map((item, index) => {
                const isImage = item.type === 'image';
                const isLastItemWithOddCount = media.length % 2 !== 0 && index === media.length - 1;

                return (
                    <div
                        key={index}
                        className={`relative ${isLastItemWithOddCount ? 'col-span-2' : ''}`}
                    >
                        {isImage ? (
                            <ImageContainer
                                src={item.url}
                                alt={`Post media ${index + 1}`}
                                aspectRatio="video"
                                className="w-full"
                            />
                        ) : (
                            <div className="relative aspect-video">
                                <video controls src={item.url} className="w-full h-full object-cover bg-black" />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};


const CommunityPostCard: React.FC<CommunityPostCardProps> = ({ post, onLike, onRepost, onEdit, onVideoReply, onReply, currentUser, setView }) => {
    const isCurrentUserPost = currentUser?.name === post.author;
    const videoReplyInputRef = useRef<HTMLInputElement>(null);

    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [replyMedia, setReplyMedia] = useState<MediaItem[]>([]);
    const [mediaOptionsOpen, setMediaOptionsOpen] = useState(false);
    const replyImageInputRef = useRef<HTMLInputElement>(null);
    const replyVideoInputRef = useRef<HTMLInputElement>(null);

    const withAuthCheck = (action: () => void) => {
        return () => {
            if (!currentUser) {
                setView(View.SIGN_IN);
            } else {
                action();
            }
        };
    };

    const handleReplyClick = () => {
        withAuthCheck(() => {
            setIsReplying(!isReplying);
            if (!isReplying) { // When opening for the first time
                setReplyContent(`@${post.username} `);
            }
        })();
    };

    const handleVideoReplyClick = () => {
        videoReplyInputRef.current?.click();
    };

    const handleVideoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const url = e.target?.result as string;
            const videoMedia: MediaItem = { type: 'video', url };
            onVideoReply(post.id, videoMedia);
        };
        reader.readAsDataURL(file);

        if (videoReplyInputRef.current) {
            videoReplyInputRef.current.value = "";
        }
    };

    const handleReplyFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        Array.from(files).forEach((file: File) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const url = e.target?.result as string;
                const type = file.type.startsWith('image/') ? 'image' : 'video';
                setReplyMedia(prev => [...prev, { type, url }]);
            };
            reader.readAsDataURL(file);
        });

        if (replyImageInputRef.current) replyImageInputRef.current.value = "";
        if (replyVideoInputRef.current) replyVideoInputRef.current.value = "";
        setMediaOptionsOpen(false);
    };

    const removeReplyMedia = (index: number) => {
        setReplyMedia(prev => prev.filter((_, i) => i !== index));
    };

    const handleReplySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if ((replyContent.trim() || replyMedia.length > 0) && replyContent.length <= CHARACTER_LIMIT) {
            onReply(post.id, replyContent, replyMedia);
            setIsReplying(false);
            setReplyContent('');
            setReplyMedia([]);
        }
    };

    const remainingChars = CHARACTER_LIMIT - replyContent.length;


    return (
        <div className="bg-[--card-color] border border-[--border-color] rounded-xl p-4 flex items-start space-x-4">
            <input
                type="file"
                ref={videoReplyInputRef}
                onChange={handleVideoFileChange}
                accept="video/*"
                className="hidden"
            />
            <UserCircleIcon className="w-12 h-12 text-[--text-secondary] flex-shrink-0" />
            <div className="w-full">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <span className="font-bold text-white">{post.author}</span>
                        <span className="text-[--text-secondary]">{post.username}</span>
                        <span className="text-[--text-secondary]">·</span>
                        <span className="text-[--text-secondary] text-sm">{timeAgo(post.createdAt)}</span>
                    </div>
                    {isCurrentUserPost && (
                        <button
                            onClick={() => onEdit(post.id)}
                            className="text-[--text-secondary] hover:text-[--primary-color] p-1 rounded-full transition-colors"
                            aria-label="Edit post"
                        >
                            <PencilIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
                {post.content && (
                    <p className="text-white mt-2 whitespace-pre-wrap break-words">
                        {post.content}
                    </p>
                )}
                <MediaGrid media={post.media} />
                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-4 w-full max-w-sm justify-between">
                        <ActionButton
                            icon={<ReplyIcon className="w-5 h-5" />}
                            count={post.replies}
                            onClick={handleReplyClick}
                            hoverColor="hover:text-blue-500"
                        />
                        <ActionButton
                            icon={<RepostIcon className="w-5 h-5" />}
                            count={post.reposts}
                            onClick={withAuthCheck(() => onRepost(post.id))}
                            hoverColor="hover:text-green-500"
                            activeColor="text-green-500"
                            isActive={post.isReposted}
                        />
                        <ActionButton
                            icon={<HeartIcon className="w-5 h-5" isFilled={post.isLiked} />}
                            count={post.likes}
                            onClick={withAuthCheck(() => onLike(post.id))}
                            hoverColor="hover:text-pink-500"
                            activeColor="text-pink-500"
                            isActive={post.isLiked}
                        />
                        <ActionButton
                            icon={<VideoCameraIcon className="w-5 h-5" />}
                            count={0}
                            onClick={withAuthCheck(handleVideoReplyClick)}
                            hoverColor="hover:text-purple-500"
                        />
                    </div>
                </div>

                {isReplying && (
                    <div className="mt-4">
                        <form onSubmit={handleReplySubmit}>
                            <textarea
                                value={replyContent}
                                onChange={e => setReplyContent(e.target.value)}
                                placeholder={`Replying to ${post.username}...`}
                                className="w-full bg-transparent text-[--text-primary] placeholder-[--text-secondary] focus:outline-none resize-none"
                                rows={2}
                                autoFocus
                            />
                            {replyMedia.length > 0 && (
                                <div className="mt-2 grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                                    {replyMedia.map((item, index) => (
                                        <div key={index} className="relative aspect-square">
                                            {item.type === 'image' ? (
                                                <img src={item.url} alt={`Preview ${index}`} className="w-full h-full object-cover rounded-lg" />
                                            ) : (
                                                <div className="w-full h-full relative">
                                                    <video src={item.url} className="w-full h-full object-cover rounded-lg" />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                        <VideoCameraIcon className="w-6 h-6 text-white" />
                                                    </div>
                                                </div>
                                            )}
                                            <button type="button" onClick={() => removeReplyMedia(index)} className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white z-10">
                                                <XIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center justify-between mt-2">
                                <div className="relative">
                                    <input type="file" ref={replyImageInputRef} onChange={handleReplyFileChange} accept="image/*" multiple className="hidden" />
                                    <input type="file" ref={replyVideoInputRef} onChange={handleReplyFileChange} accept="video/*" multiple className="hidden" />
                                    <button
                                        type="button"
                                        onClick={() => setMediaOptionsOpen(!mediaOptionsOpen)}
                                        className="text-[--primary-color] p-2 rounded-full hover:bg-[--primary-color]/10 transition-colors"
                                        title="Add Media"
                                    >
                                        <PlusIcon className="w-5 h-5" />
                                    </button>
                                    {mediaOptionsOpen && (
                                        <div className="absolute bottom-full left-0 mb-2 w-40 bg-[--card-color] border border-[--border-color] rounded-lg shadow-lg z-10" onMouseLeave={() => setMediaOptionsOpen(false)}>
                                            <button type="button" onClick={() => replyImageInputRef.current?.click()} className="w-full flex items-center gap-3 px-4 py-2 text-left text-[--text-secondary] hover:bg-white/10 hover:text-white">
                                                <ImageIcon className="w-5 h-5" /><span>Photo</span>
                                            </button>
                                            <button type="button" onClick={() => replyVideoInputRef.current?.click()} className="w-full flex items-center gap-3 px-4 py-2 text-left text-[--text-secondary] hover:bg-white/10 hover:text-white">
                                                <VideoCameraIcon className="w-5 h-5" /><span>Video</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center space-x-4">
                                    <span className={`text-sm ${remainingChars < 0 ? 'text-red-500' : 'text-[--text-secondary]'}`}>
                                        {remainingChars}
                                    </span>
                                    <button type="button" onClick={() => setIsReplying(false)} className="px-4 py-1.5 rounded-full text-sm font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={(!replyContent.trim() && replyMedia.length === 0) || remainingChars < 0} className="px-4 py-1.5 rounded-full text-sm font-semibold bg-[--primary-color] text-white hover:opacity-90 transition-opacity disabled:opacity-50">
                                        Reply
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommunityPostCard;