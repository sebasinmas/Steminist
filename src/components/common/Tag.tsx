import React from 'react';

interface TagProps {
    children: React.ReactNode;
    className?: string;
}

const Tag: React.FC<TagProps> = ({ children, className }) => {
    return (
        <span className={`inline-block bg-secondary text-secondary-foreground text-xs font-semibold mr-2 mb-2 px-2.5 py-0.5 rounded-full ${className}`}>
            {children}
        </span>
    );
};

export default Tag;
