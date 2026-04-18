import React, { useState } from 'react';
import { DemandPost, View } from '../types';
import { ArrowLeftIcon, LocationPinIcon, UpvoteIcon, ChatBubbleLeftRightIcon, PhoneIcon, EnvelopeIcon } from './icons';
import { getImageUrl } from '../utils/imageUrlUtils';

interface DemandDetailProps {
  post: DemandPost;
  onBack: () => void;
  onViewDemand: () => void;
  onImageClick: (images: string[], index: number) => void;
  onStartCollaboration: (post: DemandPost) => void;
  setView?: (view: View) => void;
}

const DemandDetail: React.FC<DemandDetailProps> = ({ post, onBack, onImageClick, onStartCollaboration, setView }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const mapSrc = `https://maps.google.com/maps?q=${post.location.latitude},${post.location.longitude}&z=15&output=embed`;

  const handleUsernameClick = () => {
    const createdBy = post.createdBy as any;
    if (createdBy?.username && setView) {
      localStorage.setItem('viewingUsername', createdBy.username);
      setView(View.PROFILE);
    }
  };

  return (
    <div className="min-h-screen bg-foundation/50 pb-20 overflow-x-hidden">
      {/* Top Protocol Bar (Sticky Nav) */}
      <div className="sticky top-20 z-30 bg-white border-b-2 border-ink px-6 md:px-12 py-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="neo-button group flex items-center gap-3 active:translate-y-0.5"
        >
          <ArrowLeftIcon className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-bold tracking-tight">BACK TO NETWORK</span>
        </button>

        <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2">
                <span className="w-2 h-2 bg-accent-green rounded-full animate-pulse" />
                <span className="text-[10px] font-mono tracking-widest uppercase opacity-60">SIGNAL ACTIVE // ID: {post.id.substring(0, 8)}</span>
            </div>
            <button 
                onClick={() => onStartCollaboration(post)}
                className="neo-button-primary neo-button px-8"
            >
                INITIATE
            </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 md:px-12 mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* LEFT: SIGNAL INTELLIGENCE (8/12) */}
          <div className="lg:col-span-8 space-y-12 animate-slide-up">
            
            {/* Title & Stats Block */}
            <div className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <span className="bg-ink text-foundation px-3 py-1 text-[10px] font-mono tracking-[0.2em] font-bold">
                    [ {post.category.toUpperCase()} ]
                </span>
                <span className="bg-accent-green/10 text-accent-green border border-accent-green/20 px-3 py-1 text-[10px] font-mono tracking-[0.2em] font-bold flex items-center gap-2">
                    <UpvoteIcon className="w-3 h-3" />
                    {post.upvotes} UPVOTES detected
                </span>
                <span className="bg-white border border-ink/10 px-3 py-1 text-[10px] font-mono tracking-[0.2em] opacity-40 font-bold">
                    SIGNAL EMITTED: {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-serif-italic font-extrabold tracking-tighter leading-[0.85] uppercase max-w-3xl">
                {post.title}
              </h1>
            </div>

            {/* Gallery Viewport */}
            <div className="space-y-4 group">
              <div 
                className="neo-border neo-shadow-md bg-white aspect-video relative overflow-hidden cursor-pointer"
                onClick={() => post.images.length > 0 && onImageClick(post.images.map(getImageUrl), currentImageIndex)}
              >
                {post.images.length > 0 ? (
                  <img 
                    src={getImageUrl(post.images[currentImageIndex])} 
                    alt={post.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-serif-italic text-4xl opacity-10 uppercase tracking-tighter">
                    NO SIGNAL VISUALS
                  </div>
                )}
                
                {/* Image Counter Overlay */}
                {post.images.length > 0 && (
                  <div className="absolute bottom-6 right-6 bg-ink text-foundation px-4 py-2 font-mono text-xs neo-border shadow-[4px_4px_0px_#22C55E]">
                    FRAME: 0{currentImageIndex + 1} / 0{post.images.length}
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {post.images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                  {post.images.map((img, index) => (
                    <button 
                        key={index} 
                        onClick={() => setCurrentImageIndex(index)} 
                        className={`flex-shrink-0 w-24 h-16 neo-border transition-all transition-duration-300 ${currentImageIndex === index ? 'neo-shadow-sm translate-y-[-4px] translate-x-[-4px] border-accent-green' : 'opacity-40 hover:opacity-100 hover:translate-y-[-2px]'}`}
                    >
                      <img src={getImageUrl(img)} alt={`Frame ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* In-depth Intelligence Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-ink/10">
                <div className="space-y-4">
                    <h3 className="text-[10px] font-mono tracking-[0.3em] opacity-40 font-bold uppercase">Signal Breakdown</h3>
                    <p className="text-xl leading-relaxed font-medium opacity-80 whitespace-pre-wrap">
                        {post.description}
                    </p>
                </div>
                
                <div className="space-y-8">
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-mono tracking-[0.3em] opacity-40 font-bold uppercase">Engagement Matrix</h3>
                        <div className="bg-white border border-ink p-6 neo-shadow-sm space-y-6">
                            {post.openToCollaboration ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-accent-green text-white">
                                            <ChatBubbleLeftRightIcon className="w-5 h-5" />
                                        </div>
                                        <span className="font-bold text-sm tracking-tight uppercase">Collaboration Link Active</span>
                                    </div>
                                    <p className="text-xs opacity-60 leading-normal">
                                        This signal source is hunting for strategic partners. Initiate secure link below to proceed.
                                    </p>
                                    <button 
                                        onClick={() => onStartCollaboration(post)}
                                        className="w-full neo-button-primary neo-button h-12"
                                    >
                                        ESTABLISH SESSION
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 opacity-40 grayscale">
                                    <div className="p-2 bg-ink text-foundation">
                                        <ChatBubbleLeftRightIcon className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-sm tracking-tight uppercase">Engagement Restricted</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {(post.email || post.phone) && (
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-mono tracking-[0.3em] opacity-40 font-bold uppercase">External Comms</h3>
                            <div className="bg-foundation border border-ink p-6 space-y-4">
                                {post.email && (
                                    <a href={`mailto:${post.email}`} className="flex items-center gap-3 hover:text-accent-green transition-colors group">
                                        <EnvelopeIcon className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                                        <span className="text-sm font-mono lowercase truncate">{post.email}</span>
                                    </a>
                                )}
                                {post.phone && (
                                    <a href={`tel:${post.phone}`} className="flex items-center gap-3 hover:text-accent-green transition-colors group">
                                        <PhoneIcon className="w-4 h-4 opacity-40 group-hover:opacity-100" />
                                        <span className="text-sm font-mono truncate">{post.phone}</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
          </div>

          {/* RIGHT: STRATEGIC CONTEXT (4/12) */}
          <aside className="lg:col-span-4 space-y-8 sticky top-[180px] self-start animate-slide-up stagger-1">
            
            {/* Maps Intel Module */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-mono tracking-[0.3em] opacity-40 font-bold uppercase">Strategic Location</h3>
                <div className="bg-white neo-border neo-shadow-md overflow-hidden">
                    <div className="p-4 bg-ink/5 border-b border-ink flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <LocationPinIcon className="w-3 h-3 text-accent-green" />
                            <span className="text-[10px] font-mono font-bold tracking-widest uppercase">Coordinates Lock</span>
                        </div>
                        <span className="text-[8px] font-mono opacity-40">LAT: {post.location.latitude.toFixed(4)} // LNG: {post.location.longitude.toFixed(4)}</span>
                    </div>
                    <div className="h-96 md:h-[500px] w-full bg-foundation/20">
                        <iframe
                            title="Strategic Map Viewport"
                            src={mapSrc}
                            width="100%"
                            height="100%"
                            style={{ border: 0, filter: 'grayscale(0.6) contrast(1.1)' }}
                            allowFullScreen={false}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                    </div>
                    <div className="p-4 flex items-center justify-between gap-4">
                        <p className="text-[10px] font-mono font-bold uppercase tracking-tight truncate flex-1">{post.location.address}</p>
                        <a 
                            href={`https://www.google.com/maps?q=${post.location.latitude},${post.location.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-foundation p-2 neo-border hover:bg-white active:translate-y-px transition-all"
                        >
                            <ArrowLeftIcon className="w-3 h-3 rotate-[135deg]" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Signal Source Box */}
            <div className="space-y-4 pt-4">
                <h3 className="text-[10px] font-mono tracking-[0.3em] opacity-40 font-bold uppercase">Signal Source</h3>
                <div className="bg-white border-2 border-ink p-6 neo-shadow-sm hover:neo-shadow-md transition-all group cursor-pointer" onClick={handleUsernameClick}>
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 neo-border bg-foundation overflow-hidden">
                            {(post.createdBy as any)?.profilePicture ? (
                                <img src={(post.createdBy as any).profilePicture} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center font-serif-italic text-2xl font-bold opacity-20 uppercase">
                                    {(post.createdBy as any)?.username?.[0] || 'N'}
                                </div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-xl font-serif-italic font-bold tracking-tight lowercase truncate group-hover:text-accent-green transition-colors">
                                @{(post.createdBy as any)?.username || 'unidentified_node'}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="text-[10px] font-mono tracking-widest opacity-40 uppercase">Node Reputation</div>
                                <div className="text-[10px] font-mono font-bold text-accent-green">{(post.createdBy as any)?.reputation || '0.98'}</div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-ink/10 flex items-center justify-between">
                        <span className="text-[8px] font-mono opacity-40 uppercase tracking-widest">Protocol Verified Entrepreneur</span>
                        <div className="w-2 h-2 bg-accent-green rotate-45" />
                    </div>
                </div>
            </div>

            {/* Auxiliary Actions */}
            <div className="grid grid-cols-2 gap-4">
                <button className="neo-button text-[10px] tracking-widest font-mono uppercase bg-foundation/30">Bookmark</button>
                <button className="neo-button text-[10px] tracking-widest font-mono uppercase bg-foundation/30">Share Intel</button>
            </div>
            
          </aside>
        </div>
      </main>
    </div>
  );
};

export default DemandDetail;
