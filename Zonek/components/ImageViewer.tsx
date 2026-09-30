
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeftIcon, ArrowRightIcon, XIcon } from './icons';

interface ImageViewerProps {
  images: string[];
  startIndex: number;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ images, startIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  const goToPrevious = useCallback(() => {
    setCurrentIndex(prevIndex => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex(prevIndex => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  }, [images.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToPrevious, goToNext, onClose]);
  
  if (!images || images.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
      <div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-50"
          aria-label="Close image viewer"
        >
          <XIcon className="w-8 h-8" />
        </button>

        {/* Previous Button */}
        {images.length > 1 && (
            <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white transition-all z-50"
            aria-label="Previous image"
            >
            <ArrowLeftIcon className="w-8 h-8" />
            </button>
        )}
        
        {/* Image Display */}
        <div className="relative w-full max-w-6xl h-full max-h-[90vh] flex items-center justify-center">
            <img
                src={images[currentIndex]}
                alt={`View ${currentIndex + 1} of ${images.length}`}
                className="max-h-full max-w-full object-contain"
            />
        </div>

        {/* Next Button */}
        {images.length > 1 && (
            <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/60 text-white transition-all z-50"
            aria-label="Next image"
            >
            <ArrowRightIcon className="w-8 h-8" />
            </button>
        )}

        {/* Counter */}
        {images.length > 1 && (
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
                {currentIndex + 1} / {images.length}
            </div>
        )}
      </div>
    </div>
  );
};

export default ImageViewer;
