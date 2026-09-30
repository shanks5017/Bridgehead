import React from 'react';

interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'outline' | 'filled' | 'elevated';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const PremiumCard: React.FC<PremiumCardProps> = ({
  children,
  className = '',
  variant = 'filled',
  shadow = 'sm',
  padding = 'md',
  ...props
}) => {
  const baseStyles = 'bg-white border border-ink transition-all duration-300';
  
  const variants = {
    outline: 'bg-transparent',
    filled: 'bg-white',
    elevated: 'bg-white neo-shadow-md',
  };

  const shadows = {
    none: '',
    sm: 'neo-shadow-sm hover:neo-shadow-md',
    md: 'neo-shadow-md hover:neo-shadow-lg',
    lg: 'neo-shadow-lg',
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6 md:p-8',
    lg: 'p-10 md:p-12',
  };

  return (
    <div
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${shadows[shadow]}
        ${paddings[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export default PremiumCard;
