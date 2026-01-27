import React, { useState } from 'react';
import { RentalPost, View } from '../types';
import { ArrowLeftIcon, ArrowRightIcon, LocationPinIcon, BookmarkIcon } from './icons';
import ImageContainer from './common/ImageContainer';
import { getImageUrl } from '../utils/imageUrlUtils';
import PremiumCard from './common/PremiumCard';

interface RentalCardProps {
  post: RentalPost & { distance?: number };
  onPostSelect: (post: RentalPost) => void;
  isSaved: boolean;
  onSaveToggle: (id: string) => void;
  layout?: 'grid' | 'feed';
  setView?: (view: View) => void;
}

const RentalCard: React.FC<RentalCardProps> = ({ post, onPostSelect, isSaved, onSaveToggle, layout = 'grid', setView }) => {
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

  return (
    <PremiumCard onClick={() => onPostSelect(post)} className={`group relative transition-transform duration-300 hover:scale-[1.02] cursor-pointer ${isGridLayout ? 'aspect-[4/5]' : 'md:h-64'
      }`}>
      <div className={`flex h-full w-full ${isGridLayout ? 'flex-col' : 'flex-col md:flex-row'}`}>
        <div className={`relative overflow-hidden ${isGridLayout ? 'w-full' : 'w-full md:w-64 h-48 md:h-full flex-shrink-0'
          }`}>
          {post.images.length > 0 ? (
            <ImageContainer
              src={getImageUrl(post.images[currentImage])}
              alt={post.title}
              aspectRatio="16:9"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center text-[--text-secondary]">No Image</div>
          )}

          {post.images.length > 1 && (
            <>
              <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRightIcon className="w-5 h-5" />
              </button>
            </>
          )}
          <div className="absolute top-2 right-2 z-20">
            <button
              onClick={handleSave}
              className={`p-2 rounded-full transition-all duration-300 ${isSaved ? 'bg-yellow-400 text-black scale-110' : 'bg-black/40 text-white'
                } hover:text-yellow-400 hover:bg-yellow-400/10 hover:scale-110`}
              aria-label={isSaved ? 'Unsave post' : 'Save post'}
            >
              <BookmarkIcon className="w-5 h-5" isFilled={isSaved} />
            </button>
          </div>
          <div className="absolute bottom-2 left-2 z-20 bg-[--primary-color] text-white text-xs font-semibold px-3 py-1 rounded-full">{post.category}</div>
        </div>
        <div className={`p-6 flex-1 flex flex-col justify-between relative z-10 ${!isGridLayout && 'md:p-8'}`}>
          <div>
            {/* Posted by username - clickable */}
            {post.createdBy && typeof post.createdBy === 'object' && (post.createdBy as any).username ? (
              <p className="text-sm font-semibold text-white/70 mb-1">
                Posted by{' '}
                <span
                  className="text-[#FF0000] hover:underline cursor-pointer"
                  onClick={handleUsernameClick}
                >
                  @{(post.createdBy as any).username}
                </span>
              </p>
            ) : (
              <p className="text-sm font-semibold text-white/90 mb-1">Community Member</p>
            )}
            <h3 className="font-bold text-lg truncate">{post.title}</h3>
            {post.description && (
              <p className="text-sm text-white/70 mb-2 line-clamp-1">
                {post.description.slice(0, 40)}{post.description.length > 40 ? '...' : ''}
              </p>
            )}
            <a
              href={`https://www.google.com/maps?q=${post.location.latitude},${post.location.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center text-sm text-[--text-secondary] mt-1 hover:text-[--primary-color] transition-colors w-fit"
            >
              <LocationPinIcon className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="truncate">{post.location.address}</span>
            </a>
          </div>
          <div className="flex justify-between items-end mt-2">
            <div>
              <p className="text-lg font-bold text-white">${post.price.toLocaleString()}<span className="text-sm font-normal text-[--text-secondary]">/mo</span></p>
              <p className="text-xs text-[--text-secondary]">{post.squareFeet.toLocaleString()} sqft</p>
            </div>
            <span className="text-xs text-[--text-secondary]">
              {post.distance !== undefined ? (
                <span className="font-bold text-[--primary-color]">{post.distance.toFixed(1)} km away</span>
              ) : (
                timeAgo(post.createdAt)
              )}
            </span>
          </div>
        </div>
      </div>
    </PremiumCard>
  );
};

export default RentalCard;