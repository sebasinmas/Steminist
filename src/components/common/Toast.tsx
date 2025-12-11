import React, { useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, XIcon } from './Icons';

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'info';
    onDismiss: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onDismiss, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onDismiss]);

    const bgColors = {
        success: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-900',
        error: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-900',
        info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-900',
    };

    const textColors = {
        success: 'text-green-800 dark:text-green-300',
        error: 'text-red-800 dark:text-red-300',
        info: 'text-blue-800 dark:text-blue-300',
    };

    const iconColors = {
        success: 'text-green-500',
        error: 'text-red-500',
        info: 'text-blue-500',
    };

    const Icon = type === 'success' ? CheckCircleIcon : type === 'error' ? XCircleIcon : InformationCircleIcon;

    return (
        <div className={`flex items-start p-4 mb-4 rounded-lg border shadow-sm ${bgColors[type]} transition-all animate-in slide-in-from-right-5 fade-in duration-300`}>
            <Icon className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${iconColors[type]}`} />
            <div className={`flex-1 text-sm font-medium ${textColors[type]}`}>{message}</div>
            <button onClick={onDismiss} className={`ml-3 inline-flex flex-shrink-0 justify-center items-center h-5 w-5 rounded-md ${textColors[type]} hover:bg-black/5 focus:outline-none`}>
                <XIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

export default Toast;