import React, { useState, useRef } from 'react';
import { CommunityPost, MediaItem, User, View } from '../types';
import CommunityPostCard from './CommunityPostCard';
import { UserCircleIcon, XIcon, PlusIcon, ImageIcon, VideoCameraIcon } from './icons';

interface CommunityFeedProps {
  posts: CommunityPost[];
  addPost: (content: string, media: MediaItem[]) => void;
  onLike: (id: string) => void;
  onRepost: (id: string) => void;
  onEditPost: (id: string, content: string, media: MediaItem[]) => void;
  onReply: (postId: string, content: string, media: MediaItem[]) => void;
  currentUser: User | null;
  setView: (view: View) => void;
}

const CHARACTER_LIMIT = 280;

const SignInToPost: React.FC<{ setView: (view: View) => void }> = ({ setView }) => (
    <div className="bg-[--card-color] border border-[--border-color] rounded-xl p-4 mb-8 text-center">
        <p className="text-lg font-semibold">Join the conversation!</p>
        <p className="text-[--text-secondary] mb-4">Sign in or create an account to post in the community hub.</p>
        <div className="flex items-center justify-center gap-4">
            <button onClick={() => setView(View.SIGN_IN)} className="px-4 py-2 rounded-md text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-colors">
                Sign In
            </button>
            <button onClick={() => setView(View.SIGN_UP)} className="px-4 py-2 rounded-md text-sm font-medium bg-[--primary-color] text-white hover:opacity-90 transition-opacity">
                Sign Up
            </button>
        </div>
    </div>
);


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
        if(imageInputRef.current) {
            imageInputRef.current.value = "";
        }
        if(videoInputRef.current) {
            videoInputRef.current.value = "";
        }
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
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                            <VideoCameraIcon className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                )}
                                <button type="button" onClick={() => removeMedia(index)} className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white z-10">
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                
                <div className="flex items-center justify-between mt-2">
                     <div className="relative">
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
                            className="text-[--primary-color] p-2 rounded-full hover:bg-[--primary-color]/10 transition-colors"
                            title="Add Photo or Video"
                        >
                            <PlusIcon className="w-6 h-6" />
                        </button>
                         {mediaOptionsOpen && (
                            <div 
                                className="absolute bottom-full left-0 mb-2 w-40 bg-[--card-color] border border-[--border-color] rounded-lg shadow-lg z-10"
                                onMouseLeave={() => setMediaOptionsOpen(false)}
                            >
                                <button
                                    type="button"
                                    onClick={() => imageInputRef.current?.click()}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-left text-[--text-secondary] hover:bg-white/10 hover:text-white"
                                >
                                    <ImageIcon className="w-5 h-5" />
                                    <span>Photo</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => videoInputRef.current?.click()}
                                    className="w-full flex items-center gap-3 px-4 py-2 text-left text-[--text-secondary] hover:bg-white/10 hover:text-white"
                                >
                                    <VideoCameraIcon className="w-5 h-5" />
                                    <span>Video</span>
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className={`text-sm ${remainingChars < 0 ? 'text-red-500' : 'text-[--text-secondary]'}`}>
                            {remainingChars}
                        </span>
                        
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-5 py-2 rounded-full text-sm font-semibold bg-white/10 text-white hover:bg-white/20 transition-colors"
                        >
                            Cancel
                        </button>
                        
                        <button
                            type="submit"
                            disabled={(!content.trim() && media.length === 0) || remainingChars < 0}
                            className="px-5 py-2 rounded-full text-sm font-semibold bg-[--primary-color] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};


const CommunityFeed: React.FC<CommunityFeedProps> = ({ posts, addPost, onLike, onRepost, onEditPost, onReply, currentUser, setView }) => {
    const [newPostContent, setNewPostContent] = useState('');
    const [media, setMedia] = useState<MediaItem[]>([]);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const [mediaOptionsOpen, setMediaOptionsOpen] = useState(false);
    const [editingPostId, setEditingPostId] = useState<string | null>(null);

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
        // Reset file input to allow selecting the same file again
        if(imageInputRef.current) {
            imageInputRef.current.value = "";
        }
        if(videoInputRef.current) {
            videoInputRef.current.value = "";
        }
        setMediaOptionsOpen(false);
    };

    const removeMedia = (index: number) => {
        setMedia(prev => prev.filter((_, i) => i !== index));
    };

    const handlePostSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if ((newPostContent.trim() || media.length > 0) && newPostContent.length <= CHARACTER_LIMIT) {
            addPost(newPostContent, media);
            setNewPostContent('');
            setMedia([]);
        }
    };

    const handleSaveEdit = (id: string, content: string, media: MediaItem[]) => {
        onEditPost(id, content, media);
        setEditingPostId(null);
    };

    const handleVideoReply = (postId: string, mediaItem: MediaItem) => {
        const originalPost = posts.find(p => p.id === postId);
        if (originalPost) {
            const replyContent = `Replying to ${originalPost.username}`;
            onReply(postId, replyContent, [mediaItem]);
        }
    };
    
    const remainingChars = CHARACTER_LIMIT - newPostContent.length;
    
    return (
        <div className="min-h-screen py-12">
            <div className="container mx-auto max-w-2xl px-4">
                <h1 className="text-4xl font-bold mb-8">Community Hub</h1>
                
                {currentUser ? (
                    <div className="bg-[--card-color] border border-[--border-color] rounded-xl p-4 mb-8">
                        <form onSubmit={handlePostSubmit}>
                            <div className="flex items-start space-x-4">
                                <UserCircleIcon className="w-12 h-12 text-[--text-secondary] flex-shrink-0" />
                                <div className="w-full">
                                    <textarea
                                        value={newPostContent}
                                        onChange={e => setNewPostContent(e.target.value)}
                                        placeholder="What's on your mind?"
                                        className="w-full bg-transparent text-lg text-[--text-primary] placeholder-[--text-secondary] focus:outline-none resize-none"
                                        rows={3}
                                    />
                                </div>
                            </div>

                            {media.length > 0 && (
                                <div className="mt-4 pl-16 grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                                    {media.map((item, index) => (
                                        <div key={index} className="relative aspect-square">
                                            {item.type === 'image' ? (
                                                <img src={item.url} alt={`Preview ${index}`} className="w-full h-full object-cover rounded-lg" />
                                            ) : (
                                                <div className="w-full h-full relative">
                                                    <video src={item.url} className="w-full h-full object-cover rounded-lg" />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                        <VideoCameraIcon className="w-8 h-8 text-white" />
                                                    </div>
                                                </div>
                                            )}
                                            <button type="button" onClick={() => removeMedia(index)} className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white z-10">
                                                <XIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center justify-between mt-2 pl-16">
                                <div className="relative">
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
                                        className="text-[--primary-color] p-2 rounded-full hover:bg-[--primary-color]/10 transition-colors"
                                        title="Add Media"
                                        aria-label="Add media"
                                    >
                                        <PlusIcon className="w-6 h-6" />
                                    </button>
                                    {mediaOptionsOpen && (
                                        <div 
                                            className="absolute bottom-full left-0 mb-2 w-40 bg-[--card-color] border border-[--border-color] rounded-lg shadow-lg z-10"
                                            onMouseLeave={() => setMediaOptionsOpen(false)}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => imageInputRef.current?.click()}
                                                className="w-full flex items-center gap-3 px-4 py-2 text-left text-[--text-secondary] hover:bg-white/10 hover:text-white"
                                            >
                                                <ImageIcon className="w-5 h-5" />
                                                <span>Photo</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => videoInputRef.current?.click()}
                                                className="w-full flex items-center gap-3 px-4 py-2 text-left text-[--text-secondary] hover:bg-white/10 hover:text-white"
                                            >
                                                <VideoCameraIcon className="w-5 h-5" />
                                                <span>Video</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex items-center space-x-4">
                                    <span className={`text-sm ${remainingChars < 0 ? 'text-red-500' : 'text-[--text-secondary]'}`}>
                                        {remainingChars}
                                    </span>
                                    <button
                                        type="submit"
                                        disabled={(!newPostContent.trim() && media.length === 0) || remainingChars < 0}
                                        className="px-5 py-2 rounded-full text-sm font-semibold bg-[--primary-color] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Post
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                ) : (
                    <SignInToPost setView={setView} />
                )}

                {/* Feed */}
                <div className="space-y-4">
                    {posts.map(post => (
                       editingPostId === post.id ? (
                           <EditPostForm
                                key={post.id}
                                post={post}
                                onSave={handleSaveEdit}
                                onCancel={() => setEditingPostId(null)}
                           />
                       ) : (
                           <CommunityPostCard
                                key={post.id}
                                post={post}
                                onLike={onLike}
                                onRepost={onRepost}
                                // Fix: Pass a function that sets the editing post ID, which matches the expected (id: string) => void signature.
                                onEdit={setEditingPostId}
                                onVideoReply={handleVideoReply}
                                onReply={onReply}
                                currentUser={currentUser}
                                setView={setView}
                           />
                       )
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CommunityFeed;