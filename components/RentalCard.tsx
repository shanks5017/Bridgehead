import React, { useState } from 'react';
import { RentalPost } from '../types';
import { ArrowLeftIcon, ArrowRightIcon, LocationPinIcon, BookmarkIcon } from './icons';

interface RentalCardProps {
  post: RentalPost & { distance?: number };
  onPostSelect: (post: RentalPost) => void;
  isSaved: boolean;
  onSaveToggle: (id: string) => void;
  layout?: 'grid' | 'feed';
}

const RentalCard: React.FC<RentalCardProps> = ({ post, onPostSelect, isSaved, onSaveToggle, layout = 'grid' }) => {
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
    <div onClick={() => onPostSelect(post)} className={`w-full bg-[--card-color] rounded-xl overflow-hidden flex group relative transition-transform duration-300 hover:scale-[1.02] cursor-pointer ${
      isGridLayout ? 'aspect-[4/5] flex-col' : 'flex-col md:flex-row md:h-64 border border-[--border-color]'
    }`}>
      <div className={`relative ${
        isGridLayout ? 'w-full h-2/3' : 'w-full md:w-64 h-48 md:h-full flex-shrink-0'
      }`}>
        {post.images.length > 0 ? (
          <img src={post.images[currentImage]} alt={post.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-700 flex items-center justify-center text-[--text-secondary]">No Image</div>
        )}

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
        <div className="absolute top-2 right-2">
            <button
                onClick={handleSave}
                className={`p-2 rounded-full transition-all duration-300 ${
                    isSaved ? 'bg-yellow-400 text-black scale-110' : 'bg-black/40 text-white'
                } hover:text-yellow-400 hover:bg-yellow-400/10 hover:scale-110`}
                aria-label={isSaved ? 'Unsave post' : 'Save post'}
            >
                <BookmarkIcon className="w-5 h-5" isFilled={isSaved} />
            </button>
        </div>
        <div className="absolute bottom-2 left-2 bg-[--primary-color] text-white text-xs font-semibold px-2 py-1 rounded-md">{post.category}</div>
      </div>
      <div className={`p-4 flex-1 flex flex-col justify-between ${!isGridLayout && 'md:p-6'}`}>
        <div>
          <h3 className="font-bold text-lg truncate">{post.title}</h3>
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
  );
};

export default RentalCard;