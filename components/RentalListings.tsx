
import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { RentalPost } from '../types';
import RentalCard from './RentalCard';
import { EmptyState } from './LandingPages';
import { SearchIcon, ArrowLeftIcon, ArrowRightIcon, LocationPinIcon, LoadingSpinner, BookmarkIcon } from './icons';

interface RentalListingsProps {
    posts: RentalPost[];
    onPostSelect: (post: RentalPost) => void;
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


const CategoryRow: React.FC<{
    title: string;
    posts: RentalPost[];
    onPostSelect: (post: RentalPost) => void;
    savedPostIds: string[];
    onSaveToggle: (id: string) => void;
}> = ({ title, posts, onPostSelect, savedPostIds, onSaveToggle }) => {
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
                            <RentalCard post={post} onPostSelect={onPostSelect} isSaved={savedPostIds.includes(post.id)} onSaveToggle={onSaveToggle} />
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

const RentalListings: React.FC<RentalListingsProps> = ({ posts, onPostSelect, savedPostIds, onSaveToggle }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [sortByDistance, setSortByDistance] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [radius, setRadius] = useState<number>(25);
    const [showSavedOnly, setShowSavedOnly] = useState(false);

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

    const handleSortByDistance = () => {
        if (sortByDistance) {
            setSortByDistance(false);
            setUserLocation(null);
            setLocationError('');
            setRadius(25); // Reset to default
            return;
        }

        setIsLocating(true);
        setLocationError('');
        navigator.geolocation.getCurrentPosition(
            position => {
                setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
                setSortByDistance(true);
                setIsLocating(false);
            },
            error => {
                setLocationError('Could not get location. Please enable location services.');
                setIsLocating(false);
            }
        );
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
        let processedPosts: (RentalPost & { distance?: number })[] = posts.filter(post => {
            const matchesSearch =
                post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                post.description?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategories.length === 0 ? true : selectedCategories.includes(post.category);
            const matchesSaved = !showSavedOnly || savedPostIds.includes(post.id);
            return matchesSearch && matchesCategory && matchesSaved;
        });

        if (sortByDistance && userLocation) {
            return processedPosts
                .map(post => ({
                    ...post,
                    distance: haversineDistance(userLocation, post.location)
                }))
                .filter(post => post.distance <= radius)
                .sort((a, b) => a.distance - b.distance);
        }
        return processedPosts;

    }, [posts, searchTerm, selectedCategories, sortByDistance, userLocation, radius, savedPostIds, showSavedOnly]);

    const categories = useMemo(() => {
        const categoryCounts = posts.reduce((acc, post) => {
            acc[post.category] = (acc[post.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(categoryCounts);
    }, [posts]);

    return (
        <div className="min-h-screen">
            {featuredPosts.length > 0 && !searchTerm && selectedCategories.length === 0 && (
                <div
                    onClick={() => currentFeaturedPost && onPostSelect(currentFeaturedPost)}
                    className="h-[calc(100vh-4rem)] w-full relative flex items-end p-8 text-white bg-black overflow-hidden cursor-pointer"
                >
                    {/* Background Image Slides */}
                    {featuredPosts.map((post, index) => (
                        <div
                            key={post.id}
                            className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                        >
                            <div className="absolute inset-0 z-10" style={{ background: 'linear-gradient(to top, rgba(13, 13, 13, 1) 5%, rgba(13, 13, 13, 0.7) 40%, transparent 100%)' }}></div>
                            {post.images.length > 0 && (
                                <img src={post.images[0]} alt={post.title} className="w-full h-full object-cover" />
                            )}
                        </div>
                    ))}

                    {/* Content */}
                    {currentFeaturedPost && (
                        <div className="relative z-20 max-w-3xl">
                            <span className="text-sm font-bold uppercase tracking-widest text-[--primary-color]">{currentFeaturedPost.category}</span>
                            <h1 className="text-4xl md:text-6xl font-extrabold my-2">{currentFeaturedPost.title}</h1>
                            <p className="text-lg text-white/80 max-w-2xl line-clamp-2">${currentFeaturedPost.price.toLocaleString()}/mo for {currentFeaturedPost.squareFeet.toLocaleString()} sqft</p>
                        </div>
                    )}

                    {/* Slideshow Controls */}
                    {featuredPosts.length > 1 && (
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-x-12">
                            <button onClick={(e) => { e.stopPropagation(); prevSlide(); }} className="p-2 rounded-full bg-black/30 hover:bg-black/60 transition-colors" aria-label="Previous slide">
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
                            <button onClick={(e) => { e.stopPropagation(); nextSlide(); }} className="p-2 rounded-full bg-black/30 hover:bg-black/60 transition-colors" aria-label="Next slide">
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
                            placeholder="Search rentals by keyword..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[--card-color] border-2 border-[--border-color] rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[--primary-color]"
                        />
                    </div>

                    <button
                        onClick={handleSortByDistance}
                        disabled={isLocating}
                        className={`flex-shrink-0 w-full md:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors disabled:opacity-50 ${sortByDistance
                            ? 'bg-[--primary-color] border-[--primary-color] text-white'
                            : 'bg-[--card-color] border-[--border-color] hover:border-[--text-secondary]'
                            }`}
                    >
                        {isLocating ? <LoadingSpinner className="w-5 h-5" /> : <LocationPinIcon className="w-5 h-5" />}
                        <span>Nearby</span>
                    </button>
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
                        All Types
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
                {sortByDistance && (
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
                    title={showSavedOnly ? "No Saved Rentals" : "No Rentals Found"}
                    message={showSavedOnly ? "You haven't saved any rentals yet. Click the bookmark icon on a listing to save it." : "Try adjusting your search or filters. Or, check back later for new listings!"}
                />
            ) : sortByDistance || searchTerm || selectedCategories.length > 0 || showSavedOnly ? (
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredPosts.map(post => <RentalCard key={post.id} post={post} onPostSelect={onPostSelect} isSaved={savedPostIds.includes(post.id)} onSaveToggle={onSaveToggle} />)}
                    </div>
                </div>
            ) : (
                posts.reduce((acc, post) => {
                    if (!acc.find(cat => cat.title === post.category)) {
                        acc.push({
                            title: post.category,
                            posts: posts.filter(p => p.category === post.category)
                        });
                    }
                    return acc;
                }, [] as { title: string, posts: RentalPost[] }[]).map(({ title, posts }) => (
                    <CategoryRow key={title} title={title} posts={posts} onPostSelect={onPostSelect} savedPostIds={savedPostIds} onSaveToggle={onSaveToggle} />
                ))
            )}
        </div>
    );
};

export default RentalListings;
