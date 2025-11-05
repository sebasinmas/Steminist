import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, XIcon, InformationCircleIcon } from './Icons';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onDismiss: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onDismiss }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Animate in on mount
        const enterTimer = setTimeout(() => setIsVisible(true), 10);

        // Set timer for auto-dismissal, which will trigger the exit animation
        const dismissTimer = setTimeout(() => {
            handleDismiss();
        }, 5000);

        return () => {
            clearTimeout(enterTimer);
            clearTimeout(dismissTimer);
        };
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        // Wait for animation to finish before calling parent onDismiss to remove from DOM
        setTimeout(onDismiss, 300);
    };

    const typeStyles = {
        success: {
            icon: <CheckCircleIcon className="w-6 h-6 text-green-500" />,
            bar: 'bg-green-500',
        },
        error: {
            icon: <XCircleIcon className="w-6 h-6 text-red-500" />,
            bar: 'bg-red-500',
        },
        info: {
            icon: <InformationCircleIcon className="w-6 h-6 text-blue-500" />,
            bar: 'bg-blue-500',
        },
    };

    const { icon, bar } = typeStyles[type];

    return (
        <div 
            className={`
                flex items-start w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden transition-all duration-300 ease-in-out
                ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
            `}
            role="alert"
            aria-live="assertive"
        >
            <div className={`w-1.5 h-full self-stretch ${bar}`}></div>
            <div className="flex items-center p-4">
                <div className="flex-shrink-0">{icon}</div>
                <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-foreground">{message}</p>
                </div>
            </div>
            <div className="ml-auto pl-3 py-2 pr-3">
                <button 
                    onClick={handleDismiss} 
                    className="-mx-1.5 -my-1.5 inline-flex rounded-md p-1.5 text-muted-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Dismiss"
                >
                    <XIcon className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
};

export default Toast;