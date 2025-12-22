import React from 'react';
import { DemandPost } from '../types';
import { XIcon, LocationPinIcon, PhoneIcon, EnvelopeIcon, SparklesIcon, HeartIcon, PencilIcon, ArrowLeftIcon, ChevronUpIcon } from './icons';

interface DemandDetailModalProps {
    post: DemandPost;
    onClose: () => void;
    onEdit: () => void;
    isOwner?: boolean;
}

const DemandDetailModal: React.FC<DemandDetailModalProps> = ({ post, onClose, onEdit, isOwner = true }) => {
    const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

    const handlePrevImage = () => {
        setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : post.images.length - 1));
    };

    const handleNextImage = () => {
        setCurrentImageIndex(prev => (prev < post.images.length - 1 ? prev + 1 : 0));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="fixed top-16 left-0 right-0 bottom-0 z-40 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in p-4">
            <div className="relative w-full max-w-4xl max-h-[calc(100vh-5rem)] bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-scale-up flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                        <span className="font-medium">Back to Profile</span>
                    </button>

                    <div className="flex items-center gap-3">
                        {isOwner && (
                            <button
                                onClick={onEdit}
                                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                            >
                                <PencilIcon className="w-4 h-4" />
                                <span className="text-sm font-medium">Edit</span>
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        >
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto">
                    <div className="md:flex">
                        {/* Image Section */}
                        {post.images && post.images.length > 0 && (
                            <div className="md:w-1/2 relative bg-black flex items-center justify-center">
                                <img
                                    src={post.images[currentImageIndex]}
                                    alt={post.title}
                                    className="w-full h-64 md:h-96 object-cover"
                                />

                                {/* Image Navigation */}
                                {post.images.length > 1 && (
                                    <>
                                        <button
                                            onClick={handlePrevImage}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
                                        >
                                            <ChevronUpIcon className="w-5 h-5 -rotate-90" />
                                        </button>
                                        <button
                                            onClick={handleNextImage}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
                                        >
                                            <ChevronUpIcon className="w-5 h-5 rotate-90" />
                                        </button>

                                        {/* Image Indicators */}
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                                            {post.images.map((_, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setCurrentImageIndex(idx)}
                                                    className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex
                                                        ? 'bg-white w-4'
                                                        : 'bg-white/50 hover:bg-white/75'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}

                                {/* Badge */}
                                <div className="absolute top-4 left-4 bg-[--primary-color] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                    Demand
                                </div>
                            </div>
                        )}

                        {/* Details Section */}
                        <div className={`${post.images && post.images.length > 0 ? 'md:w-1/2' : 'w-full'} p-6 space-y-6`}>
                            {/* Title & Category */}
                            <div>
                                <div className="flex items-start justify-between gap-4 mb-2">
                                    <h2 className="text-2xl font-bold text-white">{post.title}</h2>
                                    <div className="bg-blue-500/10 text-blue-400 text-xs font-bold px-3 py-1 rounded-lg border border-blue-500/20 whitespace-nowrap">
                                        {post.category}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <SparklesIcon className="w-4 h-4" />
                                    <span>Posted on {formatDate(post.createdAt)}</span>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</h3>
                                <p className="text-gray-300 leading-relaxed">{post.description}</p>
                            </div>

                            {/* Location */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Location</h3>
                                <div className="flex items-center gap-2 text-white">
                                    <LocationPinIcon className="w-5 h-5 text-[--primary-color]" />
                                    <span>{post.location.address}</span>
                                </div>
                            </div>

                            {/* Contact Info */}
                            {(post.phone || post.email) && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Contact</h3>
                                    <div className="space-y-2">
                                        {post.phone && (
                                            <div className="flex items-center gap-2 text-white">
                                                <PhoneIcon className="w-5 h-5 text-green-500" />
                                                <a href={`tel:${post.phone}`} className="hover:text-[--primary-color] transition-colors">{post.phone}</a>
                                            </div>
                                        )}
                                        {post.email && (
                                            <div className="flex items-center gap-2 text-white">
                                                <EnvelopeIcon className="w-5 h-5 text-blue-500" />
                                                <a href={`mailto:${post.email}`} className="hover:text-[--primary-color] transition-colors">{post.email}</a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Stats */}
                            <div className="flex items-center gap-6 pt-4 border-t border-white/10">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <HeartIcon className="w-5 h-5 text-[--primary-color]" />
                                    <span className="font-medium">{post.upvotes} Upvotes</span>
                                </div>

                                {post.openToCollaboration && (
                                    <div className="bg-green-500/10 text-green-400 text-xs font-semibold px-3 py-1 rounded-lg border border-green-500/20">
                                        Open to Collaboration
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DemandDetailModal;
