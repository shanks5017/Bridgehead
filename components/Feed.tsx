import React, { useMemo, useState, useRef } from 'react';
import { DemandPost, RentalPost, CommunityPost, MediaItem, User, View } from '../types';
import DemandCard from './DemandCard';
import RentalCard from './RentalCard';
import CommunityPostCard from './CommunityPostCard';
import { EmptyState } from './LandingPages';
import { XIcon, PlusIcon, ImageIcon, VideoCameraIcon } from './icons';

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
        if(imageInputRef.current) imageInputRef.current.value = "";
        if(videoInputRef.current) videoInputRef.current.value = "";
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
                        <input type="file" ref={imageInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden"/>
                        <input type="file" ref={videoInputRef} onChange={handleFileChange} accept="video/*" multiple className="hidden"/>
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

    return (
        <div className="min-h-screen py-12">
            <div className="container mx-auto max-w-2xl px-4 space-y-8">
                <h1 className="text-4xl font-bold text-center md:text-left">Latest Activity</h1>
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
                                    // Fix: Pass a function that sets the editing post ID, which matches the expected (id: string) => void signature.
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
        </div>
    );
};

export default Feed;