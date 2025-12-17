import React, { useState } from 'react';
import { DemandPost } from '../types';
import { ArrowLeftIcon, ArrowRightIcon, LocationPinIcon, HeartIcon, BookmarkIcon } from './icons';
import { getImageUrl } from '../utils/imageUrlUtils';
import { sanitizeLocation } from '../utils/locationUtils';
import ImageContainer from './common/ImageContainer';

interface DemandCardProps {
  post: DemandPost & { distance?: number };
  onPostSelect: (post: DemandPost) => void;
  onUpvote: (id: string) => void;
  isSaved: boolean;
  onSaveToggle: (id: string) => void;
  layout?: 'grid' | 'feed';
}

const DemandCard: React.FC<DemandCardProps> = ({ post, onPostSelect, onUpvote, isSaved, onSaveToggle, layout = 'grid' }) => {
  const [currentImage, setCurrentImage] = useState(0);

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImage(i => (i === 0 ? post.images.length - 1 : i - 1));
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImage(i => (i === post.images.length - 1 ? 0 : i + 1));
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpvote(post.id);
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSaveToggle(post.id);
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  const isGridLayout = layout === 'grid';

  // Dynamic rendering: Text-only post (Twitter-style) vs Image post (Instagram-style)
  const hasImages = post.images.length > 0;

  return (
    <div
      onClick={() => onPostSelect(post)}
      className={`w-full bg-[--card-color] rounded-xl overflow-hidden flex group relative transition-all duration-300 hover:scale-[1.02] cursor-pointer shadow-[0_4px_24px_rgba(255,0,0,0.15)] hover:shadow-[0_8px_40px_rgba(255,0,0,0.25)] ${isGridLayout
        ? hasImages ? 'aspect-[4/5] flex-col' : 'aspect-auto flex-col' // Text-only: auto height
        : 'flex-col md:flex-row md:h-64 border border-[--border-color]'
        }`}
    >
      {hasImages && (
        <div className={`relative ${isGridLayout ? 'w-full h-2/3' : 'w-full md:w-64 h-48 md:h-full flex-shrink-0'}`}>
          <ImageContainer
            src={getImageUrl(post.images[currentImage])}
            alt={post.title}
            aspectRatio="4:3"
            className="w-full"
          />

          {post.images.length > 1 && (
            <>
              <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRightIcon className="w-5 h-5" />
              </button>
            </>
          )}
          <div className="absolute bottom-2 left-2 bg-[--primary-color] text-white text-xs font-semibold px-2 py-1 rounded-md">{post.category}</div>
        </div>
      )}
      <div className={`p-4 flex-1 flex flex-col justify-between ${!isGridLayout && 'md:p-6'}`}>
        <div>
          {/* Username - placeholder for now */}
          <p className="text-sm font-semibold text-white/90 mb-1">Community Member</p>
          {/* Title - increased hierarchy */}
          <h3 className="font-bold text-xl text-white mb-1 truncate">{post.title}</h3>
          {/* Description preview */}
          {post.description && (
            <p className="text-sm text-white/70 mb-2 line-clamp-1">
              {post.description.slice(0, 40)}{post.description.length > 40 ? '...' : ''}
            </p>
          )}
          {/* Location - sanitized format */}
          <a
            href={`https://www.google.com/maps?q=${post.location.latitude},${post.location.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center text-xs text-[--text-secondary] hover:text-[--primary-color] transition-colors w-fit"
          >
            <LocationPinIcon className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">{sanitizeLocation(post.location)}</span>
          </a>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-[--text-secondary]">
            {post.distance !== undefined ? (
              <span className="font-bold text-[--primary-color]">{post.distance.toFixed(1)} km away</span>
            ) : (
              timeAgo(post.createdAt)
            )}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleSave}
              className={`p-2 rounded-full transition-all duration-300 ${isSaved ? 'text-white scale-110' : 'text-[--text-secondary]'
                } hover:text-white hover:bg-white/10`}
              aria-label={isSaved ? 'Unsave post' : 'Save post'}
            >
              <BookmarkIcon className="w-5 h-5" isFilled={isSaved} />
            </button>
            <button
              onClick={handleLike}
              className="flex items-center gap-1.5 text-sm font-semibold transition-all duration-300 ease-out rounded-full px-3 py-1 bg-white/5 hover:bg-[#FF0000]/10"
              style={{ color: post.upvotes > 0 ? '#FF0000' : 'var(--text-secondary)' }}
            >
              <HeartIcon className="w-4 h-4" isFilled={post.upvotes > 0} />
              {post.upvotes}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemandCard;