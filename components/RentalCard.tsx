import React, { useState } from 'react';
import { RentalPost, View } from '../types';
import { ArrowLeftIcon, ArrowRightIcon, LocationPinIcon, BookmarkIcon, HeartIcon } from './icons';
import { getImageUrl } from '../utils/imageUrlUtils';

interface RentalCardProps {
  post: RentalPost & { distance?: number };
  onPostSelect: (post: RentalPost) => void;
  isSaved: boolean;
  onSaveToggle: (id: string) => void;
  layout?: 'grid' | 'feed';
  setView?: (view: View) => void;
  className?: string;
  userId?: string;
  onUpvote?: (id: string) => void;
}

const RentalCard: React.FC<RentalCardProps> = ({ post, onPostSelect, isSaved, onSaveToggle, setView, className = '', userId, onUpvote }) => {
  const [currentImage, setCurrentImage] = useState(0);

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImage(i => (i === 0 ? post.images.length - 1 : i - 1));
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImage(i => (i === post.images.length - 1 ? 0 : i + 1));
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSaveToggle(post.id);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpvote) onUpvote(post.id);
  };

  const handleUsernameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const createdBy = post.createdBy as any;
    if (createdBy?.username && setView) {
      localStorage.setItem('viewingUsername', createdBy.username);
      setView(View.PROFILE);
    }
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "Y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "MO";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "D";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "H";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "M";
    return Math.floor(seconds) + "S";
  };

  const hasImages = post.images && post.images.length > 0;

  return (
    <div 
      onClick={() => onPostSelect(post)}
      className={`bg-white border border-ink group cursor-pointer transition-all hover:neo-shadow-md animate-slide-up flex flex-col ${className}`}
    >
      {/* Header Info */}
      <div className="p-4 border-b border-ink flex items-center justify-between bg-foundation/30">
        <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-accent-blue rounded-full animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest uppercase opacity-60">Property Active</span>
        </div>
        <div className="text-[10px] font-mono tracking-widest uppercase opacity-60">
            {timeAgo(post.createdAt)}
        </div>
      </div>

      {/* Image Section */}
      {hasImages ? (
        <div className="relative aspect-video overflow-hidden border-b border-ink group-hover:bg-foundation/10 transition-colors">
          <img 
            src={getImageUrl(post.images[currentImage])} 
            alt={post.title} 
            className="w-full h-full object-cover grayscale-[0.2] transition-all group-hover:grayscale-0 group-hover:scale-105"
          />
          
          {post.images.length > 1 && (
            <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={prevImage} className="w-8 h-8 bg-white border border-ink flex items-center justify-center hover:bg-foundation active:translate-y-px">
                  <ArrowLeftIcon className="w-4 h-4" />
               </button>
               <button onClick={nextImage} className="w-8 h-8 bg-white border border-ink flex items-center justify-center hover:bg-foundation active:translate-y-px">
                  <ArrowRightIcon className="w-4 h-4" />
               </button>
            </div>
          )}

          <div className="absolute top-2 right-2 flex gap-2">
            <button 
                onClick={handleSave}
                className={`p-2 border border-ink transition-all ${isSaved ? 'bg-accent-blue text-white' : 'bg-white text-ink hover:bg-foundation'}`}
            >
                <BookmarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="aspect-[2/1] bg-foundation border-b border-ink flex items-center justify-center italic opacity-20 text-4xl font-serif">
            {post.category.split(' ')[0]}
        </div>
      )}

      {/* Content Section */}
      <div className="p-6 flex-grow space-y-4">
        <div>
           <div className="flex justify-between items-start mb-1">
             <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-accent-green">{post.category}</div>
             <div className="text-lg font-bold font-mono tracking-tight">${post.price.toLocaleString()}<span className="text-[10px] opacity-40">/MO</span></div>
           </div>
           <h3 className="text-2xl font-serif-italic font-bold tracking-tight uppercase leading-none group-hover:text-accent-green transition-colors">
             {post.title}
           </h3>
        </div>

        {post.description && (
          <p className="text-sm opacity-70 line-clamp-1 leading-relaxed">
            {post.description}
          </p>
        )}

        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase opacity-60">
               <LocationPinIcon className="w-3 h-3" />
               <span className="truncate max-w-[120px]">{post.location.address}</span>
           </div>
           <div className="text-[10px] font-mono tracking-widest uppercase opacity-40">
               {post.squareFeet.toLocaleString()} SQFT
           </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-ink flex items-center justify-between bg-foundation/10">
        <div className="flex items-center gap-3">
          {post.createdBy && typeof post.createdBy === 'object' && (post.createdBy as any).username ? (
            <div 
                className="flex items-center gap-2 group/user cursor-pointer"
                onClick={handleUsernameClick}
            >
              <div className="w-6 h-6 neo-border bg-white flex items-center justify-center overflow-hidden">
                {(post.createdBy as any).profilePicture ? (
                    <img src={(post.createdBy as any).profilePicture} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-[10px] font-bold">{(post.createdBy as any).username[0].toUpperCase()}</span>
                )}
              </div>
              <span className="text-[10px] font-mono hover:text-accent-green transition-colors">@{(post.createdBy as any).username}</span>
            </div>
          ) : (
            <span className="text-[10px] font-mono opacity-60 uppercase tracking-widest">Property Owner</span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-[10px] font-mono tracking-widest uppercase opacity-40">
               {post.distance !== undefined ? `${post.distance.toFixed(1)}KM` : 'NEARBY'}
          </div>
          
          <button 
            onClick={handleLike}
            className={`flex items-center gap-2 px-3 py-1 border border-ink transition-all ${userId && post.upvotedBy?.includes(userId) ? 'bg-accent-green text-white shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'bg-white text-ink hover:bg-foundation'}`}
          >
            <HeartIcon className={`w-3 h-3 ${userId && post.upvotedBy?.includes(userId) ? 'fill-current' : ''}`} />
            <span className="text-xs font-bold">{post.upvotes || 0}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(RentalCard);