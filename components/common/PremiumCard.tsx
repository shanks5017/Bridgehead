import React from 'react';

interface PremiumCardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

const PremiumCard: React.FC<PremiumCardProps> = ({ children, className = '', onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`
                bg-[--card-color] 
                border border-[--border-color] 
                rounded-[2.5rem] 
                overflow-hidden 
                group 
                relative 
                transition-all duration-300 
                hover:border-red-500/50 
                hover:shadow-2xl hover:shadow-red-500/10 
                hover:scale-[1.01]
                ${onClick ? 'cursor-pointer' : ''} 
                ${className}
            `}
        >
            {/* Internal Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 h-full w-full">
                {children}
            </div>
        </div>
    );
};

export default React.memo(PremiumCard);
