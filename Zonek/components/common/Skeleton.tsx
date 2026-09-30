import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'rect' | 'circle';
    width?: string | number;
    height?: string | number;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
    className = '', 
    variant = 'rect', 
    width, 
    height 
}) => {
    const baseStyles = "relative overflow-hidden bg-[#181818] rounded-md";
    
    const variantStyles = {
        text: "h-3 w-full mb-2 last:w-3/4 rounded-sm",
        rect: "w-full h-full",
        circle: "rounded-full"
    };

    const style = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
    };

    return (
        <div 
            className={`${baseStyles} ${variantStyles[variant]} ${className}`}
            style={style}
        >
            {/* Shimmer effect overlay */}
            <div className="absolute inset-0 -translate-x-full animate-skeleton-shimmer bg-gradient-to-r from-transparent via-[#222] to-transparent"></div>
            
            <style>{`
                @keyframes skeleton-shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-skeleton-shimmer {
                    animation: skeleton-shimmer 2s infinite linear;
                }
            `}</style>
        </div>
    );
};

export default Skeleton;
