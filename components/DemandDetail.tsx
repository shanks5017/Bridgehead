
import React, { useState } from 'react';
import { DemandPost } from '../types';
import { ArrowLeftIcon, ArrowRightIcon, LocationPinIcon, UpvoteIcon, ChatBubbleLeftRightIcon, PhoneIcon } from './icons';
import { EnvelopeIcon } from './icons';
import { getImageUrl } from '../utils/imageUrlUtils';

interface DemandDetailProps {
  post: DemandPost;
  onBack: () => void;
  onViewDemand: () => void;
  onImageClick: (images: string[], index: number) => void;
  onStartCollaboration: (post: DemandPost) => void;
}

const DemandDetail: React.FC<DemandDetailProps> = ({ post, onBack, onViewDemand, onImageClick, onStartCollaboration }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const mapSrc = `https://maps.google.com/maps?q=${post.location.latitude},${post.location.longitude}&z=15&output=embed`;

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Navigation Buttons - Sidebar Style */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={onBack}
            className="group relative flex items-center gap-2 px-5 py-2.5 rounded-full text-base font-medium transition-all duration-300 overflow-hidden text-white shadow-xl shadow-red-500/50"
            style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #dc2626 100%)',
            }}
          >
            {/* Glow effect on hover */}
            <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl bg-red-500/30" />
            {/* Icon with animation */}
            <div className="relative z-10 transform transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3">
              <ArrowLeftIcon className="w-5 h-5" />
            </div>
            {/* Text with smooth transition */}
            <span className="relative z-10 transform transition-all duration-300 group-hover:-translate-x-0.5">Back to Feed</span>
            {/* Shine effect */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-shine" />
            </div>
          </button>

          <button
            onClick={onViewDemand}
            className="group relative flex items-center gap-2 px-5 py-2.5 rounded-full text-base font-medium transition-all duration-300 overflow-hidden text-white shadow-xl shadow-red-500/50"
            style={{
              background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #dc2626 100%)',
            }}
          >
            {/* Glow effect on hover */}
            <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl bg-red-500/30" />
            {/* Text with smooth transition */}
            <span className="relative z-10 transform transition-all duration-300 group-hover:translate-x-0.5">View Demand</span>
            {/* Icon with animation */}
            <div className="relative z-10 transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
              <ArrowRightIcon className="w-5 h-5" />
            </div>
            {/* Shine effect */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-shine" />
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column: Images and Details */}
          <div className="space-y-6">
            {/* Image Gallery */}
            <div>
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-[--card-color] border border-[--border-color] cursor-pointer" onClick={() => post.images.length > 0 && onImageClick(post.images.map(getImageUrl), currentImageIndex)}>
                {post.images.length > 0 ? (
                  <img src={getImageUrl(post.images[currentImageIndex])} alt={post.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[--text-secondary]">No Image</div>
                )}
              </div>
              {post.images.length > 1 && (
                <div className="flex space-x-2 mt-3 overflow-x-auto hide-scrollbar pb-2">
                  {post.images.map((img, index) => (
                    <button key={index} onClick={() => setCurrentImageIndex(index)} className={`flex-shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 ${currentImageIndex === index ? 'border-[--primary-color]' : 'border-transparent'}`}>
                      <img src={getImageUrl(img)} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              <span className="text-sm font-bold uppercase tracking-widest text-[--primary-color]">{post.category}</span>
              <h1 className="text-4xl font-extrabold my-2">{post.title}</h1>
              <a
                href={`https://www.google.com/maps?q=${post.location.latitude},${post.location.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-lg text-[--text-secondary] mt-1 hover:text-[--primary-color] transition-colors w-fit"
              >
                <LocationPinIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                <span className="truncate">{post.location.address}</span>
              </a>
              <div className="flex items-center gap-1.5 text-lg font-semibold text-[--text-secondary] mt-4">
                <UpvoteIcon className="w-5 h-5 text-[--primary-color]" />
                {post.upvotes} Upvotes
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-2">Description</h2>
              <p className="text-[--text-secondary] leading-relaxed whitespace-pre-wrap">{post.description}</p>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">Contact & Collaboration</h2>
              <div className="space-y-4">
                {post.openToCollaboration ? (
                  <div className="bg-white/5 p-4 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">This user is open to collaboration!</p>
                      <p className="text-sm text-[--text-secondary]">Start a conversation to discuss this demand.</p>
                    </div>
                    <button
                      onClick={() => onStartCollaboration(post)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[--primary-color] text-white hover:opacity-90 transition-opacity"
                    >
                      <ChatBubbleLeftRightIcon className="w-5 h-5" />
                      Message
                    </button>
                  </div>
                ) : (
                  <div className="bg-white/5 p-4 rounded-lg">
                    <p className="font-semibold text-white">Collaboration</p>
                    <p className="text-sm text-[--text-secondary]">This user is not currently looking for collaborators.</p>
                  </div>
                )}

                {(post.email || post.phone) && (
                  <div className="bg-white/5 p-4 rounded-lg space-y-3">
                    {post.email && (
                      <div className="flex items-center gap-3">
                        <EnvelopeIcon className="w-5 h-5 text-[--text-secondary]" />
                        <a href={`mailto:${post.email}`} className="text-white hover:underline">{post.email}</a>
                      </div>
                    )}
                    {post.phone && (
                      <div className="flex items-center gap-3">
                        <PhoneIcon className="w-5 h-5 text-[--text-secondary]" />
                        <a href={`tel:${post.phone}`} className="text-white hover:underline">{post.phone}</a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Map */}
          <div className="h-96 md:h-full w-full rounded-xl overflow-hidden border border-[--border-color]">
            <iframe
              title="Location Map"
              src={mapSrc}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemandDetail;
