import React, { useState, useMemo } from 'react';

interface AvatarProps {
    src?: string | null;
    alt: string;
    className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt, className = 'w-10 h-10' }) => {
    const [imageError, setImageError] = useState(false);

    const initials = useMemo(() => {
        return alt
            ?.split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase() || '?';
    }, [alt]);

    // Generate a consistent pastel color based on the name
    const stringToColor = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = Math.abs(hash) % 360;
        return `hsl(${h}, 70%, 80%)`; // Pastel colors
    };

    const stringToTextColor = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = Math.abs(hash) % 360;
        return `hsl(${h}, 70%, 30%)`; // Darker version for text
    }

    const backgroundColor = useMemo(() => stringToColor(alt || ''), [alt]);
    const textColor = useMemo(() => stringToTextColor(alt || ''), [alt]);

    if (src && !imageError) {
        return (
            <img
                src={src}
                alt={alt}
                className={`${className} object-cover rounded-full`}
                onError={() => setImageError(true)}
            />
        );
    }

    return (
        <div
            className={`${className} rounded-full flex items-center justify-center font-bold text-sm select-none`}
            style={{ backgroundColor, color: textColor }}
            aria-label={alt}
        >
            {initials}
        </div>
    );
};
