

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { DemandPost } from '../types';
import DemandCard from './DemandCard';
import { EmptyState } from './LandingPages';
import { SearchIcon, ArrowLeftIcon, ArrowRightIcon, LocationPinIcon, LoadingSpinner, BookmarkIcon } from './icons';
import HeroAnimation from './HeroAnimation';
import { getImageUrl } from '../utils/imageUrlUtils';

interface DemandFeedProps {
    posts: DemandPost[];
    onPostSelect: (post: DemandPost) => void;
    onUpvote: (id: string) => void;
    savedPostIds: string[];
    onSaveToggle: (id: string) => void;
}

const haversineDistance = (
    coords1: { latitude: number; longitude: number },
    coords2: { latitude: number; longitude: number }
): number => {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371; // Earth radius in km

    const dLat = toRad(coords2.latitude - coords1.latitude);
    const dLon = toRad(coords2.longitude - coords1.longitude);
    const lat1 = toRad(coords1.latitude);
    const lat2 = toRad(coords2.latitude);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

interface CategoryRowProps {
    title: string;
    posts: DemandPost[];
    onPostSelect: (post: DemandPost) => void;
    onUpvote: (id: string) => void;
    onSaveToggle: (id: string) => void;
    savedPostIds: string[];
}

const CategoryRow: React.FC<CategoryRowProps> = ({ title, posts, onPostSelect, onUpvote, onSaveToggle, savedPostIds }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScrollability = useCallback(() => {
        const el = scrollContainerRef.current;
        if (el) {
            const hasOverflow = el.scrollWidth > el.clientWidth;
            setCanScrollLeft(el.scrollLeft > 0);
            setCanScrollRight(hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
        }
    }, []);

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (el) {
            checkScrollability();
            el.addEventListener('scroll', checkScrollability, { passive: true });
            window.addEventListener('resize', checkScrollability);
        }
        return () => {
            if (el) {
                el.removeEventListener('scroll', checkScrollability);
                window.removeEventListener('resize', checkScrollability);
            }
        };
    }, [checkScrollability, posts]);

    const scroll = (direction: 'left' | 'right') => {
        const el = scrollContainerRef.current;
        if (el) {
            const scrollAmount = el.clientWidth * 0.8;
            el.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (posts.length === 0) return null;

    return (
        <div className="mb-12">
            <h2 className="text-3xl font-bold mb-4 px-4 sm:px-6 lg:px-8">{title}</h2>
            <div className="relative group">
                {canScrollLeft && (
                    <button
                        onClick={() => scroll('left')}
                        className="absolute left-0 top-0 bottom-0 z-20 w-16 h-full bg-gradient-to-r from-[--bg-color] to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                        aria-label="Scroll left"
                    >
                        <ArrowLeftIcon className="w-8 h-8 text-white rounded-full bg-black/50 p-1" />
                    </button>
                )}
                <div ref={scrollContainerRef} className="flex overflow-x-auto space-x-6 pb-4 px-4 sm:px-6 lg:px-8 hide-scrollbar">
                    {posts.map(post => (
                        <div key={post.id} className="w-80 flex-shrink-0">
                            <DemandCard
                                post={post}
                                onPostSelect={onPostSelect}
                                onUpvote={onUpvote}
                                isSaved={savedPostIds.includes(post.id)}
                                onSaveToggle={onSaveToggle}
                            />
                        </div>
                    ))}
                </div>
                {canScrollRight && (
                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-0 top-0 bottom-0 z-20 w-16 h-full bg-gradient-to-l from-[--bg-color] to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                        aria-label="Scroll right"
                    >
                        <ArrowRightIcon className="w-8 h-8 text-white rounded-full bg-black/50 p-1" />
                    </button>
                )}
            </div>
        </div>
    )
};

const DemandFeed: React.FC<DemandFeedProps> = ({ posts, onPostSelect, onUpvote, savedPostIds, onSaveToggle }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [feedMode, setFeedMode] = useState<'nearMe' | 'trending'>('trending');
    const [isLocating, setIsLocating] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [radius, setRadius] = useState<number>(25);
    const [showSavedOnly, setShowSavedOnly] = useState(false);

    // Ref for virtualization
    const parentRef = useRef<HTMLDivElement>(null);

    const featuredPosts = useMemo(() => {
        return [...posts]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);
    }, [posts]);

    useEffect(() => {
        if (featuredPosts.length <= 1) return;
        const timer = setTimeout(() => {
            setCurrentSlide(prev => (prev + 1) % featuredPosts.length);
        }, 5000); // Auto-slide every 5 seconds
        return () => clearTimeout(timer);
    }, [currentSlide, featuredPosts.length]);

    const handleFeedModeToggle = (mode: 'nearMe' | 'trending') => {
        if (mode === 'nearMe') {
            if (!userLocation) {
                // Request location permission
                setIsLocating(true);
                setLocationError('');
                navigator.geolocation.getCurrentPosition(
                    position => {
                        setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
                        setFeedMode('nearMe');
                        setIsLocating(false);
                    },
                    error => {
                        setLocationError('Could not get location. Please enable location services.');
                        setIsLocating(false);
                    }
                );
            } else {
                setFeedMode('nearMe');
            }
        } else {
            setFeedMode('trending');
        }
    };

    const handleCategoryToggle = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const goToSlide = (index: number) => setCurrentSlide(index);
    const nextSlide = () => setCurrentSlide(prev => (prev + 1) % featuredPosts.length);
    const prevSlide = () => setCurrentSlide(prev => (prev - 1 + featuredPosts.length) % featuredPosts.length);

    const currentFeaturedPost = featuredPosts[currentSlide];

    const filteredPosts = useMemo(() => {
        let processedPosts: (DemandPost & { distance?: number; trendingScore?: number })[] = posts.filter(post => {
            const matchesSearch =
                post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                post.description?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategories.length === 0 ? true : selectedCategories.includes(post.category);
            const matchesSaved = !showSavedOnly || savedPostIds.includes(post.id);
            return matchesSearch && matchesCategory && matchesSaved;
        });

        if (feedMode === 'nearMe' && userLocation) {
            // Near Me: Sort by distance
            return processedPosts
                .map(post => ({
                    ...post,
                    distance: haversineDistance(userLocation, post.location)
                }))
                .filter(post => post.distance <= radius)
                .sort((a, b) => a.distance - b.distance);
        } else if (feedMode === 'trending') {
            // Trending: Sort by upvotes + recency
            return processedPosts
                .map(post => {
                    const ageInDays = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60 * 24);
                    const recencyScore = Math.max(0, 10 - ageInDays); // Newer = higher score
                    const trendingScore = post.upvotes * 2 + recencyScore;
                    return { ...post, trendingScore };
                })
                .sort((a, b) => b.trendingScore! - a.trendingScore!);
        }
        return processedPosts;
    }, [posts, searchTerm, selectedCategories, feedMode, userLocation, radius, savedPostIds, showSavedOnly]);

    const categories = useMemo(() => {
        const cats = [...new Set(posts.map(p => p.category))];
        const categoryCounts = posts.reduce((acc, post) => {
            acc[post.category] = (acc[post.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(categoryCounts);
    }, [posts]);

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            {featuredPosts.length > 0 && !searchTerm && selectedCategories.length === 0 && (
                <div className="h-[calc(100vh-4rem)] w-full relative flex items-end p-8 text-white bg-black overflow-hidden">
                    {/* Background Image Slides */}
                    {featuredPosts.map((post, index) => (
                        <div
                            key={post.id}
                            className={`absolute inset-0 cursor-pointer transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
                            onClick={() => onPostSelect(currentFeaturedPost)}
                        >
                            <div className="absolute inset-0 z-10" style={{ background: 'linear-gradient(to top, rgba(13, 13, 13, 1) 5%, rgba(13, 13, 13, 0.7) 40%, transparent 100%)' }}></div>
                            {post.images.length > 0 && (
                                <img src={getImageUrl(post.images[0])} alt={post.title} className="w-full h-full object-cover" />
                            )}
                        </div>
                    ))}

                    {/* Animation Overlay */}
                    <HeroAnimation />

                    {/* Content */}
                    {currentFeaturedPost && (
                        <div
                            className="relative z-20 max-w-3xl cursor-pointer"
                            onClick={() => onPostSelect(currentFeaturedPost)}
                        >
                            <span className="text-sm font-bold uppercase tracking-widest text-[--primary-color]">{currentFeaturedPost.category}</span>
                            <h1 className="text-4xl md:text-6xl font-extrabold my-2">{currentFeaturedPost.title}</h1>
                            <p className="text-lg text-white/80 max-w-2xl line-clamp-2">{currentFeaturedPost.description}</p>
                            <button className="mt-4 px-6 py-3 bg-[--primary-color] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity">
                                View Details
                            </button>
                        </div>
                    )}

                    {/* Slideshow Controls */}
                    {featuredPosts.length > 1 && (
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-x-12">
                            <button
                                onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                                className="p-2 rounded-full bg-black/30 hover:bg-black/60 transition-colors"
                                aria-label="Previous slide"
                            >
                                <ArrowLeftIcon className="w-6 h-6" />
                            </button>
                            <div className="flex gap-2">
                                {featuredPosts.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={(e) => { e.stopPropagation(); goToSlide(index); }}
                                        className={`w-3 h-3 rounded-full transition-colors ${index === currentSlide ? 'bg-white' : 'bg-white/50 hover:bg-white/75'}`}
                                        aria-label={`Go to slide ${index + 1}`}
                                    />
                                ))}
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                                className="p-2 rounded-full bg-black/30 hover:bg-black/60 transition-colors"
                                aria-label="Next slide"
                            >
                                <ArrowRightIcon className="w-6 h-6" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Filters */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 my-8 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[--text-secondary]" />
                        <input
                            type="text"
                            placeholder="Search demands by keyword..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[--card-color] border-2 border-[--border-color] rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[--primary-color]"
                        />
                    </div>
                    {/* Feed Mode Toggle: Near Me vs Trending */}
                    <div className="flex items-center gap-0 bg-[--card-color] rounded-lg border-2 border-[--border-color] p-1">
                        <button
                            onClick={() => handleFeedModeToggle('nearMe')}
                            disabled={isLocating}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all duration-300 font-semibold ${feedMode === 'nearMe'
                                    ? 'bg-[--primary-color] text-white shadow-lg'
                                    : 'text-[--text-secondary] hover:text-white'
                                }`}
                        >
                            {isLocating && feedMode !== 'nearMe' ? <LoadingSpinner className="w-4 h-4" /> : <LocationPinIcon className="w-4 h-4" />}
                            <span>Near Me</span>
                        </button>
                        <button
                            onClick={() => handleFeedModeToggle('trending')}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all duration-300 font-semibold ${feedMode === 'trending'
                                    ? 'bg-[--primary-color] text-white shadow-lg'
                                    : 'text-[--text-secondary] hover:text-white'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <span>Trending</span>
                        </button>
                    </div>
                    <button
                        onClick={() => setShowSavedOnly(!showSavedOnly)}
                        className={`flex-shrink-0 w-full md:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${showSavedOnly
                            ? 'bg-yellow-400 border-yellow-400 text-black font-semibold'
                            : 'bg-[--card-color] border-[--border-color] hover:border-[--text-secondary]'
                            }`}
                    >
                        <BookmarkIcon className="w-5 h-5" isFilled={showSavedOnly} />
                        <span>Saved</span>
                    </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setSelectedCategories([])}
                        className={`px-3 py-1.5 text-sm rounded-full transition-colors font-medium ${selectedCategories.length === 0
                            ? 'bg-[--primary-color] text-white'
                            : 'bg-white/5 text-[--text-secondary] hover:bg-white/10 hover:text-white'
                            }`}
                    >
                        All Categories
                    </button>
                    {categories.map(([category]) => (
                        <button
                            key={category}
                            onClick={() => handleCategoryToggle(category)}
                            className={`px-3 py-1.5 text-sm rounded-full transition-colors font-medium ${selectedCategories.includes(category)
                                ? 'bg-[--primary-color] text-white'
                                : 'bg-white/5 text-[--text-secondary] hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
                {feedMode === 'nearMe' && (
                    <div className="pt-2 flex items-center gap-2 flex-wrap">
                        <span className="text-[--text-secondary] text-sm font-medium mr-2">Radius:</span>
                        {[5, 10, 25, 50].map(r => (
                            <button
                                key={r}
                                onClick={() => setRadius(r)}
                                className={`px-3 py-1 text-sm rounded-full transition-colors ${radius === r
                                        ? 'bg-[--primary-color] text-white font-semibold'
                                        : 'bg-white/5 hover:bg-white/10'
                                    }`}
                            >
                                {r} km
                            </button>
                        ))}
                    </div>
                )}
                {locationError && <p className="text-red-500 text-sm mt-2">{locationError}</p>}
            </div>

            {filteredPosts.length === 0 ? (
                <EmptyState
                    title={showSavedOnly ? "No Saved Demands" : "No Demands Found"}
                    message={showSavedOnly ? "You haven't saved any demands yet. Click the bookmark icon on a post to save it." : "Try adjusting your search or filters. Or, be the first to post a demand!"}
                />
            ) : feedMode === 'nearMe' || searchTerm || selectedCategories.length > 0 || showSavedOnly ? (
                <VirtualizedGrid
                    posts={filteredPosts}
                    onPostSelect={onPostSelect}
                    onUpvote={onUpvote}
                    savedPostIds={savedPostIds}
                    onSaveToggle={onSaveToggle}
                />
            ) : (
                posts.reduce((acc, post) => {
                    if (!acc.find(cat => cat.title === post.category)) {
                        acc.push({
                            title: post.category,
                            posts: posts.filter(p => p.category === post.category)
                        });
                    }
                    return acc;
                }, [] as { title: string, posts: DemandPost[] }[]).map(({ title, posts }) => (
                    <CategoryRow
                        key={title}
                        title={title}
                        posts={posts}
                        onPostSelect={onPostSelect}
                        onUpvote={onUpvote}
                        onSaveToggle={onSaveToggle}
                        savedPostIds={savedPostIds}
                    />
                ))
            )}
        </div>
    );
};

// Virtualized Grid Component for performance with 1000+ posts
interface VirtualizedGridProps {
    posts: (DemandPost & { distance?: number; trendingScore?: number })[];
    onPostSelect: (post: DemandPost) => void;
    onUpvote: (id: string) => void;
    savedPostIds: string[];
    onSaveToggle: (id: string) => void;
}

const VirtualizedGrid: React.FC<VirtualizedGridProps> = ({ posts, onPostSelect, onUpvote, savedPostIds, onSaveToggle }) => {
    const parentRef = useRef<HTMLDivElement>(null);
    const [columnCount, setColumnCount] = useState(4);

    // Update column count based on window size
    useEffect(() => {
        const updateColumns = () => {
            const width = window.innerWidth;
            if (width < 640) setColumnCount(1);
            else if (width < 768) setColumnCount(2);
            else if (width < 1024) setColumnCount(3);
            else setColumnCount(4);
        };
        updateColumns();
        window.addEventListener('resize', updateColumns);
        return () => window.removeEventListener('resize', updateColumns);
    }, []);

    const rowVirtualizer = useVirtualizer({
        count: Math.ceil(posts.length / columnCount),
        getScrollElement: () => parentRef.current,
        estimateSize: () => 450, // Estimated card height
        overscan: 2,
    });

    return (
        <div ref={parentRef} className="container mx-auto px-4 sm:px-6 lg:px-8 h-[calc(100vh-20rem)] overflow-auto">
            <div
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const startIdx = virtualRow.index * columnCount;
                    const rowPosts = posts.slice(startIdx, startIdx + columnCount);

                    return (
                        <div
                            key={virtualRow.key}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                            }}
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {rowPosts.map(post => (
                                    <DemandCard
                                        key={post.id}
                                        post={post}
                                        onPostSelect={onPostSelect}
                                        onUpvote={onUpvote}
                                        isSaved={savedPostIds.includes(post.id)}
                                        onSaveToggle={onSaveToggle}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DemandFeed;
