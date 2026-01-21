import React from 'react';

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    icon?: React.ReactNode;
    className?: string;
    variant?: 'primary' | 'secondary';
}

const PremiumButton: React.FC<PremiumButtonProps> = ({
    children,
    icon,
    className = '',
    variant = 'primary',
    ...props
}) => {
    // Base styles for all premium buttons
    const baseStyles = "relative flex items-center justify-center gap-2 rounded-full font-bold transition-all duration-300 overflow-hidden group/btn";

    // Variant specific styles
    const variants = {
        primary: "text-white bg-gradient-to-r from-red-600 via-red-500 to-red-600 shadow-lg shadow-red-500/20 hover:shadow-red-500/40",
        secondary: "bg-[--card-color] border border-[--border-color] text-white hover:border-red-500/50 hover:shadow-lg hover:shadow-red-900/20"
    };

    const gradientStyle = variant === 'primary' ? {
        backgroundSize: '200% 100%',
        backgroundImage: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #dc2626 100%)'
    } : {};

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            style={gradientStyle}
            {...props}
        >
            {/* Shimmer Effect for Primary Variant */}
            {variant === 'primary' && (
                <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-white/20 to-red-600/0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"
                    style={{
                        animation: 'shimmer 2s infinite linear'
                    }}
                />
            )}

            {/* Content */}
            <span className="relative z-10 flex items-center justify-center gap-2">
                {children}
                {icon && (
                    <span className="transition-transform duration-300 group-hover/btn:translate-x-1">
                        {icon}
                    </span>
                )}
            </span>
        </button>
    );
};

export default PremiumButton;
