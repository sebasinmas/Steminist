import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    // FIX: Added 'destructive' variant for buttons that signal a destructive action, fixing a type error in TerminationRequestModal.tsx.
    variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
    size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', size = 'md', ...props }) => {
    const baseStyles = 'font-bold py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantStyles = {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 focus:ring-secondary',
        ghost: 'bg-transparent text-foreground hover:bg-accent focus:ring-accent',
        // FIX: Added styles for the new 'destructive' variant.
        destructive: 'bg-red-600 text-primary-foreground hover:bg-red-700 focus:ring-red-600',
    };

    const sizeStyles = {
        sm: 'text-sm py-1 px-2',
        md: 'text-base py-2 px-4',
        lg: 'text-lg py-3 px-6',
    };

    return (
        <button
            className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;