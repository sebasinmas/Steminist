import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

const Card: React.FC<CardProps> = ({ children, className }) => {
    return (
        <div className={`bg-card border border-border rounded-lg shadow-sm p-6 ${className}`}>
            {children}
        </div>
    );
};

export default Card;
