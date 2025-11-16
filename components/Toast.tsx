import React, { useEffect, useState } from 'react';
import type { Toast as ToastType } from '../types';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, XIcon } from './Icons';

interface ToastProps {
    toast: ToastType;
    onDismiss: (id: string) => void;
}

const ICONS: Record<ToastType['type'], React.ReactNode> = {
    success: <CheckCircleIcon className="h-6 w-6 text-green-500" />,
    error: <XCircleIcon className="h-6 w-6 text-red-500" />,
    info: <InformationCircleIcon className="h-6 w-6 text-blue-500" />,
};

const BORDER_COLORS: Record<ToastType['type'], string> = {
    success: 'border-green-500',
    error: 'border-red-500',
    info: 'border-blue-500',
};

const TOAST_TIMEOUT = 5000; // 5 seconds

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
    const { id, type, title, message } = toast;
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            // Wait for exit animation to complete before removing from DOM
            setTimeout(() => onDismiss(id), 300);
        }, TOAST_TIMEOUT);

        return () => clearTimeout(timer);
    }, [id, onDismiss]);
    
    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => onDismiss(id), 300);
    };

    return (
        <div 
            role="alert"
            className={`
                w-full max-w-sm bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden
                border-l-4 ${BORDER_COLORS[type]}
                transition-all duration-300 ease-in-out
                ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
            `}
        >
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">{ICONS[type]}</div>
                    <div className="ml-3 w-0 flex-1 pt-0.5">
                        <p className="text-sm font-bold text-gray-900">{title}</p>
                        <p className="mt-1 text-sm text-gray-600">{message}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button
                            onClick={handleDismiss}
                            className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9c4dff]"
                            aria-label="Close notification"
                        >
                            <span className="sr-only">Close</span>
                            <XIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Toast;
