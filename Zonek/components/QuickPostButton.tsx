import React, { useState, useRef, useEffect } from 'react';
import { View } from '../types';

interface QuickPostButtonProps {
    setView: (view: View) => void;
    isChatbotOpen: boolean;
}

const QuickPostButton: React.FC<QuickPostButtonProps> = ({ setView, isChatbotOpen }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [magneticPos, setMagneticPos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Calculate distance from center
        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        
        // Magnetic pull (max 8px)
        const pull = 8;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 60) {
            setMagneticPos({ x: (dx / 60) * pull, y: (dy / 60) * pull });
        } else {
            setMagneticPos({ x: 0, y: 0 });
        }
    };

    const handleMouseLeave = () => {
        setMagneticPos({ x: 0, y: 0 });
    };

    const handleAction = (view: View) => {
        setView(view);
        setIsExpanded(false);
    };

    if (isChatbotOpen) return null;

    return (
        <div className="fixed bottom-24 right-6 z-[70] flex flex-col-reverse items-end gap-4">
            {/* Staggered Options */}
            {isExpanded && (
                <div className="flex flex-col-reverse items-end gap-3 mb-2">
                    <button
                        onClick={() => handleAction(View.POST_RENTAL)}
                        className="animate-spring stagger-1 group flex items-center gap-3 glass-morphic text-white px-6 py-3 rounded-full shadow-premium-green hover:bg-[#22C55E] hover:text-ink transition-all duration-300"
                    >
                        <span className="text-xl group-hover:scale-120 transition-transform">🏢</span>
                        <span className="font-bold uppercase tracking-widest text-[10px]">Registry Asset</span>
                    </button>
                    <button
                        onClick={() => handleAction(View.POST_DEMAND)}
                        className="animate-spring stagger-2 group flex items-center gap-3 glass-morphic text-white px-6 py-3 rounded-full shadow-premium-green hover:bg-[#22C55E] hover:text-ink transition-all duration-300"
                    >
                        <span className="text-xl group-hover:scale-120 transition-transform">📢</span>
                        <span className="font-bold uppercase tracking-widest text-[10px]">Emit Signal</span>
                    </button>
                </div>
            )}

            {/* Main Magnetic Toggle Button */}
            <div 
                className="magnetic-wrap"
                style={{ transform: `translate3d(${magneticPos.x}px, ${magneticPos.y}px, 0)` }}
            >
                <button
                    ref={buttonRef}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`
                        w-20 h-20 rounded-full flex items-center justify-center 
                        transition-all duration-500 shadow-premium-green shimmer-green
                        ${isExpanded ? 'bg-[#141414] border-2 border-[#22C55E]' : 'bg-[#22C55E] border-2 border-transparent'}
                    `}
                    aria-label={isExpanded ? 'Close Menu' : 'Open Menu'}
                >
                    <div className={`relative w-8 h-8 transition-transform duration-500 ${isExpanded ? 'rotate-135' : ''}`}>
                        {/* Custom SVG Morphing '+' */}
                        <span className={`absolute top-1/2 left-0 w-full h-1 bg-current rounded-full transition-all duration-500 ${isExpanded ? 'bg-[#22C55E]' : 'bg-ink'}`} />
                        <span className={`absolute top-0 left-1/2 h-full w-1 bg-current rounded-full transition-all duration-500 ${isExpanded ? 'bg-[#22C55E]' : 'bg-ink'}`} />
                    </div>
                    
                    {/* Ring Glow */}
                    <div className={`absolute inset-0 rounded-full border border-[#22C55E]/50 transition-all duration-500 scale-110 ${isExpanded ? 'opacity-100 animate-pulse' : 'opacity-0'}`} />
                </button>
            </div>

            {/* Backdrop */}
            {isExpanded && (
                <div
                    className="fixed inset-0 bg-ink/40 backdrop-blur-sm -z-10 transition-opacity duration-500"
                    onClick={() => setIsExpanded(false)}
                />
            )}
        </div>
    );
};

export default QuickPostButton;
