import React, { useState, useEffect } from 'react';

type AspectRatio = '21:9' | '16:9' | '4:3' | '1:1' | 'video';
type ObjectFit = 'cover' | 'contain';

interface ImageContainerProps {
    src: string;
    alt: string;
    aspectRatio: AspectRatio;
    objectFit?: ObjectFit;
    loading?: 'lazy' | 'eager';
    showSkeleton?: boolean;
    className?: string;
}

const aspectRatioClasses: Record<AspectRatio, string> = {
    '21:9': 'aspect-[21/9]',
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
    'video': 'aspect-video',
};

const ImageContainer: React.FC<ImageContainerProps> = ({
    src,
    alt,
    aspectRatio,
    objectFit = 'cover',
    loading = 'lazy',
    showSkeleton = true,
    className = '',
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [currentSrc, setCurrentSrc] = useState(src);
    const [retryIndex, setRetryIndex] = useState(0);

    const aspectClass = aspectRatioClasses[aspectRatio];
    const objectFitClass = objectFit === 'cover' ? 'object-cover' : 'object-contain';

    // Extensions to try if image fails to load (for legacy images without extensions)
    const extensionsToTry = ['.jpg', '.jpeg', '.png', '.gif'];

    // Reset state when src changes
    useEffect(() => {
        setCurrentSrc(src);
        setIsLoaded(false);
        setHasError(false);
        setRetryIndex(0);
    }, [src]);

    const handleError = () => {
        // If the original src doesn't have an extension and we haven't tried all fallbacks
        if (!src.match(/\.(jpg|jpeg|png|gif|webp)$/i) && retryIndex < extensionsToTry.length) {
            // Try adding the next extension
            setCurrentSrc(src + extensionsToTry[retryIndex]);
            setRetryIndex(retryIndex + 1);
        } else {
            // All retries failed or original had an extension
            setHasError(true);
        }
    };

    return (
        <div className={`relative ${aspectClass} bg-gray-800 overflow-hidden ${className}`}>
            {/* Skeleton Loading State */}
            {showSkeleton && !isLoaded && !hasError && (
                <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-pulse" />
            )}

            {/* Error State */}
            {hasError && (
                <div className="absolute inset-0 flex items-center justify-center text-[--text-secondary] bg-gray-800">
                    <div className="text-center">
                        <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm">Image unavailable</p>
                    </div>
                </div>
            )}

            {/* Actual Image */}
            {!hasError && (
                <img
                    src={currentSrc}
                    alt={alt}
                    loading={loading}
                    onLoad={() => setIsLoaded(true)}
                    onError={handleError}
                    className={`w-full h-full ${objectFitClass} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                />
            )}
        </div>
    );
};

export default ImageContainer;
