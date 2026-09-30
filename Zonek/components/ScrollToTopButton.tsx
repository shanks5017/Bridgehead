import React, { useState, useEffect } from 'react';
import { ChevronUpIcon } from './icons';

const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  // Show button when page is scrolled up to a certain distance
  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Set up the event listeners for scroll and footer visibility
  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);

    const footer = document.getElementById('page-footer');
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFooterVisible(entry.isIntersecting);
      },
      { threshold: 0.1 } // Consider footer visible when 10% is showing
    );

    observer.observe(footer);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
      if (footer) {
        observer.unobserve(footer);
      }
    };
  }, []);

  // Scroll to top smoothly
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-[--primary-color] rounded-full text-white shadow-lg flex items-center justify-center z-50 transition-all duration-300 ease-in-out hover:scale-110 hover:shadow-xl ${
        (isVisible && !isFooterVisible) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5 pointer-events-none'
      }`}
      aria-label="Go to top"
    >
      <ChevronUpIcon className="w-6 h-6" />
    </button>
  );
};

export default ScrollToTopButton;
