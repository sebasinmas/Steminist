import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
    size?: 'sm' | 'md' | 'lg';
    as?: 'button' | 'span';
}

const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', size = 'md', as = 'button', ...props }) => {
    const baseStyles = 'font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center';
    
    const variantStyles = {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 focus:ring-secondary',
        ghost: 'bg-transparent text-foreground hover:bg-accent focus:ring-accent',
        destructive: 'bg-red-600 text-primary-foreground hover:bg-red-700 focus:ring-red-600',
    };

    const sizeStyles = {
        sm: 'text-sm py-1 px-2',
        md: 'text-base py-2 px-4',
        lg: 'text-lg py-3 px-6',
    };

    const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

    if (as === 'span') {
        return (
            <span className={combinedClassName}>
                {children}
            </span>
        );
    }

    return (
        <button
            className={combinedClassName}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
