import React from 'react';
import { RentalPost, View } from '../types';
import { XIcon, LocationPinIcon, PhoneIcon, EnvelopeIcon, PencilIcon, ArrowLeftIcon, ArrowRightIcon, BuildingOfficeIcon } from './icons';

interface RentalDetailModalProps {
    post: RentalPost;
    onClose: () => void;
    onEdit: () => void;
    isOwner?: boolean;
    setView?: (view: View) => void;
}

const RentalDetailModal: React.FC<RentalDetailModalProps> = ({ post, onClose, onEdit, isOwner = false, setView }) => {
    const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

    const handlePrevImage = () => {
        setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : post.images.length - 1));
    };

    const handleNextImage = () => {
        setCurrentImageIndex(prev => (prev < post.images.length - 1 ? prev + 1 : 0));
    };

    const handleUsernameClick = () => {
        const createdBy = post.createdBy as any;
        if (createdBy?.username && setView) {
            localStorage.setItem('viewingUsername', createdBy.username);
            onClose();
            setView(View.PROFILE);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).toUpperCase();
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(price);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foundation/90 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white border border-ink w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col neo-shadow-lg animate-slide-up">
                
                {/* Header Controls */}
                <div className="flex items-center justify-between p-4 border-b border-ink bg-foundation/10 shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-accent-green rounded-full" />
                        <span className="text-[10px] font-mono tracking-widest uppercase opacity-50">Property Asset Specification</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {isOwner && (
                            <button 
                                onClick={onEdit}
                                className="neo-button py-2 px-4 text-xs font-bold"
                            >
                                <PencilIcon className="w-4 h-4 mr-2" /> MODIFY
                            </button>
                        )}
                        <button 
                            onClick={onClose}
                            className="w-10 h-10 border border-ink flex items-center justify-center hover:bg-foundation transition-all active:translate-y-px"
                        >
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto outline-none">
                    <div className="lg:flex lg:h-full">
                        {/* Image Gallery */}
                        <div className="lg:w-1/2 relative bg-foundation/30 border-b lg:border-b-0 lg:border-r border-ink flex items-center justify-center min-h-[300px] lg:min-h-0">
                            {post.images && post.images.length > 0 ? (
                                <>
                                    <img 
                                        src={post.images[currentImageIndex]} 
                                        alt={post.title} 
                                        className="w-full h-full object-cover grayscale-[0.1] hover:grayscale-0 transition-all"
                                    />
                                    {post.images.length > 1 && (
                                        <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 hover:opacity-100 transition-opacity">
                                            <button onClick={handlePrevImage} className="w-10 h-10 bg-white border border-ink flex items-center justify-center hover:bg-foundation active:translate-y-px">
                                                <ArrowLeftIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={handleNextImage} className="w-10 h-10 bg-white border border-ink flex items-center justify-center hover:bg-foundation active:translate-y-px">
                                                <ArrowRightIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                    <div className="absolute bottom-4 right-4 bg-white border border-ink px-3 py-1 font-mono text-[10px] font-bold">
                                        {currentImageIndex + 1} / {post.images.length}
                                    </div>
                                </>
                            ) : (
                                <div className="text-4xl font-serif-italic italic opacity-10 uppercase tracking-tighter">No Documentation</div>
                            )}
                            
                            <div className="absolute top-4 left-4 bg-accent-green text-white border border-ink px-4 py-1 text-[10px] font-bold font-mono tracking-widest uppercase">
                                Available Property
                            </div>
                        </div>

                        {/* Content Detail */}
                        <div className="lg:w-1/2 p-8 md:p-12 space-y-10">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="text-[10px] font-mono tracking-[0.3em] uppercase text-accent-green font-bold">{post.category}</div>
                                    <h2 className="text-4xl md:text-5xl font-serif-italic font-bold tracking-tight uppercase leading-[0.9]">{post.title}</h2>
                                </div>
                                <div className="flex items-center gap-6 pt-2 border-t border-ink/10">
                                    <div className="text-[10px] font-mono tracking-widest uppercase opacity-40">Listed: {formatDate(post.createdAt)}</div>
                                    {post.createdBy && typeof post.createdBy === 'object' && (post.createdBy as any).username && (
                                        <div 
                                            className="text-[10px] font-mono tracking-widest uppercase hover:text-accent-green cursor-pointer transition-colors font-bold"
                                            onClick={handleUsernameClick}
                                        >
                                            Source: @{(post.createdBy as any).username}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-px bg-ink border border-ink">
                                <div className="bg-white p-6">
                                    <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest mb-2">Monthly Rent</p>
                                    <p className="text-3xl font-serif-italic font-bold text-accent-green leading-none">{formatPrice(post.price)}</p>
                                </div>
                                <div className="bg-white p-6">
                                    <p className="text-[10px] font-mono opacity-40 uppercase tracking-widest mb-2">Total Area</p>
                                    <p className="text-3xl font-serif-italic font-bold leading-none">{post.squareFeet.toLocaleString()} <span className="text-xs font-mono opacity-40">SQFT</span></p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-[10px] font-mono tracking-[0.4em] uppercase opacity-40 font-bold border-b border-ink/10 pb-2">Asset Description</h3>
                                <p className="text-lg leading-relaxed font-medium opacity-80 break-words">
                                    {post.description}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-mono tracking-[0.4em] uppercase opacity-40 font-bold">Geospatial Data</h3>
                                    <div className="flex items-start gap-3">
                                        <LocationPinIcon className="w-5 h-5 text-accent-green flex-shrink-0" />
                                        <span className="text-sm font-bold uppercase tracking-tight leading-tight">{post.location.address}</span>
                                    </div>
                                </div>

                                { (post.phone || post.email) && (
                                    <div className="space-y-3">
                                        <h3 className="text-[10px] font-mono tracking-[0.4em] uppercase opacity-40 font-bold">Direct Channels</h3>
                                        <div className="space-y-2">
                                            {post.phone && (
                                                <div className="flex items-center gap-3">
                                                    <PhoneIcon className="w-4 h-4 opacity-40" />
                                                    <span className="text-sm font-mono">{post.phone}</span>
                                                </div>
                                            )}
                                            {post.email && (
                                                <div className="flex items-center gap-3">
                                                    <EnvelopeIcon className="w-4 h-4 opacity-40" />
                                                    <span className="text-sm font-mono truncate max-w-[150px]">{post.email}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-10 border-t border-ink flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 px-6 py-3 bg-foundation border border-ink">
                                        <BuildingOfficeIcon className="w-4 h-4" />
                                        <span className="font-mono font-bold tracking-widest text-[10px] uppercase">Commercial Hub</span>
                                    </div>
                                    {post.openToCollaboration && (
                                        <div className="text-[10px] font-mono tracking-widest uppercase font-bold text-accent-green border border-accent-green/20 px-4 py-3 bg-accent-green/5">
                                            Direct Collab Ready
                                        </div>
                                    )}
                                </div>
                                <button onClick={onClose} className="text-[10px] font-mono tracking-widest uppercase opacity-40 hover:opacity-100 hover:text-accent-green flex items-center gap-2 transition-all group">
                                    Back to Index
                                    <ArrowRightIcon className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RentalDetailModal;
