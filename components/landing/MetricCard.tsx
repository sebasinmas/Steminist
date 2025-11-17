import React, { useState, useEffect, useRef } from 'react';

interface MetricCardProps {
    // FIX: Updated the icon prop type to be more specific. This tells TypeScript that the icon is a React element that accepts a className prop, resolving the error with React.cloneElement.
    icon: React.ReactElement<{ className?: string }>;
    value: number;
    label: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, value, label }) => {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated.current) {
                    hasAnimated.current = true;
                    let start = 0;
                    const end = value;
                    if (start === end) return;

                    const duration = 2000; // 2 seconds
                    const frameDuration = 1000 / 60; // 60fps
                    const totalFrames = Math.round(duration / frameDuration);
                    let frame = 0;
                    
                    const counter = () => {
                        frame++;
                        const progress = frame / totalFrames;
                        const currentCount = Math.round(end * progress);

                        setCount(currentCount > end ? end : currentCount);

                        if (frame < totalFrames) {
                            requestAnimationFrame(counter);
                        }
                    };
                    
                    requestAnimationFrame(counter);
                }
            },
            { threshold: 0.1 }
        );

        const currentRef = ref.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [value]);

    return (
        <div ref={ref} className="bg-card p-6 rounded-xl border border-border shadow-lg text-center transform hover:-translate-y-2 transition-transform duration-300 flex flex-col justify-start items-center">
            <div className="text-magenta mx-auto h-16 w-16 flex items-center justify-center mb-4">
                {React.cloneElement(icon, { className: 'w-12 h-12' })}
            </div>
            <p className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-lilac to-magenta mb-2">
                +{count}
            </p>
            <h3 className="text-md font-semibold text-muted-foreground flex-grow">{label}</h3>
        </div>
    );
};

export default MetricCard;
